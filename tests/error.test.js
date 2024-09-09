import { RequestHandlerTest } from '../RequestHandlerTest.js';
import { TestRequest } from '../TestRequest.js';

const url = 'http://localhost:8888/api/error';
const headers = new Headers({ Accept: 'application/json', Origin: 'http://localhost:9999' });

const { error } = await RequestHandlerTest.runTests(
	new RequestHandlerTest(
		new TestRequest(url, { headers }),
		[RequestHandlerTest.shouldHaveValidStatus, RequestHandlerTest.shouldServerError, RequestHandlerTest.shouldBeJSON]
	),
	new RequestHandlerTest(
		new TestRequest(url, { method: 'DELETE', headers }),
		[RequestHandlerTest.shouldNotAllowMethod]
	),
	new RequestHandlerTest(
		new TestRequest(url, { headers: { Accept: 'text/plain' }}),
		[RequestHandlerTest.shouldNotAccept]
	),
	new RequestHandlerTest(
		new TestRequest(url, {
			method: 'OPTIONS',
			headers: new Headers({
				'Access-Control-Request-Method': 'GET',
				Origin: 'http://localhost:9999',
				'Access-Control-Request-Headers': 'X-Foo, X-Bar'
			}),
		}),
		[RequestHandlerTest.shouldSupportOptionsMethod, RequestHandlerTest.shouldAllowRequestHeaders]
	),
	new RequestHandlerTest(
		new TestRequest(url, {
			method: 'OPTIONS',
			headers: { ...headers, 'Access-Control-Request-Method': 'PATCH' },
		}),
		RequestHandlerTest.shouldNotAllowMethod,
	)
);

if (error instanceof Error) {
	throw error;
}
