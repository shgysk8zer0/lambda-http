import { RequestHandlerTest } from '../RequestHandlerTest.js';
import { TestRequest } from '../TestRequest.js';

const token = new TextEncoder().encode(JSON.stringify({ msg: 'Hello, World!' })).toBase64();
const url = new URL('http://localhost:8888/api/auth.js');
const Origin = 'http://localhost:9999';
const headers = new Headers({ Origin });

const { error } = await RequestHandlerTest.runTests(
	new RequestHandlerTest(
		new TestRequest(url, { headers, token, searchParams: { test: 'authorized' }}),
		[RequestHandlerTest.shouldBeOk, RequestHandlerTest.shouldBeCorsResponse, RequestHandlerTest.shouldRequireCredentials]
	),
	new RequestHandlerTest(
		new TestRequest(url, { headers, searchParams: { test: 'unauthorized' }}),
		[RequestHandlerTest.shouldClientError, RequestHandlerTest.shouldBeCorsResponse, RequestHandlerTest.shouldRequireAuthorization]
	),
);

if (error) {
	throw error;
}
