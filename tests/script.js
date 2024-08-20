import { RequestHandlerTest } from '../RequestHandlerTest.js';
import { JS } from '@shgysk8zer0/consts/mimes.js';

const { error } = await RequestHandlerTest.runTests(
	new RequestHandlerTest(
		new Request('http://example.com/api/script', {
			headers: {
				'Accept': JS,
				'Sec-Fetch-Mode': 'no-cors',
				'Sec-Fetch-Dest': 'script',
			}
		}),
		[RequestHandlerTest.shouldBeOk, RequestHandlerTest.shouldHaveContentType(JS)]
	)
);

if (error instanceof Error) {
	throw error;
}
