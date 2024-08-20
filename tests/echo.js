import { RequestHandlerTest } from '../RequestHandlerTest.js';

const origin = 'http://localhost:8888';
const url = new URL('/api/echo', origin);
const referrer = origin;
const body = new FormData();
body.set('foo', 'bar');
body.set('file', new File(['Hello, World!'], 'hi.txt', { type: 'text/plain' }));

const headers = {
	'Sec-Fetch-Dest': 'empty',
	'Sec-Fetch-Mode': 'no-cors',
	'Sec-Fetch-Site': 'same-origin',
	'Origin': origin,
	'Referer': referrer,
};

const { error } = await RequestHandlerTest.runTests(
	new RequestHandlerTest(
		new Request(url + '?test=basic', { headers, referrer }),
		[RequestHandlerTest.shouldRequireSameOrigin, RequestHandlerTest.shouldBeOk, RequestHandlerTest.shouldBeJSON]
	),
	new RequestHandlerTest(
		new Request(url + '?test=invalid=method', {
			method: 'PATCH',
			headers,
			body,
		}),
		RequestHandlerTest.shouldNotAllowMethod
	),
	new RequestHandlerTest(
		new Request(url + '?4'),
		RequestHandlerTest.shouldClientError
	),
	new RequestHandlerTest(
		new Request(url + '?test=cross-origin', {
			headers: {
				...headers,
				Origin: 'https://not-allowed.org',
				Referer: 'about:client'
			},
			mode: 'cors',
			referrerPolicy: 'no-referrer',
		}),
		[RequestHandlerTest.shouldDisallowOrigin, RequestHandlerTest.shouldRequireSameOrigin, RequestHandlerTest.shouldClientError]
	),
	new RequestHandlerTest(
		new Request(url + '?test=options', {
			method: 'OPTIONS',
			referrer,
			headers: {
				'Access-Control-Request-Method': 'POST',
				...headers
			}
		}),
		[RequestHandlerTest.shouldBeOk, RequestHandlerTest.shouldAllowMethod]
	)
);

if (error instanceof Error) {
	throw error;
}
