import '@shgysk8zer0/polyfills';
import {
	HTTPBadRequestError, HTTPError, HTTPForbiddenError, HTTPInternalServerError, HTTPLengthRequiredError,
	HTTPMethodNotAllowedError, HTTPPayloadTooLargeError, HTTPUnauthorizedError,
} from './error.js';
import { METHOD_NOT_ALLOWED, NO_CONTENT } from '@shgysk8zer0/consts/status.js';
import { contextFallback } from './context.js';
import { NetlifyRequest } from './NetlifyRequest.js';
import { ACAO, ACAC, ACAM, ACAH, ACRH, ACEH, AUTH, ORIGIN, ALLOW, CONTENT_LENGTH } from './consts.js';
import { decodeRequestToken } from '@shgysk8zer0/jwk-utils/jwt.js';

const NO_BODY_METHODS = ['HEAD', 'GET', 'OPTIONS', 'DELETE'];
const REDIRECT_CODES = [301, 302, 303, 307, 308];

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

function isRedirect(resp) {
	return resp.headers.has('Location') && REDIRECT_CODES.includes(resp.status);
}

function addCorsHeaders(resp, req, {
	allowHeaders,
	allowOrigins,
	allowCredentials,
	exposeHeaders,
	methods,
} = {}) {
	try {
		// `Response.redirect` and `Response.error` have immutable headers
		if (req instanceof Request && req.headers.has(ORIGIN) && ! (resp.status === 0 || isRedirect(resp))) {
			const origin = URL.parse(req.headers.get(ORIGIN))?.origin;

			if (allowCredentials && ! resp.headers.has(ACAC)) {
				resp.headers.set(ACAC, 'true');
			}

			if (
				resp.headers.has(ACAC)
				&& typeof origin === 'string'
				&& isAllowedOrigin(req, allowOrigins)
				&& (! resp.headers.has(ACAO) || resp.headers.get(ACAO) === '*')
			) {
				resp.headers.set(ACAO, origin);
			} else if (! resp.headers.has(ACAO) && (typeof allowOrigins === 'undefined' || isAllowedOrigin(req, allowOrigins))) {
				resp.headers.set(ACAO, '*');
			}

			if (
				Array.isArray(allowHeaders)
				&& allowHeaders.length !== 0
				&& ! resp.headers.has(ACAH)
			) {
				resp.headers.set(ACAH, allowHeaders.join(', '));
			} else if (req.headers.has(ACRH) && ! resp.headers.has(ACAH)) {
				resp.headers.set(ACAH, req.headers.get(ACRH));
			}

			if (Array.isArray(exposeHeaders) && exposeHeaders.length !== 0 && ! req.headers.has(ACEH)) {
				resp.headers.set(ACEH, exposeHeaders.join(', '));
			}

			if (resp.status === METHOD_NOT_ALLOWED && ! resp.headers.has(ALLOW) && Array.isArray(methods)) {
				resp.headers.set(ALLOW, methods.join(', '));
			}
		} else if (resp.status === METHOD_NOT_ALLOWED && ! resp.headers.has(ALLOW) && Array.isArray(methods)) {
			resp.headers.set(ALLOW, methods.join(', '));
		}
	} catch(err) {
		console.error(err);
	}

	return resp;
}

function getOrigin(req) {
	if (req.headers.has('Origin')) {
		return URL.parse(req.headers.get('Origin'))?.origin;
	} else {
		return URL.parse(req.referrer)?.origin;
	}
}

export function isAllowedOrigin(req, allowOrigins) {
	const origin = getOrigin(req);

	switch(typeof allowOrigins) {
		case 'undefined':
			return true;

		case 'string':
			return allowOrigins === '*' || origin === allowOrigins;

		case 'object':
			if (allowOrigins instanceof RegExp || allowOrigins instanceof URLPattern) {
				return allowOrigins.test(origin);
			} else if (allowOrigins instanceof Set) {
				return allowOrigins.includes('*') || allowOrigins.includes(origin);
			} else if (Array.isArray) {
				return allowOrigins.includes('*') || allowOrigins.includes(origin);
			}
			break;

		default:
			return false;
	}
}

/**
 * Creates a request handler that manages CORS and dispatches to appropriate handlers.
 *
 * @function createHandler
 * @param {Object.<string, function(Request, *): (Response|Promise<Response>)>} handlers - A map of HTTP methods (lowercase) to their corresponding handler functions.
 * @param {Object} [options] - Optional configuration settings.
 * @param {string|string[]} [options.allowHeaders] - Allowed headers. Can be a string or an array of strings.
 * @param {string|string[]} [options.exposeHeaders] - Headers to expose to the client. Can be a string or an array of strings.
 * @param {string|string[]|Set<string>|URLPattern} [options.allowOrigins] - Allowed origins. Can be a string, array of strings, or a Set of strings. Defaults to allowing all origins.
 * @param {boolean} [options.allowCredentials=false] - Whether to allow credentials (cookies, authorization headers, etc.).
 * @param {boolean} [options.requireCORS=false] - If set, a valid Origin header will be required.
 * @param {boolean} [options.requireSameOrigin=false] - If set, requires a same-origin request, determined by the referrer vs origin of the request URL.
 * @param {boolean} [options.requireContentLength=false] - If set and Content-Length header is not set, throws a HTTPLengthRequiredError.
 * @param {number} [options.maxContentLength=NaN] - Maximum size allowed via Content-Length headers. If exceeded, throws a HTTPPayloadTooLargeError
 * @param {boolean} [options.requireCredentials=false] - If set, requires `request.credentials === 'include'.
 * @param {boolean} [options.requireJWT=false] - If set, requires an "Authorization Bearer :token" header. Throws HTTPUnauthorized if missing or invalid.
 * @param {string[]} [options.requireHeaders] - A list of headers the request must have. Throws HTTPBadRequestError if any are missing.
 * @param {string[]} [options.requireSearchParams] - A list of search params the request must have. Throws HTTPBadRequestError if any are missing.
 * @param {function(Error, Request)} [options.logger] - A function to log errors. It receives the error object and the request as arguments.
 * @returns {function(Request, object): Promise<Response>} An async request handler function.
 *
 * @throws {TypeError} If the first argument is not a Request object.
 * @throws {HTTPUnauthorizedError} If missing required Authorization header or cookies.
 * @throws {HTTPBadRequestError} If required search params or headers are missing.
 * @throws {HTTPLengthRequiredError} If `requireContentLength` is true and not Content-Length header is present
 * @throws {HTTPPayloadTooLargeError} If `maxContentLength` is a positive number and Content-Length header exceeds that.
 * @throws {HTTPMethodNotAllowedError} If request method (lower-cased) is not found in the keys of `handlers`. Note that OPTIONS is automatically added if missing.
 * @throws {HTTPInternalServerError} If the handler throw an error other than an HTTPError, or if the response was not a Response object.
 */
export function createHandler(handlers, {
	allowHeaders,
	exposeHeaders,
	allowOrigins,
	allowCredentials = false,
	requireCORS = false,
	requireSameOrigin = false,
	requireContentLength = false,
	maxContentLength = NaN,
	requireCredentials = false,
	requireJWT = false,
	requireHeaders,
	requireSearchParams,
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

	if (handlers.get instanceof Function && ! (handlers.head instanceof Function)) {
		handlers.head = async () => new Response(null, { status: NO_CONTENT });
	}

	if (! (handlers.options instanceof Function)) {
		handlers.options = createOptionsHandler(methods, { allowHeaders, allowOrigins });
	}

	if (Array.isArray(requireHeaders) && Array.isArray(allowHeaders)) {
		allowHeaders = [...new Set([...allowHeaders, ...requireHeaders])];
	}

	if ((requireCredentials || requireJWT) && ! (Array.isArray(allowHeaders) && allowHeaders.includes(AUTH))) {
		allowHeaders = Array.isArray(allowHeaders) ?  [...allowHeaders, AUTH] : [AUTH];
	}

	return async (orig, context = contextFallback) => await Promise.try(async () => {
		const params = new URLSearchParams(orig.url);
		const missingHeaders = Array.isArray(requireHeaders) ? requireHeaders.filter(header => ! orig.headers.has(header)) : [];

		if (! (handlers[orig.method.toLowerCase()] instanceof Function)) {
			throw new HTTPMethodNotAllowedError(`Unsupported request method: ${orig.method}`, {
				headers: { Allow: methods.join(', ').toUpperCase() },
			});
		}

		if (requireJWT && ! orig.headers.has(AUTH)) {
			throw new HTTPUnauthorizedError(`Access requires a JWT via ${AUTH} header.`);
		} else if (
			missingHeaders.length !== 0
			&& orig.method !== 'OPTIONS'
			&& orig.method !== 'HEAD'
		) {
			if (missingHeaders.includes(AUTH)) {
				throw new HTTPUnauthorizedError('Missing required Authorization header.');
			} else {
				throw new HTTPBadRequestError('Request is missing required headers', { details: { requireHeaders } });
			}
		} else if (requireJWT && decodeRequestToken(orig) === null) {
			throw new HTTPUnauthorizedError('Authorization was given, but is invalid.');
		} else if (
			! Number.isNaN(maxContentLength)
			&& orig.headers.has(CONTENT_LENGTH)
			&& (Number.isSafeInteger(maxContentLength) && maxContentLength >= 0)
			&& parseInt(orig.headers.get(CONTENT_LENGTH)) > maxContentLength
		 ) {
			throw new HTTPPayloadTooLargeError(`Max Content-Length is ${maxContentLength} - sent ${orig.headers.get(CONTENT_LENGTH)}.`, {
				details: {
					contentLength: parseInt(orig.headers.get(CONTENT_LENGTH)),
					maxContentLength,
				},
			});
		} else if (
			requireContentLength
			&& ! NO_BODY_METHODS.includes(orig.method)
			&& orig.body instanceof ReadableStream
			&& ! orig.headers.has(CONTENT_LENGTH)
		) {
			throw new HTTPLengthRequiredError('Request is missing required Content-Length header.');
		} else if (
			Array.isArray(requireSearchParams)
			&& orig.method !== 'OPTIONS' && orig.method !== 'OPTIONS'
			&& ! requireSearchParams.every(param => params.has(param))
		) {
			throw new HTTPBadRequestError('Request is missing required search params.', { details: { requireSearchParams }});
		}

		const req = new NetlifyRequest(orig, context);

		if (requireCredentials && ! req.credentials === 'include') {
			throw new HTTPUnauthorizedError(`${req.url} requires credentials.`);
		} else if (requireSameOrigin && ! req.isSameOrigin) {
			throw new HTTPForbiddenError('Must be a same-origin request.');
		} else if (
			typeof allowOrigins !== 'undefined'
			&& ! req.isSameOrigin
			&& ! isAllowedOrigin(req, allowOrigins)
		) {
			throw new HTTPForbiddenError(`Disallowed Origin: ${req.headers.get(ORIGIN)}.`);
		} else {
			const resp = await handlers[req.method.toLowerCase()].call(context, req, context);

			switch (typeof resp) {
				case 'undefined':
					return new Response(null, { status: NO_CONTENT });

				case 'number':
					return new Response(null, { status: Math.min(599, Math.max(100, resp)) });

				case 'string':
					return new Response([resp]);

				case 'object':
					if (resp === null) {
						return new Response(null, { status: NO_CONTENT });
					} else if (resp instanceof Response) {
						return resp;
					} else if (resp instanceof Blob) {
						return new Response(resp);
					} else if (resp instanceof Headers) {
						return new Response(null, { headers: resp, status: NO_CONTENT });
					} else if (resp instanceof URL) {
						return Response.redirect(resp);
					} else if (resp instanceof HTTPError) {
						return resp.response;
					} else if (resp instanceof Error || resp instanceof DOMException) {
						throw new HTTPInternalServerError('Something broke :(', { cause: resp });
					} else {
						return Response.json(resp);
					}

				default:
					throw new HTTPInternalServerError(`Could not create a response from a ${typeof resp}.`);

			}
		}
	}).then(result => {
		if (result instanceof Response && result.status !== 0) {
			addCorsHeaders(result, orig, { allowHeaders, allowOrigins, allowCredentials, exposeHeaders, methods });

			return result;
		} else if (result instanceof HTTPError) {
			const resp = result.response;
			addCorsHeaders(resp, orig, { allowHeaders, allowOrigins, allowCredentials, exposeHeaders, methods });
			return resp;
		} else {
			throw new HTTPInternalServerError('An unknown error occured');
		}
	}).catch(err => {
		if (logger instanceof Function) {
			logger(err);
		}

		if (err instanceof HTTPError) {
			const resp = err.response;
			addCorsHeaders(resp, orig, { allowHeaders, allowOrigins, allowCredentials, exposeHeaders, methods });
			return resp;
		} else {
			const resp = new HTTPInternalServerError('An unknown error occured').response;
			addCorsHeaders(resp, orig, { allowHeaders, allowOrigins, allowCredentials, exposeHeaders, methods });
			return resp;
		}
	});
}
