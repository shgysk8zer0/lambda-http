import { PAYLOAD_TOO_LARGE } from '@shgysk8zer0/consts/status.js';
import { RequestHandlerTest } from '../RequestHandlerTest.js';
import { TestRequest } from '../TestRequest.js';

const origin = 'http://localhost:8888';
const url = new URL('/api/echo', origin);
const referrer = origin;
const body = new FormData();
body.set('foo', 'bar');
const file = new Blob([crypto.getRandomValues(new Uint8Array(5000))], { type: 'application/octet-stream' });
body.set('file', file);

const headers = {
	'Origin': origin,
};

const { error } = await RequestHandlerTest.runTests(
	new RequestHandlerTest(
		new TestRequest(url, { headers, referrer, searchParams: { test: 'basic' }}),
		[
			RequestHandlerTest.shouldRequireSameOrigin,
			RequestHandlerTest.shouldBeOk,
			RequestHandlerTest.shouldHaveBody,
			RequestHandlerTest.shouldBeJSONObject,
			RequestHandlerTest.shouldSetCookies('foo'),
			RequestHandlerTest.shouldNotSetCookies('bar'),
		]
	),
	new RequestHandlerTest(
		new TestRequest(url, {
			method: 'POST',
			headers,
			body: new Blob([crypto.getRandomValues(new Uint8Array(65_536))], { type: 'application/octet-stream' }),
		}),
		[RequestHandlerTest.shouldHaveStatus(PAYLOAD_TOO_LARGE)]
	),
	new RequestHandlerTest(
		TestRequest.json({ now: Date.now() }, url, { headers, searchParams: { test: 'json' }}),
		RequestHandlerTest.shouldBeOk
	),
	new RequestHandlerTest(
		new TestRequest(url, { referrer }),
		[RequestHandlerTest.shouldHaveJSONKeys('url', 'headers')]
	),
	new RequestHandlerTest(
		new TestRequest(url, {
			searchParams: { test: 'invalid-method' },
			method: 'PATCH',
			headers,
			body: body.get('file'),
		}),
		RequestHandlerTest.shouldNotAllowMethod
	),
	new RequestHandlerTest(
		new Request(url + '?4'),
		RequestHandlerTest.shouldClientError
	),
	new RequestHandlerTest(
		new TestRequest(url, {
			searchParams: { test: 'form-data' },
			method: 'POST',
			headers,
			body,
		})
	),
	new RequestHandlerTest(
		new TestRequest(url + '?test=cross-origin', {
			headers: {
				...headers,
				Origin: 'https://not-allowed.org',
				// Referer: 'about:client'
			},
			referrer: 'about:client',
			mode: 'cors',
			referrerPolicy: 'no-referrer',
		}),
		[RequestHandlerTest.shouldDisallowOrigin, RequestHandlerTest.shouldRequireSameOrigin, RequestHandlerTest.shouldClientError]
	),
	new RequestHandlerTest(
		new TestRequest(url + '?test=options', {
			method: 'OPTIONS',
			referrer,
			headers: {
				'Access-Control-Request-Method': 'POST',
				'Access-Control-Request-Headers': 'X-Foo',
				...headers
			}
		}),
		[
			RequestHandlerTest.shouldExposeHeaders('X-Bar'),
			RequestHandlerTest.shouldNotExposeHeaders('X-Bazz'),
			RequestHandlerTest.shouldPassPreflight,
		]
	)
);

if (error instanceof Error) {
	throw error;
}
