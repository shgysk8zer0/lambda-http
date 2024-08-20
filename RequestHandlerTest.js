import '@shgysk8zer0/polyfills';
import { contextFallback as context } from './context.js';
import { METHOD_NOT_ALLOWED, MOVED_PERMANENTLY, FOUND, SEE_OTHER, TEMPORARY_REDIRECT, PERMANENT_REDIRECT, NOT_ACCEPTABLE, NOT_FOUND, INTERNAL_SERVER_ERROR } from '@shgysk8zer0/consts/status.js';
import { NetlifyRequest } from './NetlifyRequest.js';
import { HTML, JSON as JSON_MIME } from '@shgysk8zer0/consts/mimes.js';
import { HTTPError } from './error.js';

const REDIRECT_STATUSES = [MOVED_PERMANENTLY, FOUND, SEE_OTHER, TEMPORARY_REDIRECT, PERMANENT_REDIRECT];

function getHandlerModule() {
	return async function(req) {
		const base = 'process' in globalThis && process.cwd instanceof Function ? 'file://' + process.cwd() + '/' : globalThis.document?.baseURI;
		const path = new URL(req.url, base).pathname;
		const module = await import(base  + path.substring(1) + '.js').catch(() => {
			return new HTTPError(`Error loading module for <${req.url}>`, NOT_FOUND).response;
		});

		if (module instanceof Response) {
			return module;
		} else if (! (module.default instanceof Function)) {
			return new HTTPError(`Module at ${path} does not export a default handler function.`, INTERNAL_SERVER_ERROR).response();
		} else {
			return await module.default.call(context, req, context);
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

	constructor(request, assertionsCallback) {
		if (!(request instanceof Request)) {
			this.#errors.push(new TypeError('Test request is not a Request object.'));
		} else if (! (request instanceof NetlifyRequest)) {
			this.#request = new NetlifyRequest(request, context);
		} else {
			this.#request = request;
		}

		this.#handler = getHandlerModule(request);

		if (Array.isArray(assertionsCallback) && assertionsCallback.length !== 0) {
			this.#assertionsCallback = async (resp, req) => {
				const errs = [];
				const results = await Promise.allSettled(assertionsCallback.map(async cb => {
					if (! (cb instanceof Function)) {
						throw new TypeError('Invalid assertion callback.');
					} else {
						return await cb.call(this, resp, req);
					}
				}));

				for (const result of results) {
					if (result.status === 'rejected') {
						if (result.reason instanceof AggregateError) {
							errs.push(...result.reason.errors);
						} else if (result.reason instanceof Error) {
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
			return this.#response.clone();
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
		} else if (REDIRECT_STATUSES.includes(this.#response.status) && this.#response.headers.has('Location')) {
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
		return this.headers.get('Content-Type');
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
		if (this.#response instanceof Response) {
			this.#errors.push(new Error('Test has already been run.'));
		} else if (this.#handler instanceof Function && this.#request instanceof Request) {
			try {
				console.info(`Testing ${this.#request.method} <${this.#request.url}>`);
				const result = await this.#handler.call(context, this.#request, context);

				if (result instanceof AggregateError && result.errors.length !== 0) {
					this.#errors.push(...result.errors);
				} else if (result instanceof Error) {
					this.#errors.push(result);
				} else if (! (result instanceof Response)) {
					this.#errors.push(new TypeError('Handler did not return a Response object or error.'));
				} else if (this.#assertionsCallback instanceof Function) {
					const assertResult = await this.#assertionsCallback.call(this, result, this.#request);

					if (typeof assertResult === 'boolean') {
						if (assertResult) {
							this.#response = result;
						} else {
							this.#errors.push(new Error('An assertion failed.'));
						}
					} else if (typeof assertResult === 'undefined' || assertResult === null) {
						this.#response = result;
					} else if (typeof assertResult === 'string') {
						this.#errors.push(new Error(assertResult));
					} else if (assertResult instanceof AggregateError) {
						this.#errors.push(...assertResult.errors);
					} else if (assertResult instanceof Error) {
						this.#errors.push(result);
					} else {
						this.#errors.push(new TypeError(`Invalid result type from assertion: ${typeof assertResult}`));
					}
				} else {
					this.#response = result;
				}
			} catch (err) {
				if (err instanceof AggregateError) {
					this.#errors.push(...err.errors);
				} else if (err instanceof Error) {
					this.#errors.push(err);
				} else {
					this.#errors.push(new Error(err));
				}
			}
		}
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
		} else if (! this.#response.headers.has('Access-Control-Allow-Origin')) {
			return false;
		} else {
			const allowed = this.#response.headers.get('Access-Control-Allow-Origin');

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

	/**
	 * Runs multiple RequestHandlerTest instances and collects results.
	 *
	 * @param  {...RequestHandlerTest} tests - The RequestHandlerTest instances to run.
	 * @returns {Promise<{success: RequestHandlerTest[], error?: AggregateError}>} An object containing successful tests and any errors encountered.
	 */
	static async runTests(...tests) {
		const errors = [];
		const success = [];

		const results = await Promise.allSettled(Array.from(
			tests,
			test => {
				if (! (test instanceof RequestHandlerTest)) {
					throw new TypeError('Tests must be a RequestHandlerTest.');
				} else if (test.hasErrors) {
					throw test.error;
				} else {
					return test.run('This test failed.');
				}
			}
		));

		for (const result of results) {
			if (result.status === 'rejected') {
				if (result.reason instanceof AggregateError) {
					errors.push(...result.reason.errors);
				} else if (result.reason instanceof Error) {
					errors.push(result.reason);
				} else {
					errors.push(new Error(result.reason));
				}
			} else {
				success.push(result.value);
			}
		}

		return { success, error: errors.length === 0 ? null : new AggregateError(errors, 'Some tests failed.') };
	}

	/**
	 * Checks if the response has a valid status code.
	 *
	 * @param {Response} resp - The response object.
	 * @param {NetlifyRequest} req - The Netlify request object.
	 * @throws {Error} If the response status code is invalid.
	 */
	static shouldHaveValidStatus(resp, req) {
		if (resp.status < 100 || resp.status > 599) {
			throw new Error(`${req.method} <${req.url}> returned an invalid status code of ${resp.status}.`);
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
	 * Throws an error if the response status is NOT_ACCEPTABLE and the request header 'Accept' is present.
	 *
	 * @param {Response} resp - The response object.
	 * @param {NetlifyRequest} req - The Netlify request object.
	 * @throws {Error} If the response status is NOT_ACCEPTABLE and the request header 'Accept' is present.
	 */
	static shouldAccept(resp, req) {
		if (req.headers.has('Accept') && resp.status === NOT_ACCEPTABLE) {
			throw new Error(`${req.method } <${req.url}> should accept ${req.headers.get('Accept')}.`);
		}
	}

	/**
	 * Throws an error if the response status is not NOT_ACCEPTABLE and the request header 'Accept' is present.
	 *
	 * @param {Response} resp - The response object.
	 * @param {NetlifyRequest} req - The Netlify request object.
	 * @throws {Error} If the response status is not NOT_ACCEPTABLE and the request header 'Accept' is present.
	 */
	static shouldNotAccept(resp, req) {
		if (req.headers.has('Accept') && resp.status !== NOT_ACCEPTABLE) {
			throw new Error(`${req.method } <${req.url}> should not accept ${req.headers.get('Accept')}.`);
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
			if (! resp.headers.has('Content-Type')) {
				throw new Error(`${req.method } <${req.url}> should have a Content-Type set.`);
			} else if (resp.headers.get('Content-Type').toLowerCase().split(';')[0] !== type.toLowerCase() ) {
				throw new Error(`${req.method } <${req.url}> should have a Content-Type of ${type}} but got ${resp.headers.get('Content-Type')}.`);
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
		if (resp.status < 400 || resp.status > 599) {
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
		if (resp.status < 400 || resp.status > 499) {
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
		if (resp.status < 500 || resp.status > 599) {
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
		} else if (! resp.headers.has('Location')) {
			throw new Error(`${req.method} <${req.url}> should redirect but is missing the Location HTTP header.`);
		} else if (! URL.canParse(resp.headers.get('Location'))) {
			throw new Error(`${req.method} <${req.url}> should redirect to a valid URL - get ${resp.headers.get('Location')}.`);
		}
	}

	/**
	 * Creates a middleware function that checks if a response is a valid redirect.
	 *
	 * @param {string|RegExp|URL} [dest] - Optional destination for the redirect.
	 *   - If a string, the redirect URL must start with this string.
	 *   - If a RegExp, the redirect URL must match this regular expression.
	 *   - If a URL, the redirect URL must have the same origin, pathname, and search parameters.
	 * @returns {function(Response, NetlifyRequest): void} A middleware function that checks the response.
	 * @throws {Error} If the response status is not a redirect, if the Location header is missing, if the Location header is not a valid URL, or if the destination doesn't match.
	 */
	static shouldRedirectTo(dest) {
		return (resp, req) => {
			if (! REDIRECT_STATUSES.includes(resp.status)) {
				throw new Error(`${req.method} <${req.url}> should have a 3xx redirect status code, but got ${resp.status}.`);
			} else if (! resp.headers.has('Location')) {
				throw new Error(`${req.method} <${req.url}> should redirect but is missing the Location HTTP header.`);
			} else if (! URL.canParse(resp.headers.get('Location'))) {
				throw new Error(`${req.method} <${req.url}> should redirect to a valid URL - get ${resp.headers.get('Location')}.`);
			} else if (typeof dest === 'string' && ! resp.headers.get('Location').startsWith(dest)) {
				throw new Error(`${req.method} <${req.url}> should redirect to ${dest} but gave ${resp.headers.get('Location')}.`);
			} else if (dest instanceof RegExp && ! dest.test(resp.headers.get('Location'))) {
				throw new Error(`${req.method} <${req.url}> redirected to ${resp.headers.get('Location')}, which does not match ${dest}.`);
			} else if (dest instanceof URL) {
				const location = new URL(resp.headers.get('Location'));
				if (! (
					location.origin === dest.origin
					&& location.pathname.startsWith(dest.pathname)
					&& [...dest.searchParams.keys].every(param => location.searchParams.has(param))
				)) {
					throw new Error(`${req.method} <${req.url}> redirects to ${location}, which does not match ${dest}.`);
				}
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
		if (! resp.headers.has('Access-Control-Allow-Origin')) {
			throw new Error(`${req.method} <${req.url}> missing Access-Control-Allow-Origin header.`);
		} else if (req.headers.has('Origin')) {
			const origin = req.headers.get('Origin');

			if (! ['*', origin].includes(resp.headers.get('Access-Control-Allow-Origin'))) {
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
		if (resp.headers.has('Access-Control-Allow-Origin')) {
			const origin = req.headers.get('Origin');

			if (['*', origin].includes(resp.headers.get('Access-Control-Allow-Origin'))) {
				throw new Error(`${req.method} [${req.method}] should allow not origin: ${origin}.`);
			}
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
		} else if (! resp.headers.has('Access-Control-Allow-Methods')) {
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
		if (req.method === 'OPTIONS' && req.headers.has('Access-Control-Request-Method')) {
			const method = req.headers.get('Access-Control-Request-Method').trim().toUpperCase();
			const allowed = resp.headers.has('Access-Control-Allow-Methods')
				? resp.headers.get('Access-Control-Allow-Methods').split(',').map(method => method.trim().toUpperCase())
				: [];

			if (! allowed.includes(method)) {
				throw new Error(`${req.method} <${req.url}> should allow method ${method} but only allows ${allowed.join(', ')}.`);
			}
		} else if (resp.status === METHOD_NOT_ALLOWED) {
			throw new Error(`${req.method} <${req.url}> should support HTTP method "${req.method}."`);
		}
	}

	/**
	 * Asserts that a Response object indicates that the HTTP method used in the request is not allowed (405 Method Not Allowed).
	 * @param {Response} resp The Response object to check.
	 * @param {NetlifyRequest} req The Request object associated with the response.
	 * @throws {Error} If the response status is not 405 Method Not Allowed.
	 */
	static shouldNotAllowMethod(resp, req) {
		if (req.method === 'OPTIONS' && req.headers.has('Access-Control-Request-Method')) {
			const method = req.headers.get('Access-Control-Request-Method').trim().toUpperCase();
			const allowed = resp.headers.has('Access-Control-Allow-Methods')
				? resp.headers.get('Access-Control-Allow-Methods').split(',').map(method => method.trim().toUpperCase())
				: [];

			if (allowed.includes(method)) {
				throw new Error(`${req.method} <${req.url}> should not allow method ${method}.`);
			}
		} else if (resp.status !== METHOD_NOT_ALLOWED) {
			throw new Error(`${req.method} <${req.url}> should not support HTTP method "${req.method}. Got status [${resp.status}]."`);
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
					// errs.push(result.reason);
					if (result.reason instanceof AggregateError) {
						errs.push(...result.reason.errors);
					} else if (result.reason instanceof Error) {
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
}
