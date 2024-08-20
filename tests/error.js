import { RequestHandlerTest } from '../RequestHandlerTest.js';
import { NOT_FOUND } from '@shgysk8zer0/consts/status.js';
// import { METHOD_NOT_ALLOWED } from '../status.js';

const url = 'http://localhost:8888/api/error';
const headers = new Headers({ Accept: 'application/json', Origin: 'http://localhost:9999' });

const { error } = await RequestHandlerTest.runTests(
	new RequestHandlerTest(
		new Request(url, { headers }),
		[RequestHandlerTest.shouldHaveValidStatus, RequestHandlerTest.shouldServerError, RequestHandlerTest.shouldBeJSON]
	),
	new RequestHandlerTest(
		new Request(url, { method: 'DELETE', headers }),
		RequestHandlerTest.shouldNotAllowMethod
	),
	new RequestHandlerTest(
		new Request(url, { headers: { Accept: 'text/plain' }}),
		RequestHandlerTest.shouldNotAccept,
	),
	new RequestHandlerTest(
		new Request(url, {
			method: 'OPTIONS',
			headers: new Headers({ 'Access-Control-Request-Method': 'GET', Origin: 'http://localhost:9999' }),
		}),
		[RequestHandlerTest.shouldSupportOptionsMethod]
	),
	new RequestHandlerTest(
		new Request(new URL('./dne', url)),
		RequestHandlerTest.shouldHaveStatus(NOT_FOUND)
	),
	new RequestHandlerTest(
		new Request(url, {
			method: 'OPTIONS',
			headers: { ...headers, 'Access-Control-Request-Method': 'PATCH' },
		}),
		RequestHandlerTest.shouldNotAllowMethod,
	)
);

if (error instanceof Error) {
	throw error;
}
