import { RequestHandlerTest } from '../RequestHandlerTest.js';

const url = new URL('http://localhost:8888/api/echo');
const origin = 'http://localhost:9999';
const body = new FormData();
body.set('foo', 'bar');
body.set('file', new File(['Hello, World!'], 'hi.txt', { type: 'text/plain' }));

const { error } = await RequestHandlerTest.runTests(
	new RequestHandlerTest(
		new Request(url + '?1', { headers: new Headers({ Origin: origin }) }),
		[RequestHandlerTest.shouldAllowOrigin, RequestHandlerTest.shouldBeOk]

	),
	new RequestHandlerTest(
		new Request(url + '?2', {
			method: 'PUT',
			headers: new Headers({ Origin: origin }),
			body: body.get('file'),
		}),
		RequestHandlerTest.shouldBeOk
	),
	new RequestHandlerTest(
		new Request(url + '?3', {
			method: 'FOO',
			headers: new Headers({ Origin: origin }),
		}),
		RequestHandlerTest.shouldNotAllowMethod
	),
	new RequestHandlerTest(
		new Request(url + '?4'),
		RequestHandlerTest.shouldClientError
	),
	new RequestHandlerTest(
		new Request(url + '?5', { headers: { Origin: 'https://not-allowed.org' }}),
		RequestHandlerTest.shouldDisallowOrigin
	)
);

if (error instanceof Error) {
	throw error;
}
