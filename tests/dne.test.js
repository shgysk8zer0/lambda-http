import { RequestHandlerTest } from '../RequestHandlerTest.js';
import { NOT_FOUND } from '@shgysk8zer0/consts/status.js';
import { TestRequest } from '../TestRequest.js';

const { error } = await RequestHandlerTest.runTests(
	new RequestHandlerTest(
		new TestRequest(new URL('./dne', 'http://localhost:8888')),
		[RequestHandlerTest.shouldHaveStatus(NOT_FOUND)]
	),
);

if (error instanceof Error) {
	throw error;
}
