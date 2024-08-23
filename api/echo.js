import { createHandler } from '../handler.js';
import { HTTPError } from '../error.js';
import { NOT_ACCEPTABLE } from '@shgysk8zer0/consts/status.js';

function addJSONMethods() {
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
}

async function createResponse(req) {
	if (req.accepts('application/json')) {
		addJSONMethods();
		const headers = new Headers({ 'Set-Cookie': 'foo=bar' });

		return Response.json({
			url: req.url,
			method: req.method,
			mode: req.mode,
			destination: req.destination,
			referrer: req.referrer,
			refererPolicy: req.referrerPolicy,
			credentials: req.credentials,
			headers: Object.fromEntries(req.headers),
			accept: req.accept,
			geo: req.geo,
			uid: req.cookies.get('uid'),
			searchParams: Object.fromEntries(req.searchParams),
			body: await req.data(),
		}, { headers });
	} else {
		throw new HTTPError(`Does not support: ${req.accept.join(', ')}`, NOT_ACCEPTABLE);
	}
}

export default createHandler(Object.fromEntries([
	...['get', 'delete', 'post'].map(method => [method, createResponse]),
]), {
	allowOrigins: ['http://localhost:9999', 'http://localhost:8888'],
	allowHeaders: ['X-Foo'],
	exposeHeaders: ['X-Bar'],
	allowCredentials: true,
	maxContentLength: 50_000,
	// requireCORS: true,
	requireSameOrigin: true,
	// logger(err) {
	// 	console.error(err);
	// }
});
