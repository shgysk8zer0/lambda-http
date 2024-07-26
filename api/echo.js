import { createHandler } from '@shgysk8zer0/lambda-http/handler.js';
import { FORM_MULTIPART, FORM_URL_ENCODED, JSON as JSON_MIME, TEXT } from '@shgysk8zer0/lambda-http/mimes.js';

Headers.prototype.toJSON = function() {
	return Object.fromEntries(this);
};

Blob.prototype.toJSON = function() {
	return { size: this.size, type: this.type };
};

FormData.prototype.toJSON = function() {
	return Object.fromEntries(this.entries());
};

File.prototype.toJSON = function() {
	return { name: this.name, type: this.type, size: this.size };
};

async function getBody(req) {
	if (req.method !== 'GET' && req.method !== 'DELETE') {
		switch (req.headers.get('Content-Type')?.split(';')?.at(0)?.toLowerCase()?.trim()) {
			case JSON_MIME:
				return await req.json();

			case FORM_MULTIPART:
			case FORM_URL_ENCODED:
				return await req.formData();

			case TEXT:
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
