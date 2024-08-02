import { contextFallback as context } from './context.js';
import { METHOD_NOT_ALLOWED } from './status.js';

const REDIRECT_STATUSES = [301, 302, 303, 307, 308];

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
	 * @param {Request} request - The Request object to use for the test.
	 * @param {Function|string|URL} handler - The request handler function to test or path to the module, relative to current working directory.
	 * @param {AssertionCallback|AssertionCallback[]} [assertionsCallback] - Optional callback function(s) to perform assertions on the response.
	 *
	 * @callback AssertionCallback
	 * @param {Response} response - The Response object returned by the handler.
	 * @param {Request} request - The original Request object used for the test.
	 * @returns {(boolean|string|Error|undefined|null)} A value indicating the result of the assertion:
	 *   - `true`: Assertion passed
	 *   - `false`: Assertion failed
	 *   - `string`: Assertion failed with a custom error message
	 *   - `Error`: Assertion failed with an Error object
	 *   - `undefined` or `null`: Assertion passed (no explicit return value)
	 */

	constructor(request, handler, assertionsCallback) {
		if (!(request instanceof Request)) {
			this.#errors.push(new TypeError('Test request is not a Request object.'));
		} else {
			this.#request = request;
		}

		if (typeof handler === 'string' || handler instanceof URL) {
			this.#handler = async (request, context) => {
				const base = 'process' in globalThis && process.cwd instanceof Function ? 'file://' + process.cwd() + '/' : document?.baseURI;
				const path = new URL(handler, base);
				const module = await import(path);

				if (! (module.default instanceof Function)) {
					throw new Error(`Module at ${path} does not export a handler as default.`);
				} else {
					return module.default.call(context, request, context);
				}
			};
		} else if (!(handler instanceof Function)) {
			this.#errors.push(new TypeError('Test handler must be a Function.'));
		} else {
			this.#handler = handler;
		}

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
						errs.push(result.reason);
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
	 * @returns {Request} The Request object upon which tests will be performed.
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

				if (result instanceof Error) {
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
					} else if (assertResult instanceof Error) {
						this.#errors.push(result);
					} else {
						this.#errors.push(new TypeError(`Invalid result type from assertion: ${typeof assertResult}`));
					}
				} else {
					this.#response = result;
				}
			} catch (err) {
				this.#errors.push(err);
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
				errors.push(result.reason);
			} else {
				success.push(result.value);
			}
		}

		return { success, error: errors.length === 0 ? null : new AggregateError(errors, 'Some tests failed.') };
	}

	static shouldBeOk(resp, req) {
		if (! resp.ok) {
			throw new Error(`${req.method} <${req.url}> should return a 2xx status code. Got ${resp.status}.`);
		}
	}

	static shouldClientError(resp, req) {
		if (resp.status < 400 || resp.status > 499) {
			throw new Error(`${req.method} <${req.url}> should return a 4xx status code. Got ${resp.status}.`);
		}
	}

	static shouldServerError(resp, req) {
		if (resp.status < 500 || resp.status > 599) {
			throw new Error(`${req.method} <${req.url}> should return a 5xx status code. Got ${resp.status}.`);
		}
	}

	static shouldRedirect(resp, req) {
		if (resp.status < 300 || resp.status > 399) {
			throw new Error(`${req.method} <${req.url}> should have a 3xx status code, but got ${resp.status}.`);
		} else if (! resp.headers.has('Location')) {
			throw new Error(`${req.method} <${req.url}> should redirect but is missing the Location HTTP header.`);
		}
	}

	static async shouldAllowOrigin(resp, req) {
		if (! resp.headers.has('Access-Control-Allow-Origin')) {
			throw new Error(`${req.method} <${req.url}> missing Access-Control-Allow-Origin header.`);
		} else if (req.headers.has('Origin')) {
			const origin = req.headers.get('Origin');

			if (! ['*', origin].includes(resp.headers.get('Access-Control-Allow-Origin'))) {
				throw new Error(`${req.method} <${req.url}> should allow origin: ${origin}.`);
			}
		}
	}

	static async shouldDisallowOrigin(resp, req) {
		if (resp.headers.has('Access-Control-Allow-Origin')) {
			const origin = req.headers.get('Origin');

			if (['*', origin].includes(resp.headers.get('Access-Control-Allow-Origin'))) {
				throw new Error(`${req.method} [${req.method}] should allow not origin: ${origin}.`);
			}
		}
	}

	static async shouldSupportOptionsMethod(resp, req) {
		if (! resp.headers.has('Access-Control-Allow-Methods')) {
			throw new Error(`${req.method} <${req.url}> missing Access-Control-Allow-Methods in OPTIONS request.`);
		}
	}

	static async shouldAllowMethod(resp, req) {
		if (resp.status === METHOD_NOT_ALLOWED) {
			throw new Error(`${req.method} <${req.url}> should support HTTP method "${req.method}."`);
		}
	}

	static async shouldNotAllowMethod(resp, req) {
		if (resp.status !== METHOD_NOT_ALLOWED) {
			throw new Error(`${req.method} <${req.url}> should not support HTTP method "${req.method}."`);
		}
	}

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
					errs.push(result.reason);
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
