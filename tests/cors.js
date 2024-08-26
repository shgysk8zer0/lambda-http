import { RequestHandlerTest } from '../RequestHandlerTest.js';
import { TestRequest } from '../TestRequest.js';
const url = new URL('http://localhost:8888/api/cors');
const referrer = 'http://localhost:9999';
const headers = { Origin: referrer };


const { error } = await RequestHandlerTest.runTests(
	new RequestHandlerTest(
		new TestRequest(url, {
			method: 'POST',
			headers,
			referrer,
		}),
		[RequestHandlerTest.shouldBeOk, RequestHandlerTest.shouldBeCorsResponse, RequestHandlerTest.shouldBeJSON]
	),
	new RequestHandlerTest(
		new TestRequest(url, {
			method: 'OPTIONS',
			headers: { ...headers, 'Access-Control-Request-Method': 'POST', 'Access-Control-Request-Headers': 'Authorization' },
			referrer,
		}),
		[RequestHandlerTest.shouldBeCorsResponse, RequestHandlerTest.shouldPassPreflight]
	),
);

if (error) {
	throw error;
}
