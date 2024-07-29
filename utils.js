import { JSON as JSON_MIME, FORM_MULTIPART, FORM_URL_ENCODED } from '@shgysk8zer0/consts/mimes.js';

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
