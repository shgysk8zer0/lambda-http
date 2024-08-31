import '@shgysk8zer0/polyfills';
import { JSON as JSON_MIME, FORM_MULTIPART, FORM_URL_ENCODED } from '@shgysk8zer0/consts/mimes.js';
import { TestRequest } from './TestRequest.js';
import { HTTPError, HTTPNotImplementedError, HTTPNotFoundError, HTTPInternalServerError } from './error.js';
import { contextFallback as context } from './context.js';

const addExtension = (src, ext = 'js') => /\.(c|m)?js$/.test(src) ? src : `${src}.${ext}`;

const ROOT = 'process' in globalThis && process.cwd instanceof Function ? `file://${process.cwd()}/` : globalThis?.document?.baseURI;


export function getFileURL(src, base = ROOT) {
	if (src instanceof URL) {
		return URL.parse(src.pathname, base);
	} else if (typeof src === 'string' && URL.canParse(src) && ! src.startsWith('file:')) {
		return getFileURL('.' + new URL(src).pathname, base);
	} else {
		return URL.parse(src, base);
	}
}

export async function loadModuleHandler(src) {
	try {
		const module = await import(addExtension(src));

		if (! (module.default instanceof Function)) {
			throw new HTTPNotImplementedError(`${src} does not have a default export.`);
		} else {
			return module.default;
		}
	} catch(err) {
		if (err instanceof HTTPError) {
			throw err;
		} else if (err instanceof SyntaxError) {
			throw new HTTPInternalServerError(`<${src}> module contains errors`, { cause: err });
		} else {
			throw new HTTPNotFoundError(`<${src}> not found.`, { cause: err });
		}
	}
}

export function createFetchRequest(src, { referrer = import.meta.url, ...opts } = {}) {
	if (src instanceof Request) {
		return src;
	} else {
		const url = getFileURL(src);

		if (! (url instanceof URL && url.protocol === 'file:')) {
			throw new HTTPNotFoundError(`Invalid src: ${src}`);
		} else {
			return new TestRequest(url, { referrer, ...opts });
		}
	}
}

export async function fetchModule(src, opts) {
	try {
		const req = createFetchRequest(src, opts);
		const handler = await loadModuleHandler(req.url);

		if (handler instanceof HTTPError) {
			return handler.response;
		} else {
			const resp = await handler.call(context, req, context);

			if (! (resp instanceof Response)) {
				throw new HTTPInternalServerError(`<${req.url}> did not return a response.`);
			} else {
				return resp;
			}
		}
	} catch(err) {
		if (err instanceof HTTPError) {
			return err.response;
		} else {
			return new HTTPInternalServerError('An unhandled error occured.', { cause: err });
		}
	}
}

export function getContentType(req) {
	return req.headers.has('Content-Type') ? req.headers.get('Content-Type').split(';')[0].toLowerCase() : '';
}

export function isJSONRequest(req) {
	const type = getContentType(req);
	return type !== '' && [JSON_MIME, 'text/json'].some(mime => type.startsWith(mime));
}

export function isFormDataRequest(req) {
	const type = getContentType(req);
	return type !== '' && [FORM_MULTIPART, FORM_URL_ENCODED].some(mime => type.startsWith(mime));
}

export function getOriginOrReferrer(req) {
	if (! (req instanceof Request)) {
		return null;
	} else if (req.headers.has('Origin')) {
		return URL.parse('/', req.headers.get('Origin'));
	} else if (req.headers.has('Referer')) {
		return URL.parse('/', req.headers.get('Referer'));
	} else {
		return null;
	}
}

export function isSameOriginRequest(req) {
	if (! (req instanceof Request)) {
		return false;
	} else if (! URL.canParse(req.url)) {
		console.error('Invalid URL');
		return false;
	} else {
		const url = new URL(req.url);
		const reqOrigin = getOriginOrReferrer(req);
		return reqOrigin instanceof URL && url.origin === reqOrigin.origin;
	}
}

export function isCORSRequest(req) {
	return req instanceof Request && req.headers.has('Origin') && ! isSameOriginRequest(req);
}
