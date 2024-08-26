import { NO_CONTENT, PAYLOAD_TOO_LARGE } from '@shgysk8zer0/consts/status.js';
import { RequestHandlerTest } from '../RequestHandlerTest.js';
import { TestRequest } from '../TestRequest.js';
import { OCTET_STREAM } from '@shgysk8zer0/consts/mimes.js';

function createRandomFile(size = 1, name= 'file.ext', {
	type = OCTET_STREAM,
	lastModified = Date.now(),
	endings = 'transparent',
} = {}) {
	return new File([crypto.getRandomValues(new Uint8Array(size))], name, { type, lastModified, endings });
}

function createRandomBlob(size = 1, {
	type = OCTET_STREAM,
	endings = 'transparent'
} = {}) {
	return new File([crypto.getRandomValues(new Uint8Array(size))], { type, endings });
}

function createFormData(data) {
	return Object.entries(data).reduce((fd, [key, val]) => {
		fd.set(key, val);
		return fd;
	}, new FormData());
}

const origin = 'http://localhost:8888';
const url = new URL('/api/echo', origin);
const referrer = origin;

const headers = {
	'Origin': origin,
};

const signal = AbortSignal.timeout(500);

const { error } = await RequestHandlerTest.runTests(
	new RequestHandlerTest(
		new TestRequest(url, { headers, referrer, signal, searchParams: { test: 'basic' }}),
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
			searchParams: { test: 'blob-body' },
			headers,
			referrer,
			signal,
			body: createRandomBlob(63_000),
		}),
		[RequestHandlerTest.shouldHaveStatus(PAYLOAD_TOO_LARGE)],
	),
	new RequestHandlerTest(
		TestRequest.json({ now: Date.now() }, url, { headers, referrer, signal, searchParams: { test: 'json' }}),
		RequestHandlerTest.shouldBeOk
	),
	new RequestHandlerTest(
		new TestRequest(url, { referrer, signal, searchParams: { test: 'json-keys' }}),
		[RequestHandlerTest.shouldHaveJSONKeys('url', 'headers')]
	),
	new RequestHandlerTest(
		new TestRequest(url, {
			searchParams: { test: 'invalid-method' },
			method: 'PATCH',
			headers,
			signal,
			body: createRandomBlob(),
		}),
		RequestHandlerTest.shouldNotAllowMethod
	),
	new RequestHandlerTest(
		new TestRequest(url, { signal, searchParams: { test: 'no-headers' }}),
		RequestHandlerTest.shouldClientError
	),
	 new RequestHandlerTest(
		new TestRequest(url, {
			method: 'POST',
			searchParams: { name: 'file' },
			headers,
			referrer,
			signal,
			body: createRandomFile(3000),
		}),
		[RequestHandlerTest.shouldBeOk, RequestHandlerTest.shouldBeJSON]
	 ),
	new RequestHandlerTest(
		new TestRequest(url, {
			searchParams: { test: 'url-form-data' },
			method: 'POST',
			headers,
			referrer,
			signal,
			body: new URLSearchParams(createFormData({ foo: 'bar', num: 42 })),
		}),
		[RequestHandlerTest.shouldBeOk]
	),
	new RequestHandlerTest(
		new TestRequest(url, {
			searchParams: { test: 'multipart-form-data' },
			method: 'POST',
			headers,
			referrer,
			signal,
			body: createFormData({ foo: 'bar', num: 42 })
		}),
		[RequestHandlerTest.shouldBeOk]
	),
	new RequestHandlerTest(
		new TestRequest(url, {
			searchParams: { test: 'cross-origin' },
			headers: { Origin: 'https://not-allowed.org' },
			referrer: 'about:client',
			mode: 'cors',
			signal,
			referrerPolicy: 'no-referrer',
		}),
		[RequestHandlerTest.shouldDisallowOrigin, RequestHandlerTest.shouldRequireSameOrigin, RequestHandlerTest.shouldClientError],
	),
	new RequestHandlerTest(
		new TestRequest(url, {
			searchParams: { test: 'options' },
			method: 'OPTIONS',
			referrer,
			signal,
			headers: {
				'Access-Control-Request-Method': 'POST',
				'Access-Control-Request-Headers': 'X-Foo',
				...headers
			}
		}),
		[
			RequestHandlerTest.shouldExposeHeaders('X-Bar'),
			RequestHandlerTest.shouldNotExposeHeaders('X-Bazz'),
			RequestHandlerTest.shouldAllowHeaders('X-Foo', 'Authorization'),
			RequestHandlerTest.shouldPassPreflight,
		]
	),
	new RequestHandlerTest(
		new TestRequest(url, {
			method: 'HEAD',
			referrer,
		}),
		[RequestHandlerTest.shouldHaveStatus(NO_CONTENT), RequestHandlerTest.shouldNotHaveBody]
	)
);

if (error instanceof Error) {
	throw error;
}
