import { RequestHandlerTest } from '../RequestHandlerTest.js';

const { error } = await RequestHandlerTest.runTests(
	new RequestHandlerTest(
		new Request('http://example.com/api/page', {
			headers: {
				'Sec-Fetch-Mode': 'no-cors',
				'Sec-Fetch-Dest': 'navigate',
			}
		}),
		[RequestHandlerTest.shouldBeOk, RequestHandlerTest.shouldBeHTML]
	)
);

if (error instanceof Error) {
	throw error;
}
