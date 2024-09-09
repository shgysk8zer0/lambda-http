import { RequestHandlerTest } from '../RequestHandlerTest.js';
import { JS } from '@shgysk8zer0/consts/mimes.js';
import { TestRequest } from '../TestRequest.js';

const { error } = await RequestHandlerTest.runTests(
	new RequestHandlerTest(
		new TestRequest('http://example.com/api/script', {
			headers: { 'Accept': JS }
		}),
		[RequestHandlerTest.shouldBeOk, RequestHandlerTest.shouldHaveContentType(JS)]
	)
);

if (error instanceof Error) {
	throw error;
}
