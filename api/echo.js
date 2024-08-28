import { createHandler } from '../handler.js';
import { HTTPError } from '../error.js';
import { NOT_ACCEPTABLE } from '@shgysk8zer0/consts/status.js';
import { Cookie } from '../cookies.js';

function encode(thing) {
	if (thing instanceof Headers || thing instanceof URLSearchParams) {
		return Object.fromEntries(thing);
	} else if (thing instanceof File) {
		return { name: thing.name, size: thing.size, type: thing.type };
	} else if (thing instanceof Blob) {
		return { size: thing.size, type: thing.type };
	} else if (thing instanceof FormData) {
		return Object.fromEntries(Array.from(
			thing.keys(),
			key => [key, thing.getAll(key)]
		));
	} else {
		return thing;
	}
}

async function createResponse(req) {
	if (req.accepts('application/json')) {
		const url = new URL(req.url);
		const cookie = new Cookie({
			name: 'foo',
			value: 'bar',
			domain: url.domain,
			path: url.pathname,
			httpOnly: true,
			secure: true,
			sameSite: 'lax',
			expires: Date.now() + 36_000,
			partitioned: true,
		});

		const headers = new Headers({ 'Set-Cookie': cookie });

		return Response.json({
			url: req.url,
			method: req.method,
			mode: req.mode,
			destination: req.destination,
			referrer: req.referrer,
			refererPolicy: req.referrerPolicy,
			credentials: req.credentials,
			headers: encode(req.headers),
			accept: req.accept,
			geo: req.geo,
			uid: req.cookies.get('uid'),
			searchParams: encode(req.searchParams),
			body: encode(await req.data()),
		}, { headers });
	} else {
		throw new HTTPError(`Does not support: ${req.accept.join(', ')}`, NOT_ACCEPTABLE);
	}
}

export default createHandler(Object.fromEntries([
	...['get', 'delete', 'post', 'put'].map(method => [method, createResponse]),
]), {
	allowOrigins: new URLPattern({ hostname: 'localhost', port: ':port(8888|9999)' }),
	allowHeaders: ['X-Foo', 'Authorization', 'Content-Type'],
	exposeHeaders: ['X-Bar'],
	allowCredentials: true,
	maxContentLength: 50_000,
	requireSameOrigin: true,
	requireHeaders: ['X-Foo'],
});
