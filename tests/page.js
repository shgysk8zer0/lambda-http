import { RequestHandlerTest } from '../RequestHandlerTest.js';

const { error } = await RequestHandlerTest.runTests(
	new RequestHandlerTest(
		new Request('http://example.com/api/page'),
		resp => {
			if (! resp.ok) {
				throw new Error('Response should be ok.');
			} else if (resp.headers.get('Content-Type') !== 'text/html') {
				throw new Error('Response should have a Content-Type of text/html.');
			}
		}
	)
);

if (error instanceof Error) {
	throw error;
}
