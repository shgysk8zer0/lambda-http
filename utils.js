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
