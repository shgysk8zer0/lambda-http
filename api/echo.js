// import '@shgysk8zer0/lambda-http/polyfills.js';
// import { createHandler } from '@shgysk8zer0/lambda-http/handler.js';
// import { FORM_MULTIPART, FORM_URL_ENCODED, JSON as JSON_MIME, TEXT } from '@shgysk8zer0/lambda-http/mimes.js';

import { createHandler, MIME } from '@shgysk8zer0/lambda-http/lambda-http.mjs';

async function getBody(req) {
	Headers.prototype.toJSON = function() {
		return Object.fromEntries(this);
	};

	Blob.prototype.toJSON = function() {
		return { size: this.size, type: this.type };
	};

	FormData.prototype.toJSON = function() {
		return Object.fromEntries(Array.from(
			this.keys(),
			key => [key, this.getAll(key)]
		));
	};

	File.prototype.toJSON = function() {
		return { name: this.name, type: this.type, size: this.size };
	};
	if (req.method !== 'GET' && req.method !== 'DELETE' && req.method !== 'HEAD') {
		switch (req.headers.get('Content-Type')?.split(';')?.at(0)?.toLowerCase()?.trim()) {
			case MIME.JSON:
			case 'text/json':
				return await req.json();

			case MIME.FORM_MULTIPART:
			case MIME.FORM_URL_ENCODED:
				return await req.formData();

			case MIME.TEXT:
				return req.text();

			default:
				return req.blob();
		}
	} else {
		return null;
	}
}

async function createResponse(req) {
	this?.cookies?.set({
		name: 'foo',
		value: 'bar',
		expires: Date.now() + (3_600_00 * 24),
		path: '/',
		httpOnly: true,
		secure: true,
	});

	return Response.json({
		url: req.url,
		method: req.method,
		headers: Object.fromEntries(req.headers),
		body: await getBody(req),
	}, {
		headers: new Headers({ 'Access-Control-Allow-Origin': 'http://locahost:9999' })
	});
}

export default createHandler(Object.fromEntries([
	...['get', 'delete', 'post', 'patch'].map(method => [method, createResponse]),
	['put', async req => {
		const blob = await getBody(req);
		return new Response(blob);
	}],
]), {
	allowOrigins: ['*'],
	allowCredentials: true,
	logger(err, req) {
		console.error({ err, req });
	}
});
