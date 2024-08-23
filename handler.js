import '@shgysk8zer0/polyfills';
import { HTTPError, HTTPLengthRequiredError, HTTPPayloadTooLargeError, HTTPUnauthorizedError } from './error.js';
import { METHOD_NOT_ALLOWED, INTERNAL_SERVER_ERROR, NO_CONTENT, FORBIDDEN } from '@shgysk8zer0/consts/status.js';
import { isSameOriginRequest } from './utils.js';
import { contextFallback } from './context.js';
import { NetlifyRequest } from './NetlifyRequest.js';

const ACAO = 'Access-Control-Allow-Origin';
// const ACRM = 'Access-Control-Request-Method';
const ACAC = 'Access-Control-Allow-Credentials';
const ACAM = 'Access-Control-Allow-Methods';
const ACAH = 'Access-Control-Allow-Headers';
const ACRH = 'Access-Control-Request-Headers';
const ACEH = 'Access-Control-Expose-Headers';

// const between = (min, val, max) => ! (val > max || val < min);

export function createOptionsHandler(methods) {
	return async function() {
		const allow = [...methods, 'OPTIONS'].join(', ').toUpperCase();

		const headers = new Headers({
			Allow: allow,
			[ACAM]: allow,
		});

		return new Response(null, { headers, status: NO_CONTENT });
	};
}

function addCorsHeaders(resp, req, { allowHeaders, allowOrigins, allowCredentials, exposeHeaders } = {}) {
	try {
		if (req instanceof Request && req.headers.has('Origin')) {
			const origin = URL.parse(req.headers.get('Origin'))?.origin;

			if (allowCredentials && ! resp.headers.has(ACAC)) {
				resp.headers.set(ACAC, 'true');
			}

			if (resp.headers.has(ACAC) && isAllowedOrigin(req, allowOrigins) && (resp.headers.get(ACAO) === '*' || ! resp.headers.has(ACAO)) ) {
				resp.headers.set(ACAO, origin);
			} else if (!resp.headers.has(ACAO) && (typeof allowOrigins === 'undefined' || isAllowedOrigin(req, allowOrigins))) {
				resp.headers.set(ACAO, '*');
			}

			if (
				(Array.isArray(allowHeaders) && allowHeaders.length !== 0)
				&& ! resp.headers.has(ACAH)
			) {
				resp.headers.set(ACAH, allowHeaders.join(', '));
			} else if (req.headers.has(ACRH) && ! resp.headers.has(ACAH)) {
				resp.headers.set(ACAH, req.headers.get(ACRH));
			}

			if (Array.isArray(exposeHeaders) && exposeHeaders.length !== 0 && ! req.headers.has(ACEH)) {
				resp.headers.set(ACEH, exposeHeaders.join(', '));
			}
		}
	} catch(err) {
		console.error(err);
	}

	return resp;
}

export function isAllowedOrigin(req, allowOrigins) {
	const origin = req.headers.has('Origin')
		? URL.parse(req.headers.get('Origin'))?.origin ?? null
		: null;

	switch(typeof allowOrigins) {
		case 'undefined':
			return true;

		case 'string':
			return allowOrigins === '*' || origin === allowOrigins;

		case 'object':
			return Array.isArray(allowOrigins)
				&& typeof origin === 'string'
				&& (
					(allowOrigins.includes('*') || allowOrigins.includes(origin))
				) || (allowOrigins instanceof Set
						&& (allowOrigins instanceof Set && allowOrigins.has('*') || allowOrigins.has(origin)));
	}
}

/**
 * Creates a request handler that manages CORS and dispatches to appropriate handlers.
 *
 * @function createHandler
 * @param {Object.<string, function(Request, *): (Response|Promise<Response>)>} handlers - A map of HTTP methods (lowercase) to their corresponding handler functions.
 * @param {Object} [options] - Optional configuration settings.
 * @param {string|string[]|Set<string>} [options.allowOrigins] - Allowed origins. Can be a string, array of strings, or a Set of strings. Defaults to allowing all origins.
 * @param {string|string[]} [options.allowHeaders] - Allowed headers. Can be a string or an array of strings.
 * @param {boolean} [options.allowCredentials=false] - Whether to allow credentials (cookies, authorization headers, etc.).
 * @param {string|string[]} [options.exposeHeaders] - Headers to expose to the client. Can be a string or an array of strings.
 * @param {number} [options.maxContentLength] - Maximum size allowed via Content-Length headers.
 * @param {function(Error, Request)} [options.logger=console.error] - A function to log errors. It receives the error object and the request as arguments.
 * @returns {function(Request, *): Promise<Response>} An async request handler function.
 *
 * @throws {TypeError} If the first argument is not a Request object.
 */
export function createHandler(handlers, {
	allowHeaders,
	allowOrigins,
	allowCredentials = false,
	exposeHeaders,
	requireCORS = false,
	requireSameOrigin = false,
	maxContentLength = NaN,
	requireCredentials = false,
	logger,
} = {}) {
	if ((typeof handlers !== 'object' || handlers === null)) {
		throw new TypeError('Handlers must be an object keyed by HTTP method and values of the handler functions.');
	}

	const methods = Object.keys(handlers);

	if (methods.length === 0) {
		throw new Error('No methods given.');
	} else if (requireCORS && requireSameOrigin) {
		throw new TypeError('Cannot require both CORS and Same-Origin.');
	}

	if (! (handlers.options instanceof Function)) {
		handlers.options = createOptionsHandler(methods, { allowHeaders, allowOrigins });
	}

	return async (orig, context = contextFallback) => {
		try {
			if (
				orig.headers.has('Content-Length')
				&& (Number.isSafeInteger(maxContentLength) && maxContentLength >= 0)
				&& parseInt(orig.headers.get('Content-Length')) > maxContentLength
			 ) {
				throw new HTTPPayloadTooLargeError(`Max Content-Length is ${maxContentLength} - sent ${orig.headers.get('Content-Length')}.`, {
					details: {
						contentLength: parseInt(orig.headers.get('Content-Length')),
						maxContentLength,
					},
				});
			} else if (orig.body instanceof ReadableStream && ! orig.headers.has('Content-Length')) {
				throw new HTTPLengthRequiredError('Request is missing required Content-Length header.');
			}

			const req = new NetlifyRequest(orig, context);

			if (requireCredentials && ! req.credentials === 'include') {
				throw new HTTPUnauthorizedError(`${req.url} requires credentials.`);
			} else if (requireSameOrigin && ! req.isSameOrigin) {
				throw new HTTPError('Must be a same-origin request.', FORBIDDEN);
			} else if (
				requireCORS
				&& ! isSameOriginRequest(req)
				&& Array.isArray(allowOrigins) && allowOrigins.length !== 0
				&& ! isAllowedOrigin(req, allowOrigins)
			) {
				throw new HTTPError(`Disallowed Origin: ${req.headers.get('Origin')}.`, FORBIDDEN);
			} else if (! (handlers[req.method.toLowerCase()] instanceof Function)) {
				throw new HTTPError(`Unsupported request method: ${req.method}`, METHOD_NOT_ALLOWED, {
					headers: { Allow: Object.keys(handlers).map(method => method.toUpperCase()).join(', ') },
				});
			} else {
				const resp = await handlers[req.method.toLowerCase()].call(context, req, context);

				if (resp instanceof Response) {
					if (resp.status === 0) {
						const resp = new HTTPError('Something broke :(', INTERNAL_SERVER_ERROR).response();
						addCorsHeaders(resp, req, { allowHeaders, allowOrigins, allowCredentials, exposeHeaders });
						return resp;
					} else {
						addCorsHeaders(resp, req, { allowHeaders, allowOrigins, allowCredentials, exposeHeaders });
						return resp;
					}
				} else {
					throw new HTTPError('Invalid response.', INTERNAL_SERVER_ERROR);
				}
			}
		} catch (err) {
			if (logger instanceof Function) {
				logger.call(context, err, orig, context);
			}

			if (err instanceof HTTPError) {
				const resp = Response.json(err, { status: err.status, headers: new Headers(err.headers) });
				return addCorsHeaders(resp, orig, { allowHeaders, allowOrigins, allowCredentials, exposeHeaders });
			} else {
				const resp = Response.json({
					error: {
						message: 'An unknown error occured',
						status: INTERNAL_SERVER_ERROR,
					}
				}, {
					status: INTERNAL_SERVER_ERROR,
					headers: new Headers({ [ACAO]: '*' }),
				});

				return addCorsHeaders(resp, orig, { allowHeaders, allowOrigins, allowCredentials, exposeHeaders });
			}
		}
	};
}
