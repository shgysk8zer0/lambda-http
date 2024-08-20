import { RequestHandlerTest } from '../RequestHandlerTest.js';
import { SVG } from '@shgysk8zer0/consts/mimes.js';

const { error } = await RequestHandlerTest.runTests(
	new RequestHandlerTest(
		new Request('http://example.com/api/svg', {
			headers: {
				'Sec-Fetch-Mode': 'no-cors',
				'Sec-Fetch-Dest': 'image',
			}
		}),
		[RequestHandlerTest.shouldBeOk, RequestHandlerTest.shouldHaveContentType(SVG)]
	)
);

if (error instanceof Error) {
	throw error;
}
