import '@shgysk8zer0/polyfills';
import { contextFallback as context } from './context.js';
import { METHOD_NOT_ALLOWED, MOVED_PERMANENTLY, FOUND, SEE_OTHER, TEMPORARY_REDIRECT, PERMANENT_REDIRECT, NOT_ACCEPTABLE, UNAUTHORIZED, FORBIDDEN, OK, NO_CONTENT } from '@shgysk8zer0/consts/status.js';
import { NetlifyRequest } from './NetlifyRequest.js';
import { HTML, JSON as JSON_MIME, JSON_LD, FORM_MULTIPART, FORM_URL_ENCODED, TEXT } from '@shgysk8zer0/consts/mimes.js';
import { loadModuleHandler, getFileURL } from './utils.js';
import { HTTPError } from './error.js';
import { ACAO, ACAC, ACAM, ACAH, ACRM, ACRH, ACEH, LOC, AUTH, CONTENT_TYPE, ORIGIN, ACCEPT, ALLOW } from './consts.js';
import { decodeRequestToken, isVerifiedPayload, verifyHeader } from '@shgysk8zer0/jwk-utils/jwt.js';

const between = (min, val, max) => ! (val < min || max > max);

const REDIRECT_STATUSES = [MOVED_PERMANENTLY, FOUND, SEE_OTHER, TEMPORARY_REDIRECT, PERMANENT_REDIRECT];
const JSON_ALT = 'text/json'; // Alternate JSON Mime-Type

/**
 * Retrieves all values of a specified header from a request or response object.
 *
 * @param {Request|Response} object The request or response object.
 * @param {string} name The name of the header.
 * @returns {string[]} An array of header values, or an empty array if the header is not present.
 */
const getAllHeader = ({ headers }, name) => headers.get(name)
	?.split(',')
	?.map(header => header.trim().toLowerCase())
	?.filter(str => str.length !== 0) ?? [];

function getHandlerModule() {
	return async function(req) {
		const url = getFileURL(req.url);

		try {
			const handler = await loadModuleHandler(url);
			return await handler.call(context, req, context);
		} catch(err) {
			if (err instanceof HTTPError) {
				return err.response;
			} else {
				throw err;
			}
		}
	};
}

/**
 * Represents a test case for a request handler function.
 */
export class RequestHandlerTest {
	#handler;
	#request;
	#response;
	#logger;
	#name;
	#assertionsCallback;
	#errors = [];

	/**
	 * Creates a new RequestHandlerTest instance.
	 *
	 * @param {NetlifyRequest} request - The Request object to use for the test, with the handler defined by the pathname of the Request URL.
	 * @param {AssertionCallback|AssertionCallback[]} [assertionsCallback] - Optional callback function(s) to perform assertions on the response.
	 *
	 * @callback AssertionCallback
	 * @param {Response} response - The Response object returned by the handler.
	 * @param {NetlifyRequest} request - The original Request object used for the test.
	 * @returns {(boolean|string|Error|undefined|null)} A value indicating the result of the assertion:
	 *   - `true`: Assertion passed
	 *   - `false`: Assertion failed
	 *   - `string`: Assertion failed with a custom error message
	 *   - `Error`: Assertion failed with an Error object
	 *   - `undefined` or `null`: Assertion passed (no explicit return value)
	 */

	constructor(request, assertionsCallback, { logger, name } = {}) {
		if (! (request instanceof Request)) {
			throw new TypeError('Test request is not a Request object.');
		} else if (! (request instanceof NetlifyRequest)) {
			this.#request = new NetlifyRequest(request, context);
		} else {
			this.#request = request;
		}

		this.#handler = getHandlerModule(request);

		if (logger instanceof Function) {
			this.#logger = logger;
		}

		if (typeof name === 'string') {
			this.#name = name;
		} else {
			this.#name = 'Unnamed test';
		}

		if (Array.isArray(assertionsCallback) && assertionsCallback.length !== 0) {
			this.#assertionsCallback = async (resp, req) => {
				const errs = [];
				const results = await Promise.allSettled(assertionsCallback.map(async cb => {
					if (! (cb instanceof Function)) {
						throw new TypeError('Invalid assertion callback.');
					} else {
						return cb.call(this, resp, req);
					}
				}));

				for (const result of results) {
					if (result.status === 'rejected') {
						if (result.reason instanceof AggregateError) {
							errs.push(...result.reason.errors);
						} else if (result.reason instanceof Error || result.reason instanceof DOMException) {
							errs.push(result.reason);
						} else {
							errs.push(new Error(result.reason));
						}
					}
				}

				if (errs.length === 1) {
					throw errs[0];
				} else if (errs.length !== 0) {
					throw new AggregateError(errs, 'Some tests failed.');
				}
			};
		} else if (assertionsCallback instanceof Function) {
			this.#assertionsCallback = assertionsCallback;
		} else if (typeof assertionsCallback !== 'undefined') {
			this.#errors.push('Handler assertions must be a function.');
		}
	}

	/**
	 * Gets the body of the response.
	 * @returns {ReadableStream | null} The response body as a ReadableStream, or null if not available.
	 */
	get body() {
		return this.response.body;
	}

	/**
	 * Gets the headers of the response.
	 * @returns {Headers} The response headers as a Headers object.
	 */
	get headers() {
		return this.response.headers;
	}

	get name() {
		return this.#name;
	}

	/**
	 * Gets the Request object upon which tests will be performed.
	 * @returns {NetlifyRequest} The Request object upon which tests will be performed.
	 */
	get request() {
		return this.#request;
	}

	/**
	 * Gets a clone of the Response object returned by the handler, or an empty Response.
	 * @returns {Response} The Response object returned by the handler or an empty Response.
	 */
	get response() {
		if (this.#response instanceof Response) {
			return this.#response;
		} else {
			return Response.error();
		}
	}

	/**
	 * Determines if the request resulted in a redirect.
	 *
	 * This considers:
	 * - The `redirected` property of the Response object.
	 * - Redirect status codes (301, 302, 303, 307, 308) and the presence of a `Location` header.
	 *
	 * @returns {boolean} True if the request was redirected, false otherwise.
	 */
	get redirected() {
		if (! (this.#response instanceof Response)) {
			return false;
		} else if (this.#response.redirected) {
			return true;
		} else if (REDIRECT_STATUSES.includes(this.#response.status) && this.#response.headers.has(LOC)) {
			return true;
		} else {
			return false;
		}
	}

	/**
	 * Gets a URL object representing the request URL, using 'http://localhost:8888/' as the base if no base is present.
	 *
	 * @returns {URL | null} A URL object representing the request URL, or null if the request is not a valid Request object.
	 */
	get url() {
		if (this.#request instanceof Request) {
			return new URL(this.#request.url, 'http://localhost:8888/');
		} else {
			return null;
		}
	}

	/**
	 * Gets an AggregateError object representing any errors that occurred during the test.
	 *
	 * @returns {AggregateError | null} An AggregateError containing all the errors that occurred, or null if no errors occurred.
	 */
	get error() {
		if (this.#errors.length === 0) {
			return null;
		} else {
			return new AggregateError(this.#errors);
		}
	}

	/**
	 * Gets a frozen (immutable) copy of the errors array.
	 *
	 * @returns {ReadonlyArray<Error>} A frozen array of the errors that occurred during the test.
	 */
	get errors() {
		return Object.freeze([...this.#errors]);
	}

	/**
	 * Gets the Content-Type header of the response.
	 *
	 * @returns {string | null} The Content-Type header value, or null if the response does not have a Content-Type header.
	 */
	get contentType() {
		return this.headers.get(CONTENT_TYPE);
	}

	/**
	 * Determines if the response is considered "ok" (status in the range 200-299).
	 *
	 * @returns {boolean} True if the response is ok, false otherwise.
	 */
	get ok() {
		return this.#response instanceof Response ? this.#response.ok : false;
	}

	/**
	 * Gets the HTTP status code of the response.
	 *
	 * @returns {number} The status code of the response, or 0 if the response is not a valid Response object.
	 */
	get status() {
		return this.#response instanceof Response ? this.#response.status : 0;
	}

	/**
	 * Checks if any errors occurred during the test.
	 *
	 * @returns {boolean} True if there are errors, false otherwise.
	 */
	get hasErrors() {
		return this.#errors.length !== 0;
	}

	/**
	 * Retrieves the response body as an ArrayBuffer.
	 *
	 * @returns {Promise<ArrayBuffer>} A promise that resolves to the response body as an ArrayBuffer.
	 */
	async arrayBuffer() {
		try {
			return this.response.arrayBuffer();
		} catch(err) {
			this.#errors.push(err);
			return new ArrayBuffer(0);
		}
	}

	/**
	 * Attempts to parse the response body as JSON.
	 *
	 * @returns {Promise<any | null>} A promise that resolves to the parsed JSON data, or null if parsing fails.
	 */
	async json() {
		try {
			return this.response.json();
		} catch(err) {
			this.#errors.push(err);
			return null;
		}
	}

	/**
	 * Retrieves the response body as FormData.
	 *
	 * @returns {Promise<FormData>} A promise that resolves to the response body as FormData.
	 */
	async formData() {
		try {
			return this.response.formData();
		} catch (err) {
			this.#errors.push(err);
			return new FormData();
		}
	}

	/**
	 * Retrieves the response body as a string.
	 *
	 * @returns {Promise<string>} A promise that resolves to the response body as a string.
	 */
	async text() {
		try {
			return this.response.text();
		} catch(err) {
			this.#errors.push(err);
			return '';
		}
	}

	/**
	 * Executes the request handler function in a safe manner.
	 *
	 * This method attempts to call the handler function with the provided request and context. It captures and stores any errors that occur during execution. If the handler returns a Response object, it will be stored in the `#response` property. If the handler returns an Error object, or if an assertion callback is provided and fails, the error is added to the `#errors` array.
	 *
	 * @returns {Promise<RequestHandlerTest>} A Promise that resolves to this RequestHandlerTest instance, regardless of whether the test succeeded or failed.
	*/
	async runSafe() {
		const { resolve, reject, promise } = Promise.withResolvers();
		const controller = new AbortController();

		try {
			if (! (this.#request instanceof Request)) {
				reject(new TypeError('Invalid Request.'));
			} else if (this.#response instanceof Response) {
				reject(new Error('Test has already been run.'));
			} else if (! (this.#handler instanceof Function)) {
				reject(new Error('Handler is not a Function.'));
			} else if (this.#request.signal instanceof AbortSignal && this.#request.signal.aborted) {
				reject(new Error(`${this.#request.method} <${this.#request.url}> aborted.`, { cause: this.#request.signal.reason }));
			} else {
				console.info(`Testing ${this.#request?.method} <${this.#request?.url}>`);

				controller.signal.addEventListener('abort', ({ target }) => {
					this.#log(`Aborted with reason "${target.reason}".`);
				}, { once: true });

				if (this.#request.signal instanceof AbortSignal) {
					this.#request.signal.addEventListener('abort', ({ target }) => {
						console.warn(target.reason);
						reject(new Error(`${this.#request.method} <${this.#request.url}> aborted.`, { cause: target.reason }));
						controller.abort(target.reason);
					}, { once: true, signal: controller.signal });
				} else {
					reject(new Error('No AbortSignal in Request'));
				}

				const result = await this.#handler.call(context, this.#request, context);

				if (result instanceof HTTPError) {
					resolve(result.response);
					controller.abort('Resolving with an HTTPError Response.');
				} else if (result instanceof Error || result instanceof DOMException) {
					reject(result);
					controller.abort('Result was an error.');
				} else if (! (result instanceof Response)) {
					reject(new TypeError('Handler did not return a Response object or error.'));
					controller.abort('Was not a Response object');
				} else if (this.#assertionsCallback instanceof Function) {
					const assertResult = await this.#assertionsCallback.call(this, result, this.#request);

					if (typeof assertResult === 'boolean') {
						if (assertResult) {
							resolve(result);
							controller.abort('Resolved');
						} else {
							reject(new Error('An assertion failed.'));
							controller.abort('An assertion failed');
						}
					} else if (typeof assertResult === 'undefined' || assertResult === null) {
						resolve(result);
						controller.abort('Assertion passed.');
					} else if (typeof assertResult === 'string') {
						reject(new Error(assertResult));
						controller.abort('Assertion errored.');
					} else if (assertResult instanceof Error || assertResult instanceof DOMException) {
						reject(assertResult);
						controller.abort('Assertion returned an error.');
					} else {
						reject(new TypeError(`Invalid result type from assertion: ${typeof assertResult}`));
						controller.abort('Invalid return from assertion');
					}
				} else {
					resolve(result);
					controller.abort('Resolved normally');
				}
			}
		} catch(err) {
			reject(err);
		}

		await promise.then(response => {
			this.#response = response;
			controller.abort('Completed successfully');
			this.#log('Success!');
		}).catch(err => {
			this.#log(err);

			if (err instanceof AggregateError) {
				this.#errors.push(...err.errors);
			} else if (err instanceof Error || err instanceof DOMException) {
				this.#errors.push(err);
			} else {
				this.#errors.push(new Error(err));
			}
		});
		// Will already have errors if request or callback are invalid

		return this;
	}

	/**
	 * Runs the request handler and throws an error if any occurred during the test.
	 * @param {string} [message] - Optional message to include in the thrown error.
	 * @returns {Promise<RequestHandlerTest>} A promise that resolves to the RequestHandlerTest instance.
	 * @throws {AggregateError} If any errors occurred during the test.
	 */
	async run(message) {
		const errCount = this.#errors.length;

		await this.runSafe();

		if (this.#errors.length !== errCount) {
			throw new AggregateError(this.#errors, message);
		} else {
			return this;
		}
	}

	/**
	 * Checks if a given origin is allowed by Access-Control-Allow-Origin headers of a response.
	 * @param {string} origin - The origin to test against.
	 * @returns {Promise<RequestHandlerTest>} A promise that resolves to the RequestHandlerTest instance.
	 * @throws {AggregateError} If any errors occurred during the test.
	 */
	allowsOrigin(origin) {
		if (typeof origin !== 'string' || ! (this.#response instanceof Response)) {
			return false;
		} else if (! this.#response.headers.has(ACAO)) {
			return false;
		} else {
			const allowed = this.#response.headers.get(ACAO);

			if (allowed === '*') {
				return true;
			} else {
				try {
					return new URL(origin).origin === new URL(allowed).origin;
				} catch {
					return false;
				}
			}
		}
	}

	/**
	 * Throws an AggregateError if any errors occurred during the test.
	 * @param {string} [message] - Optional message to include in the thrown error.
	 * @throws {AggregateError} If any errors occurred during the test.
	 */
	throwIfErrored(message) {
		if (this.#errors.length !== 0) {
			throw new AggregateError(this.#errors, message);
		}
	}

	#log(...what) {
		if (this.#logger instanceof Function) {
			return this.#logger.apply(this, what);
		} else {
			return false;
		}
	}

	/**
	 * Runs multiple RequestHandlerTest instances and collects results.
	 *
	 * @param  {...RequestHandlerTest} tests - The RequestHandlerTest instances to run.
	 * @returns {Promise<{success: RequestHandlerTest[], error?: AggregateError}>} An object containing successful tests and any errors encountered.
	 */
	static async runTests(...tests) {
		try {
			const errors = [];
			const success = [];

			await Promise.all(Array.from(
				tests,
				async test => {
					if (! (test instanceof RequestHandlerTest)) {
						errors.push(new TypeError('Test is not a RequestHandlerTest'));
					} else {
						await test.runSafe('This test has failed');

						if (test.hasErrors) {
							errors.push(...test.errors);
						} else {
							success.push(test.response);
						}
					}
				},
			));

			return { success, error: errors.length === 0 ? null : new AggregateError(errors, 'Some tests failed.') };
		} catch(error) {
			return { success: [], error };
		}
	}

	/**
	 * Checks if the response has a valid status code.
	 *
	 * @param {Response} resp - The response object.
	 * @param {NetlifyRequest} req - The Netlify request object.
	 * @throws {Error} If the response status code is invalid.
	 */
	static shouldHaveValidStatus(resp, req) {
		if (! between(100, resp.status, 599)) {
			throw new Error(`${req.method} <${req.url}> returned an invalid status code of ${resp.status}.`);
		}
	}

	/**
	 * Asserts that a Response object has an informational (1xx) HTTP status code.
	 * @param {Response} resp The Response object to check.
	 * @param {NetlifyRequest} req The Request object associated with the response.
	 * @throws {Error} If the response does not have a 1xx status code.
	 */
	static shouldBeInformational(resp, req) {
		if (! between(100, resp.status, 199)) {
			throw new Error(`${req.method} <${req.url}> should return a 1xx status code. Got ${resp.status}.`);
		}
	}

	/**
	 * Asserts that a Response object has a successful (2xx) HTTP status code.
	 * @param {Response} resp The Response object to check.
	 * @param {NetlifyRequest} req The Request object associated with the response.
	 * @throws {Error} If the response does not have a 2xx status code.
	 */
	static shouldBeOk(resp, req) {
		if (! resp.ok) {
			throw new Error(`${req.method} <${req.url}> should return a 2xx status code. Got ${resp.status}.`);
		}
	}

	/**
	 * Throws an error if the response status is NOT_ACCEPTABLE and the request header ACCEPT is present.
	 *
	 * @param {Response} resp - The response object.
	 * @param {NetlifyRequest} req - The Netlify request object.
	 * @throws {Error} If the response status is NOT_ACCEPTABLE and the request header ACCEPT is present.
	 */
	static shouldAccept(resp, req) {
		if (req.headers.has(ACCEPT) && resp.status === NOT_ACCEPTABLE) {
			throw new Error(`${req.method } <${req.url}> should accept ${req.headers.get(ACCEPT)}.`);
		}
	}

	/**
	 * Throws an error if the response status is not NOT_ACCEPTABLE and the request header ACCEPT is present.
	 *
	 * @param {Response} resp - The response object.
	 * @param {NetlifyRequest} req - The Netlify request object.
	 * @throws {Error} If the response status is not NOT_ACCEPTABLE and the request header ACCEPT is present.
	 */
	static shouldNotAccept(resp, req) {
		if (req.headers.has(ACCEPT) && resp.status !== NOT_ACCEPTABLE) {
			throw new Error(`${req.method } <${req.url}> should not accept ${req.headers.get(ACCEPT)}. Got status of ${resp.status}.`);
		}
	}

	/**
	 * Creates a function that checks if the response has a specific Content-Type.
	 *
	 * @param {string} type - The expected Content-Type.
	 * @returns {function(Response, NetlifyRequest): void} A function that takes a response and request, and throws an error if the Content-Type is incorrect.
	 * @throws {Error} If the response lacks a Content-Type header or the Content-Type doesn't match the expected type.
	 */
	static shouldHaveContentType(type) {
		return (resp, req) => {
			if (! resp.headers.has(CONTENT_TYPE)) {
				throw new Error(`${req.method } <${req.url}> should have a Content-Type set.`);
			} else if (resp.headers.get(CONTENT_TYPE).toLowerCase().split(';')[0] !== type.toLowerCase() ) {
				throw new Error(`${req.method } <${req.url}> should have a Content-Type of ${type}} but got ${resp.headers.get(CONTENT_TYPE)}.`);
			}
		};
	}

	/**
	 * Creates a function that checks if the response has a specific header.
	 *
	 * @param {string} headerName - The name of the expected header.
	 * @returns {function(Response, NetlifyRequest): void} A function that takes a response and request, and throws an error if the header is missing.
	 * @throws {Error} If the response lacks the specified header.
	 */
	static shouldHaveHeader(headerName) {
		return (resp, req) => {
			if (! resp.headers.has(headerName)) {
				throw new Error(`${req.method } <${req.url}> should have an HTTP header ${headerName} but it was not set.`);
			}
		};
	}

	/**
	 * Creates a function that checks if the response does not have a specific header.
	 *
	 * @param {string} headerName - The name of the unexpected header.
	 * @returns {function(Response, NetlifyRequest): void} A function that takes a response and request, and throws an error if the header is present.
	 * @throws {Error} If the response has the specified header.
	 */
	static shouldNotHaveHeader(headerName) {
		return (resp, req) => {
			if (resp.headers.has(headerName)) {
				throw new Error(`${req.method } <${req.url}> should not have an HTTP header ${headerName} but it was set.`);
			}
		};
	}

	/**
	 * Returns a function that checks if the response sets the specified cookies.
	 *
	 * @param {...string} cookies - The names of the cookies that should be set by the response.
	 * @returns {function(Response, Request): void} - A function that takes a response and request, and verifies
	 *     that the response sets the specified cookies.
	 * @throws {Error} - If the response does not set any cookies or if it is missing expected cookies.
	 */
	static shouldSetCookies(...cookies) {
		return (resp, req) => {
			const setCookies = resp.headers.getSetCookie().map(cookie => cookie.split('=')[0]);

			if (setCookies.length === 0) {
				throw new Error(`${req.method} <${req.url} was did not set any cookies but was expected to.`);
			} else {
				const missing = cookies.filter(cookie => ! setCookies.includes(cookie));

				if (missing.length !== 0) {
					throw new Error(`${req.method} <${req.url}> did not set expected cookies: [${missing.join(', ')}].`);
				}
			}
		};
	}

	/**
	 * Returns a function that checks if the response does not set the specified cookies.
	 *
	 * @param {...string} cookies - The names of the cookies that should not be set by the response.
	 * @returns {function(Response, Request): void} - A function that takes a response and request, and verifies
	 *     that the response does not set the specified cookies.
	 * @throws {Error} - If the response sets any of the unexpected cookies.
	 */
	static shouldNotSetCookies(...cookies) {
		return (resp, req) => {
			const setCookies = resp.headers.getSetCookie().map(cookie => cookie.split('=')[0]);

			if (setCookies.length !== 0) {
				const invalid = cookies.filter(cookie => setCookies.includes(cookie));

				if (invalid.length !== 0) {
					throw new Error(`${req.method} <${req.url}> did set unexpected cookies: [${invalid.join(', ')}].`);
				}
			}
		};
	}

	/**
	 * Asserts that the response does have a body.
	 *
	 * @param {Response} resp - The response object to be checked.
	 * @param {Request} req - The request object associated with the response.
	 * @throws {Error} - If the response body is not a `ReadableStream`, indicating that a body is not present.
	 */
	static shouldHaveBody(resp, req) {
		if (! (resp.body instanceof ReadableStream)) {
			throw new Error(`${req.method} <${req.url}> should have a body.`);
		}
	}

	/**
	 * Asserts that the response does not have a body.
	 *
	 * @param {Response} resp - The response object to be checked.
	 * @param {Request} req - The request object associated with the response.
	 * @throws {Error} - If the response body is a `ReadableStream`, indicating that a body is present.
	 */
	static shouldNotHaveBody(resp, req) {
		if (resp.body instanceof ReadableStream) {
			throw new Error(`${req.method} <${req.url}> should not have a body.`);
		}
	}

	/**
	 * Checks if the response is HTML content.
	 *
	 * @param {Response} resp - The response object.
	 * @param {NetlifyRequest} req - The Netlify request object.
	 * @throws {Error} If the response does not have a Content-Type of 'text/html'.
	 */
	static shouldBeHTML(resp, req) {
		const test = RequestHandlerTest.shouldHaveContentType(HTML);
		return test(resp, req);
	}

	/**
	 * Checks if the response is JSON content.
	 *
	 * @param {Response} resp - The response object.
	 * @param {NetlifyRequest} req - The Netlify request object.
	 * @throws {Error} If the response does not have a Content-Type of 'application/json' or is not valid JSON.
	 */
	static async shouldBeJSON(resp, req) {
		const test = RequestHandlerTest.shouldHaveContentType(JSON_MIME);
		test(resp, req);

		await resp.clone().json().catch(() => {
			throw new Error(`${req.method} <${req.url}> could not be parsed as JSON.`);
		});
	}

	/**
	 * Returns a function that validates if a JSON response contains the specified keys.
	 *
	 * @param {...string} keys - The keys that the JSON object in the response should contain.
	 * @returns {function(Response, Request): Promise<void>} - A function that takes a response and request,
	 *     validates the JSON content type, and checks if the JSON object contains the specified keys.
	 * @throws {Error} - If the response cannot be parsed as JSON or if the expected keys are missing.
	 * @throws {TypeError} - If the parsed JSON is not an object or is null.
	 */
	static shouldHaveJSONKeys(...keys) {
		return async (resp, req) => {
			const test = RequestHandlerTest.shouldHaveContentType(JSON_MIME);
			test(resp, req);

			const obj = await resp.json().catch(() => {
				throw new Error(`${req.method} <${req.url}> could not be parsed as JSON.`);
			});

			if (typeof obj !== 'object') {
				throw new TypeError(`${req.method} <${req.url} expected an object to be returned but got a ${typeof obj}.`);
			} else if (Array.isArray(obj)) {
				throw new TypeError(`${req.method} <${req.url} expected an object to be returned but got an array.`);
			} else if (obj === null) {
				throw new TypeError(`${req.method} <${req.url} expected an object to be returned but got null.`);
			} else {
				const missing = keys.filter(key => ! (key in obj));

				if (missing.length !== 0) {
					throw new Error(`${req.method} <${req.url}> returned object is missing keys: [${missing.join(', ')}].`);
				}
			}
		};
	}

	/**
	 * Asserts that the response has a JSON content type and contains a JSON object.
	 *
	 * @param {Response} resp - The response object to be validated.
	 * @param {Request} req - The request object associated with the response.
	 * @returns {Promise<void>} - A promise that resolves if the response is valid, or throws an error if not.
	 * @throws {Error} - If the response cannot be parsed as JSON.
	 * @throws {TypeError} - If the parsed JSON is not an object.
	 */
	static async shouldBeJSONObject(resp, req) {
		const test = RequestHandlerTest.shouldHaveContentType(JSON_MIME);
		test(resp, req);

		const obj = await resp.clone().json().catch(() => {
			throw new Error(`${req.method} <${req.url}> could not be parsed as JSON.`);
		});

		if (typeof obj !== 'object') {
			throw new TypeError(`${req.method} <${req.url} expected an object to be returned but got a ${typeof obj}.`);
		} else if (Array.isArray(obj)) {
			throw new TypeError(`${req.method} <${req.url} expected an object to be returned but got an array.`);
		} else if (obj === null) {
			throw new TypeError(`${req.method} <${req.url} expected an object to be returned but got null.`);
		}
	}

	/**
	 * Asserts that the response has a JSON content type and contains a JSON array.
	 *
	 * @param {Response} resp - The response object to be validated.
	 * @param {Request} req - The request object associated with the response.
	 * @returns {Promise<void>} - A promise that resolves if the response is valid, or throws an error if not.
	 * @throws {Error} - If the response cannot be parsed as JSON.
	 * @throws {TypeError} - If the parsed JSON is not an array.
	 */
	static async shouldBeJSONArray(resp, req) {
		const test = RequestHandlerTest.shouldHaveContentType(JSON_MIME);
		test(resp, req);

		const result = await resp.clone().json().catch(() => {
			throw new Error(`${req.method} <${req.url}> could not be parsed as JSON.`);
		});

		if (! Array.isArray(result)) {
			throw new TypeError(`${req.method} <${req.url}> should return a JSON array.`);
		}
	}

	/**
	 * Creates a function that checks if the response has a specific status code.
	 *
	 * @param {number} status - The expected status code.
	 * @returns {function(Response, NetlifyRequest): void} A function that takes a response and request, and throws an error if the status code is incorrect.
	 * @throws {Error} If the response status code does not match the expected status.
	 */
	static shouldHaveStatus(status) {
		return (resp, req) => {
			if (resp.status !== status) {
				throw new Error(`${req.method } <${req.url}> should have a status code of ${status} but got ${resp.status}}.`);
			}
		};
	}

	/**
	 * Asserts that a Response object has a client (4xx) or server (5xx) error status code.
	 * @param {Response} resp The Response object to check.
	 * @param {NetlifyRequest} req The Request object associated with the response.
	 * @throws {Error} If the response does not have a 4xx or 5xx status code.
	 */
	static shouldError(resp, req) {
		if (! between(400, resp.status, 599)) {
			throw new Error(`${req.method} <${req.url}> should return a 4xx or 5xx status code. Got ${resp.status}.`);
		}
	}

	/**
	 * Asserts that a Response object has a client (4xx) error status code.
	 * @param {Response} resp The Response object to check.
	 * @param {NetlifyRequest} req The Request object associated with the response.
	 * @throws {Error} If the response does not have a 4xx status code.
	 */
	static shouldClientError(resp, req) {
		if (! between(400, resp.status, 499)) {
			throw new Error(`${req.method} <${req.url}> should return a 4xx status code. Got ${resp.status}.`);
		}
	}

	/**
	 * Asserts that a Response object has a server (5xx) error status code.
	 * @param {Response} resp The Response object to check.
	 * @param {NetlifyRequest} req The Request object associated with the response.
	 * @throws {Error} If the response does not have a 5xx status code.
	 */
	static shouldServerError(resp, req) {
		if (! between(500, resp.status, 599)) {
			throw new Error(`${req.method} <${req.url}> should return a 5xx status code. Got ${resp.status}.`);
		}
	}

	/**
	 * Asserts that a Response object indicates a redirect (3xx status code) and includes a Location header.
	 * @param {Response} resp The Response object to check.
	 * @param {NetlifyRequest} req The Request object associated with the response.
	 * @throws {Error} If the response does not have a 3xx status code or is missing the Location header.
	 */
	static shouldRedirect(resp, req) {
		if (! REDIRECT_STATUSES.includes(resp.status)) {
			throw new Error(`${req.method} <${req.url}> should have a 3xx redirect status code, but got ${resp.status}.`);
		} else if (! resp.headers.has(LOC)) {
			throw new Error(`${req.method} <${req.url}> should redirect but is missing the Location HTTP header.`);
		} else if (! URL.canParse(resp.headers.get(LOC), req.url)) {
			throw new Error(`${req.method} <${req.url}> should redirect to a valid URL - got ${resp.headers.get(LOC)}.`);
		}
	}

	/**
	 * Creates a middleware function that checks if a response is a valid redirect.
	 *
	 * @param {string|RegExp|URL|URLPattern} dest - Destination for the redirect.
	 *   - If a string, the redirect URL must start with this string.
	 *   - If a RegExp, the redirect URL must match this regular expression.
	 *   - If a URL, the redirect URL must have the same origin, pathname, and search parameters.
	 * @returns {function(Response, NetlifyRequest): void} A middleware function that checks the response.
	 * @throws {Error} If the response status is not a redirect, if the Location header is missing, if the Location header is not a valid URL, or if the destination doesn't match.
	 */
	static shouldRedirectTo(dest) {
		return (resp, req) => {
			const loc = URL.parse(resp.headers.get(LOC), req.url);

			if (! REDIRECT_STATUSES.includes(resp.status)) {
				throw new Error(`${req.method} <${req.url}> should have a 3xx redirect status code, but got ${resp.status}.`);
			} else if (! resp.headers.has(LOC)) {
				throw new Error(`${req.method} <${req.url}> should redirect but is missing the Location HTTP header.`);
			} else if (! (loc instanceof URL)) {
				throw new Error(`${req.method} <${req.url}> should redirect to a valid URL - got ${resp.headers.get(LOC)}.`);
			} else if (typeof dest === 'string' && loc.href !== dest) {
				throw new Error(`${req.method} <${req.url}> should redirect to ${dest} but gave ${loc}.`);
			} else if (dest instanceof RegExp && ! dest.test(loc.href)) {
				throw new Error(`${req.method} <${req.url}> redirected to ${resp.headers.get(LOC)}, which does not match ${dest}.`);
			} else if (dest instanceof URLPattern && ! dest.test(loc.href)) {
				throw new Error(`${req.method} <${req.url}> redirected to ${loc}, which does not match the URLPattern.`);
			} else if (
				dest instanceof URL
				&& ! (
					loc.origin === dest.origin
					&& loc.pathname.startsWith(dest.pathname)
					&& [...dest.searchParams.keys].every(param => loc.searchParams.has(param))
				)
			) {
				throw new Error(`${req.method} <${req.url}> redirects to ${loc}, which does not match ${dest}.`);
			}
		};
	}

	/**
	 * Asserts that a Response object includes an Access-Control-Allow-Origin header allowing the request's origin, or '*'.
	 * @param {Response} resp The Response object to check.
	 * @param {NetlifyRequest} req The Request object associated with the response.
	 * @throws {Error} If the Access-Control-Allow-Origin header is missing or does not allow the request's origin.
	 */
	static shouldAllowOrigin(resp, req) {
		if (! resp.headers.has(ACAO)) {
			throw new Error(`${req.method} <${req.url}> missing Access-Control-Allow-Origin header.`);
		} else if (req.headers.has(ORIGIN)) {
			const origin = req.headers.get(ORIGIN);

			if (! ['*', origin].includes(resp.headers.get(ACAO))) {
				throw new Error(`${req.method} <${req.url}> should allow origin: ${origin}.`);
			}
		}
	}

	/**
	 * Checks if the response requires or allows Same-Origin.
	 *
	 * @param {Response} resp - The response object.
	 * @param {NetlifyRequest} req - The Netlify request object.
	 * @throws {Error} If the response and request origin mismatch.
 	*/
	static shouldRequireSameOrigin(resp, req) {
		const isSameOrigin = req.isSameOrigin;

		if (resp.ok && ! isSameOrigin) {
			throw new Error(`${req.method} <${req.url}> should require Same-Origin.`);
		} else if (! resp.ok && isSameOrigin) {
			throw new Error(`${req.method} <${req.url}> should allow Same-Origin.`);
		}
	}

	/**
	 * Asserts that a Response object DOES NOT allow a specific Origin
	 * @param {Response} resp The Response object to check.
	 * @param {NetlifyRequest} req The Request object associated with the response.
	 * @throws {Error} If the Access-Control-Allow-Origin header is missing or allows the request's origin.
	 */
	static async shouldDisallowOrigin(resp, req) {
		if (resp.headers.has(ACAO)) {
			const origin = req.headers.get(ORIGIN);

			if (['*', origin].includes(resp.headers.get(ACAO))) {
				throw new Error(`${req.method} <[>${req.url}> should allow not origin: ${origin}.`);
			}
		}
	}

	/**
	 * Validates that the response includes correct CORS headers when credentials are allowed.
	 *
	 * @param {Response} resp - The HTTP response object to validate.
	 * @param {Request} req - The HTTP request object associated with the response.
	 * @throws {Error} Throws an error if any of the following conditions are met:
	 * - The `Access-Control-Allow-Credentials` header is missing in the response.
	 * - The `Access-Control-Allow-Origin` header is missing in the response.
	 * - The `Access-Control-Allow-Origin` header is set to `"*"` while credentials are allowed.
	 */
	static async shouldAllowCredentials(resp, req) {
		if (! resp.headers.has(ACAC)) {
			throw new Error(`${req.method} <[>${req.url}> is missing Access-Control-Allow-Credentials header.`);
		} else if (! resp.headers.has(ACAO)) {
			throw new Error(`${req.method} <[>${req.url}> is missing Access-Control-Allow-Origin header.`);
		} else if (resp.headers.get(ACAO) === '*') {
			throw new Error(`${req.method} <[>${req.url}> is Access-Control-Allow-Origin may not be "*" if credentials are allowed.`);
		}
	}

	/**
	 * Asserts that a Response to an OPTIONS request includes the Access-Control-Allow-Methods header.
	 * @param {Response} resp The Response object to check.
	 * @param {NetlifyRequest} req The Request object associated with the response.
	 * @throws {Error} If the Access-Control-Allow-Methods header is missing in an OPTIONS request.
	 */
	static async shouldSupportOptionsMethod(resp, req) {
		if (req.method !== 'OPTIONS') {
			throw new TypeError(`${req.method} <${req.url}> is not an OPTIONS request, so this test is invalid.`);
		} else if (! resp.headers.has(ACAM)) {
			throw new Error(`${req.method} <${req.url}> missing Access-Control-Allow-Methods in OPTIONS request.`);
		}
	}

	/**
	 * Asserts that a Response object does not indicate that the HTTP method used in the request is not allowed (405 Method Not Allowed).
	 * @param {Response} resp The Response object to check.
	 * @param {NetlifyRequest} req The Request object associated with the response.
	 * @throws {Error} If the response status is 405 Method Not Allowed.
	 */
	static shouldAllowMethod(resp, req) {
		if (req.method === 'OPTIONS' && req.headers.has(ACRM)) {
			const method = req.headers.get(ACRM).trim().toUpperCase();
			const allowed = resp.headers.has(ACAM)
				? resp.headers.get(ACAM).split(',').map(method => method.trim().toUpperCase())
				: [];

			if (! allowed.includes(method)) {
				throw new Error(`${req.method} <${req.url}> should allow method ${method} but only allows ${allowed.join(', ')}.`);
			}
		} else if (resp.status === METHOD_NOT_ALLOWED) {
			throw new Error(`${req.method} <${req.url}> should support HTTP method "${req.method}."`);
		}
	}

	/**
	 * Checks if a response has a list of headers.
	 *
	 * @param {...string} headers The names of the required headers.
	 * @returns {function(Response, Request): void} A middleware function.
	 *
	 * @throws {Error} If one or more header is missing and the response status is successful.
	 */
	static shouldRequireHeaders(...headers) {
		return (resp, req) => {
			const missing = headers.filter(header => ! req.headers.has(header));

			if (resp.ok && missing.length !== 0) {
				throw new Error(`${req.method} <${req.url}> should require headers: [${missing.join(', ')}] but returned a status of ${resp.status}.`);
			}
		};
	}

	/**
	 * Checks if a response has specified search params.
	 *
	 * @param {...string} params The names of the required search params.
	 * @returns {function(Response, Request): void} A middleware function.
	 *
	 * @throws {Error} If the search param is missing and the response status is successful.
	 */
	static shouldRequireSearchParams(...params) {
		return (resp, req) => {
			const searchParams = new URLSearchParams(req.url);
			const missing = params.filter(param => ! searchParams.has(param));

			if (resp.ok && missing.length !== 0) {
				throw new Error(`${req.method} <${req.url}> should require search params: [${missing.join(', ')}] but returned a status of ${resp.status}.`);
			}
		};
	}

	/**
	 * Checks if a response has specified Cookies.
	 *
	 * @param {...string} params The names of the required Cookies.
	 * @returns {function(Response, Request): void} A middleware function.
	 *
	 * @throws {Error} If the search param is missing and the response status is successful.
	 */
	static shouldRequireCookies(...cookies) {
		return (resp, req) => {
			const missing = cookies.filter(cookie => ! req.cookies.has(cookie));

			if (resp.ok && missing.length !== 0) {
				throw new Error(`${req.method} <${req.url}> should require cookies: [${missing.join(', ')}] but returned a status of ${resp.status}.`);
			}
		};
	}

	/**
	 * Checks if a response requires an authorization header.

	* @param {Response} resp The response object.
	* @param {Request} req The request object.
	* @throws {Error} If the header is missing and the response status is not 401.
	* @throws {Error} If the header is present and the response status is 401.
	*/
	static shouldRequireAuthorization(resp, req) {
		if (! req.headers.has(AUTH) && resp.status !== UNAUTHORIZED) {
			throw new Error(`${req.method} <${req.url}> should return a status of ${UNAUTHORIZED} if request is missing "Authorization" header but got ${resp.status}.`);
		} else if (req.headers.has(AUTH) && resp.status === UNAUTHORIZED) {
			throw new Error(`${req.method} <${req.url}> had required "Authorization" header but still got ${UNAUTHORIZED} Unauthorized.`);
		}
	}

	/**
	 * Checks if a given response and request combination allows the specified headers.
	 *
	 * Throws an error if the `Access-Control-Allow-Headers` header is missing or does not allow all specified headers.
	 *
	 * @param {...string} headers The headers that should be allowed.
	 * @returns {function(Response, Request): void} A function that can be used to check the response and request.
	 */
	static shouldAllowHeaders(...headers) {
		return (resp, req) => {
			if (! resp.headers.has(ACAH)) {
				throw new Error(`${req.method} <${req.url}> missing Access-Control-Allow-Headers.`);
			} else {
				const allowed = getAllHeader(resp, ACAH);//resp.headers.get(ACAH).split(',').map(header => header.trim().toLowerCase());
				const missing = headers.filter(header => ! allowed.includes(header.toLowerCase()));

				if (missing.length !== 0) {
					throw new Error(`${req.method} <${req.url}> misconfigured Access-Control-Allow-Headers should allow: [${missing.join(', ')}].`);
				}
			}
		};
	}

	/**
	 * Checks if a given response and request combination does not allow the specified headers.
	 *
	 * Throws an error if the `Access-Control-Allow-Headers` header is present and allows any of the specified headers.
	 *
	 * @param {...string} headers The headers that should not be allowed.
	 * @returns {function(Response, Request): void} A function that can be used to check the response and request.
	 */
	static shouldNotAllowHeaders(...headers) {
		return (resp, req) => {
			if (! resp.headers.has(ACAH)) {
				throw new Error(`${req.method} <${req.url}> missing Access-Control-Allow-Headers.`);
			} else {
				const allowed = resp.headers.get(ACAH).split(',').map(header => header.trim().toLowerCase());
				const disallowed = headers.filter(header => allowed.includes(header.toLowerCase()));

				if (headers.length !== 0) {
					throw new Error(`${req.method} <${req.url}> misconfigured Access-Control-Allow-Headers should not allow: [${disallowed.join(', ')}].`);
				}
			}
		};
	}

	/**
	 * Checks if a given response and request combination allows the requested headers in a preflight request.
	 *
	 * Throws an error if the request is a preflight request (OPTIONS method with `Access-Control-Request-Headers`) and the response does not allow all requested headers.
	 *
	 * @param {Response} resp The response object.
	 * @param {Request} req The request object.
	 */
	static shouldAllowRequestHeaders(resp, req) {
		if (req.method === 'OPTIONS' && req.headers.has(ACRH)) {
			if (resp.headers.has(ACAH)) {
				const reqHeaders = getAllHeader(req, ACRH);
				const allowHeaders = getAllHeader(resp, ACAH);
				const disallowed = reqHeaders.filter(header => ! allowHeaders.includes(header));

				if (disallowed.length !== 0) {
					throw new Error(`${req.method} <${req.url}> does not allow requested headers: [${disallowed.join(', ')}].`);
				}
			}
		}
	}

	/**
	 * Checks if a given response and request combination exposes the specified headers.
	 *
	 * Throws an error if the `Access-Control-Expose-Headers` header is missing or does not expose all specified headers.
	 *
	 * @param {...string} headers The headers that should be exposed.
	 * @returns {function(Response, Request): void} A function that can be used to check the response and request.
	 */
	static shouldExposeHeaders(...headers) {
		return (resp, req) => {
			if (! resp.headers.has(ACEH)) {
				throw new Error(`${req.method} <${req.url}> response missing Access-Control-Expose-Headers.`);
			} else {
				const exposed = getAllHeader(resp, ACEH);
				//resp.headers.get(ACEH).split(',').map(header => header.trim().toLowerCase());
				const missing = headers.filter(header => ! exposed.includes(header.toLowerCase()));

				if (missing.length !== 0) {
					throw new Error(`${req.method} <${req.url}> response misconfigured Access-Control-Expose-Headers should expose: [${missing.join(', ')}].`);
				}
			}
		};
	}

	/**
	 * Checks if a given response and request combination does not expose the specified headers.
	 *
	 * Throws an error if the `Access-Control-Expose-Headers` header is present and exposes any of the specified headers.
	 *
	 * @param {...string} headers The headers that should not be exposed.
	 * @returns {function(Response, Request): void} A function that can be used to check the response and request.
	 */
	static shouldNotExposeHeaders(...headers) {
		return (resp, req) => {
			if (resp.headers.has(ACEH)) {
				const exposed = getAllHeader(resp, ACEH);
				const disallowed = headers.filter(header => exposed.includes(header.toLowerCase()));

				if (disallowed.length !== 0) {
					throw new Error(`${req.method} <${req.url}> response misconfigured Access-Control-Expose-Headers should not expose: [${disallowed.join(', ')}].`);
				}
			}
		};
	}

	/**
	 * Asserts that a Response object indicates that the HTTP method used in the request is not allowed (405 Method Not Allowed).
	 * @param {Response} resp The Response object to check.
	 * @param {NetlifyRequest} req The Request object associated with the response.
	 * @throws {Error} If the response status is not 405 Method Not Allowed.
	 */
	static shouldNotAllowMethod(resp, req) {
		if (req.method === 'OPTIONS' && req.headers.has(ACRM)) {
			const method = req.headers.get(ACRM).trim().toUpperCase();
			const allowed = resp.headers.has(ACAM)
				? resp.headers.get(ACAM).split(',').map(method => method.trim().toUpperCase())
				: [];

			if (allowed.includes(method)) {
				throw new Error(`${req.method} <${req.url}> should not allow method ${method}.`);
			}
		} else if (resp.status !== METHOD_NOT_ALLOWED) {
			throw new Error(`${req.method} <${req.url}> should not support HTTP method "${req.method}. Got status [${resp.status}]."`);
		} else if (! resp.headers.has(ALLOW)) {
			throw new Error(`${req.method} <${req.url}> not allowed, but is missing Allow header.`);
		} else if (resp.headers.get(ALLOW).split(',').map(method => method.trim().toUpperCase()).includes(req.method)) {
			throw new Error(`${req.method} <${req.url}> not allowed, but is listed as an allowed method.`);
		}
	}

	/**
	 * Checks if a given response has CORS headers.
	 *
	 * Throws an error if Access-Control-Allow-Origin is missing.
	 *
	 * @param {Response} resp The response object.
	 * @param {Request} req The request object.
	 */
	static shouldBeCorsResponse(resp, req) {
		if (! resp.headers.has(ACAO)) {
			throw new Error(`${req.method} <${req.url}> is missing required Access-Control-Allow-Origin header.`);
		}
	}

	/**
	 * Validates if a request should require a JWT token based on the response and request headers.
	 *
	 * @param {Response} resp - The HTTP response object.
	 * @param {Request} req - The HTTP request object.
	 * @throws {Error} - If the request requires a JWT but is missing the Authorization header, or if the request has an Authorization header but the response is unauthorized.
	 * @throws {Error} - If the request has a valid Authorization header but the decoded token is invalid.
	 */
	static shouldRequireJWT(resp, req) {
		if (resp.ok && ! req.headers.has(AUTH)) {
			throw new Error(`${req.method} <${req.url}> should require ${AUTH} header.`);
		} else if (req.headers.has(AUTH) && resp.status === UNAUTHORIZED) {
			throw new Error(`${req.method} <${req.url}> should has ${AUTH} header but was unauthorized.`);
		} else {
			const result = decodeRequestToken(req);

			if (resp.ok && result instanceof Error) {
				throw result;
			} else if (resp.ok && result === null) {
				throw new Error('Error decoding request JWT.');
			} else {
				const valid = verifyHeader(result?.header)
					&& isVerifiedPayload(result?.payload)
					&& result?.signature instanceof Uint8Array
					&& result?.data instanceof Uint8Array
					&& result?.signature.length !== 0;

				if (! valid && resp.ok) {
					throw new Error(`${req.method} <${req.url}> allowed an invalid JWT.`);
				}
			}
		}
	}

	/**
	 * Checks if a given response and request combination requires credentials.
	 *
	 * Throws an error if credentials are not required but `req.credentials` is set to `'omit'`.
	 * Throws an error if the request mode is `'cors'` but the necessary CORS headers are missing or invalid.
	 *
	 * @param {Response} resp The response object.
	 * @param {Request} req The request object.
	 */
	static shouldRequireCredentials(resp, req) {
		if (resp.status !== UNAUTHORIZED && req.credentials === 'omit') {
			throw new Error(`${req.method} <${req.url}> should require credentials.`);
		} else if (req.mode === 'cors') {
			if (resp.headers.get(ACAC) !== 'true') {
				throw new Error(`${resp.method} <${resp.url}> missing required Access-Control-Allow-Credentials header.`);
			} else if (! resp.headers.has(ACAO)) {
				throw new Error(`${req.method} <${req.url}> missing required Access-Control-Allow-Origin header.`);
			} else if (! URL.canParse(resp.headers.get(ACAO))) {
				throw new Error(`${req.method} <${req.url}> invalid Access-Control-Allow-Origin header: ${resp.headers.get(ACAO)}.`);
			} else if (req.headers.get(ORIGIN) !== resp.headers.get(ACAO)) {
				throw new Error(`${req.method} <${req.url}> origin mismatch. Request from ${req.headers.get(ORIGIN)} but allows ${resp.headers.get(ACAO)}`);
			}
		}
	}

	/**
	 * Checks if a given response and request combination should not require credentials.
	 *
	 * Throws an error if the response status is `UNAUTHORIZED` or `FORBIDDEN` but credentials are required.
	 *
	 * @param {Response} resp The response object.
	 * @param {Request} req The request object.
	 */
	static shouldNotRequireCredentials(resp, req) {
		if (resp.status === UNAUTHORIZED || resp.status === FORBIDDEN) {
			throw new Error(`${req.method} <${req.url}> should not require credentials.`);
		}
	}

	/**
	 * Checks if a given response and request combination passes preflight checks for CORS.
	 *
	 * Throws an error if the request is not a valid OPTIONS request, if required headers are missing, or if the requested method or headers are not allowed.
	 *
	 * @param {Response} resp The response object.
	 * @param {Request} req The request object.
	 */
	static shouldPassPreflight(resp, req) {
		if (req.method !== 'OPTIONS') {
			throw new TypeError(`${req.method} <${req.url}> preflight tests only apply to OPTIONS requests.`);
		} else if (req.mode !== 'cors' || ! req.headers.has(ORIGIN)) {
			throw new Error(`${req.method} <${req.url}> is not a valid CORS request.`);
		} else if (! URL.parse(req.headers.get(ORIGIN))?.origin === req.headers.get(ORIGIN)) {
			throw new Error(`${req.method} <${req.url}> has an invalid Origin of "${req.headers.get(ORIGIN)}".`);
		} else if (! req.headers.has(ACRM)) {
			throw new Error(`${req.method} <${req.url}> is missing required Access-Control-Request-Method header.`);
		} else if (! (resp.status === OK || resp.status === NO_CONTENT)) {
			throw new Error(`${req.method} <${req.url}> expected a 2xx status but got ${resp.status}.`);
		} else if (! getAllHeader(resp, ACAM).includes(req.headers.get(ACRM).toLowerCase())) {
			throw new Error(`${req.method} <${req.url}> expected to allow ${req.headers.get(ACRM)} but does not.`);
		} else if (resp.body instanceof ReadableStream) {
			throw new Error(`${resp.method} <${resp.url}> - Options response must not have a body.`);
		} else if (
			req.credentials === 'include'
			&& (! resp.headers.has(ACAO) || resp.headers.get(ACAO) !== req.headers.get(ORIGIN))
		) {
			throw new Error(`${req.method} <${req.url}> has misconfigured CORS headers for a credentialed request.`);
		} else {
			const reqHeaders = getAllHeader(req, ACRH);

			if (reqHeaders.length !== 0) {
				const allowed = getAllHeader(resp, ACAH);
				const missing = reqHeaders.filter(header => ! allowed.includes(header));

				if (missing.length !== 0) {
					throw new Error(`${req.method} <${req.url}> does not allow requested headers: [${missing.join(', ')}]`);
				}
			}
		}
	}

	/**
	 * Logs the request object to the console.
	 *
	 * @param {*} _ - Unused parameter.
	 * @param {Request} req - The request object to be logged.
	 */
	static logRequest(_, req) {
		console.log(req);
	}

	/**
	 * Logs the headers of the request object to the console.
	 *
	 * @param {*} _ - Unused parameter.
	 * @param {Request} req - The request object whose headers are to be logged.
	 */
	static logRequestHeaders(_, req) {
		console.log(Object.fromEntries(req.headers));
	}

	/**
	 * Logs the response object to the console.
	 *
	 * @param {Response} resp - The response object to be logged.
	 */
	static logResponse(resp) {
		console.log(resp);
	}

	/**
	 * Logs the headers of the response object to the console.
	 *
	 * @param {Response} resp - The response object whose headers are to be logged.
	 */
	static logResponseHeaders(resp) {
		console.log(Object.fromEntries(resp.headers));
	}

	/**
	 * Logs the headers of the response body/data to the console.
	 *
	 * @param {Response} resp - The response object whose body are to be logged.
	 */
	static async logResponseBody(resp) {
		if (resp.headers.has(CONTENT_TYPE)) {
			switch(resp.headers.get(CONTENT_TYPE).toLowerCase()) {
				case '':
					 console.log(null);
					 break;

				case JSON_MIME:
				case JSON_ALT:
				case JSON_LD:
					console.log(await resp.clone().json());
					break;

				case FORM_MULTIPART:
				case FORM_URL_ENCODED:
					console.log(await resp.clone().formData());
					break;

				case TEXT:
					console.log(await resp.clone().text());
					break;

				default:
					console.log(resp.clone().headers.get(CONTENT_TYPE).endsWith('+json') ? await resp.clone().json() : await resp.clone().blob());
			}
		}
	}

	/**
	 * Assertion function that executes multiple checks against a request and its response.
	 * @param  {...(Function|string)} checks - An array of check functions or check names.
	 * Check functions should throw an error if the assertion fails.
	 * Check names should match the format 'should[CheckName]' where [CheckName]
	 * corresponds to a static method within RequestHandlerTest.
	 * @returns {Function} An async function that performs the checks and throws an AggregateError if any fail.
	 */
	static should(...checks) {
		return async function(req, resp) {
			const errs = [];

			const results = await Promise.allSettled(
				checks.map(async check => {
					if (check instanceof Function) {
						await check.call(this, req, resp);
					} else if (typeof check !== 'string') {
						throw new TypeError('Check must be a function or string.');
					} else {
						const method = 'should' + check[0].toUpperCase() + check.substring(1);

						if (! (RequestHandlerTest[method] instanceof Function)) {
							throw new Error(`RequestHandlerTest.${method} does not exist.`);
						} else {
							await RequestHandlerTest[method](req, resp);
						}
					}
				})
			);

			for (const result of results) {
				if (result.status === 'rejected') {
					if (result.reason instanceof AggregateError) {
						errs.push(...result.reason.errors);
					} else if (result.reason instanceof Error || result.reason instanceof DOMException) {
						errs.push(result.reason);
					} else {
						errs.push(new Error(result.reason));
					}
				}
			}

			if (errs.length === 1) {
				throw errs[0];
			} else if (errs.length !== 0) {
				throw new AggregateError(errs, 'Some tests failed.');
			}
		};
	}

	/**
	 * Loads and runs a list of test modules asynchronously.
	 *
	 * @param {...(string | URL)} tests An array of strings representing module paths (using dynamic imports) for test files.
	 * @returns {Promise<{ error: Error | DOMException | null, success: Array<Response>, duration: number }>}
	 *          A promise that resolves to an object with the following properties:
	 *          - `error`: An error object if any test module failed to load or an `AggregateError` if multiple tests failed.
	 *          - `success`: An array of returned responses.
	 *          - `duration`: The time taken to load and run all tests in milliseconds.
	 */
	static async loadAndRunTests(...tests) {
		const start = performance.now();

		const results = await Promise.allSettled(tests.map(test => import(test)));

		const errs = [];
		const success = [];

		for (const result of results) {
			if (result.status === 'rejected') {
				if (result.reason instanceof AggregateError) {
					errs.push(...result.reason.errors);
				} else if (result.reason instanceof Error || result.reason instanceof DOMException) {
					errs.push(result.reason);
				} else {
					errs.push(new Error(result.reason));
				}
			} else {
				success.push(result.result);
			}
		}

		const duration = performance.now() - start;

		switch(errs.length) {
			case 0:
				return { error: null, success, duration };

			case 1:
				return { error: errs[0], success, duration };

			default:
				return { error: new AggregateError(errs), success, duration };
		}
	}
}
