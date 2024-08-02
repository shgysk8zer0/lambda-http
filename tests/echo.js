import { RequestHandlerTest } from '../RequestHandlerTest.js';
import echo from '../api/echo.js';

const url = new URL('http://localhost:8888/.netlify/functions/echo');
const origin = 'http://localhost:9999';
const body = new FormData();
body.set('foo', 'bar');
body.set('file', new File(['Hello, World!'], 'hi.txt', { type: 'text/plain' }));

const { error } = await RequestHandlerTest.runTests(
	new RequestHandlerTest(
		new Request(url + '?1', { headers: new Headers({ Origin: origin }) }),
		echo,
		[RequestHandlerTest.shouldAllowOrigin, RequestHandlerTest.shouldBeOk]

	),
	new RequestHandlerTest(
		new Request(url + '?2', {
			method: 'PUT',
			headers: new Headers({ Origin: origin }),
			body: body.get('file'),
		}),
		echo,
		RequestHandlerTest.shouldBeOk
	),
	new RequestHandlerTest(
		new Request(url + '?3', {
			method: 'FOO',
			headers: new Headers({ Origin: origin }),
		}),
		echo,
		RequestHandlerTest.shouldNotAllowMethod
	),
	new RequestHandlerTest(
		new Request(url + '?4'),
		echo,
		RequestHandlerTest.shouldClientError
	),
	new RequestHandlerTest(
		new Request(url + '?5', { headers: { Origin: 'https://not-allowed.org' }}),
		echo,
		RequestHandlerTest.shouldDisallowOrigin
	)
);

if (error instanceof Error) {
	throw error;
}
