import { RequestHandlerTest } from '../RequestHandlerTest.js';
import { TestRequest } from '../TestRequest.js';

const url = new URL('http://localhost:8888/api/cookie.js');

const { error } = await RequestHandlerTest.runTests(
	new RequestHandlerTest(
		new TestRequest(url),
		[RequestHandlerTest.shouldClientError, RequestHandlerTest.shouldRequireCookies('foo')],
	),
	new RequestHandlerTest(
		new TestRequest(url, { headers: { Cookie: 'foo=bar' }}),
		[RequestHandlerTest.shouldBeOk, RequestHandlerTest.shouldRequireCookies('foo')],
	),
);

if (error instanceof Error) {
	throw error;
}
