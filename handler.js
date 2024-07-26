import { HTTPError } from './error.js';
import { METHOD_NOT_ALLOWED, INTERNAL_SERVER_ERROR, NO_CONTENT, FORBIDDEN } from './status.js';

const ACAO = 'Access-Control-Allow-Origin';
// const ACRM = 'Access-Control-Request-Method';
const ACAC = 'Access-Control-Allow-Credentials';
const ACAH = 'Access-Control-Allow-Headers';
const ACRH = 'Access-Control-Request-Headers';
const ACEH = 'Access-Control-Expose-Headers';

export function createOptionsHandler(methods) {
	return async function() {
		const allow = [...methods, 'options'];
		const headers = new Headers({
			Allow: allow.join(', ').toUpperCase(),
			[ACAH]: allow.join(', ').toUpperCase(),
		});

		return new Response(null, { headers, status: NO_CONTENT });
	};
}

function addCorsHeaders(resp, req, { allowHeaders, allowCredentials, exposeHeaders } = {}) {
	try {
		if (req.headers.has('Origin') && URL.canParse(req.headers.get('Origin'))) {
			if (allowCredentials && ! resp.headers.has(ACAC)) {
				resp.headers.set(ACAC, 'true');
			}


			if (resp.headers.has(ACAC) && (! resp.headers.has(ACAO) || resp.headers.get(ACAO) === '*')) {
				resp.headers.set(ACAO, req.headers.get('Origin'));
			}

			if (resp.headers.has(ACAC) && ! resp.headers.has(ACAO)) {
				resp.headers.set(ACAO, req.headers.get('Origin'));
			} else {
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
	} finally {
		return resp;
	}
}

export function isAllowedOrigin(req, allowOrigins) {
	switch(typeof allowOrigins) {
		case 'undefined':
			return true;

		case 'string':
			return allowOrigins === '*' || req.headers.get('Origin') === allowOrigins;

		case 'object':
			return Array.isArray(allowOrigins)
				&& req.headers.has('Origin' )
				&& (
					(allowOrigins.includes('*') || allowOrigins.includes(req.headers.get('Origin')))
				) || (allowOrigins instanceof Set
						&& (allowOrigins instanceof Set && allowOrigins.has('*') ||allowOrigins.has(req.headers.get('Origin'))));
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
	logger = err => console.error(err),
} = {}) {
	if ((typeof handlers !== 'object' || handlers === null)) {
		throw new TypeError('Handlers must be an object keyed by HTTP method and values of the handler functions.');
	}

	const methods = Object.keys(handlers);

	if (methods.length === 0) {
		throw new Error('No methods given.');
	}

	if (! (handlers.options instanceof Function)) {
		handlers.options = createOptionsHandler(methods, { allowHeaders, allowOrigins });
	}

	return async (req, context = Object.freeze({})) => {
		try {
			if (! req instanceof Request) {
				throw new TypeError('Not a Request object.');
			} else if (
				Array.isArray(allowOrigins) && allowOrigins.length !== 0
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
					addCorsHeaders(resp, req, { allowHeaders, allowCredentials, exposeHeaders });
					return resp;
				} else {
					throw new HTTPError('Invalid response.', INTERNAL_SERVER_ERROR);
				}
			}
		} catch (err) {
			logger instanceof Function
				? logger.call(context, err, req, context)
				: console.error(err);

			if (err instanceof HTTPError) {
				const resp = Response.json(err, { status: err.status, headers: new Headers(err.headers) });
				addCorsHeaders(resp, req, { allowHeaders, allowCredentials, exposeHeaders });

				return resp;
			} else {
				const resp = Response.json({
					error: {
						message: 'An unknown error occured',
						status: INTERNAL_SERVER_ERROR,
					}
				}, {
					status: INTERNAL_SERVER_ERROR,
					headers: req.headers.has('Origin') ? new Headers({ [ACAO]: '*' }) : undefined,
				});

				return addCorsHeaders(resp, req, { allowHeaders, allowCredentials, exposeHeaders });
			}
		}
	};
}
