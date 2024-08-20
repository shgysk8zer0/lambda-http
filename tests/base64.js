import { RequestHandlerTest } from '../RequestHandlerTest.js';

const expected = 'data:text/plain;base64,SGVsbG8sIFdvcmxkIQ==';
const text = 'Hello, World!';

const { error } = await RequestHandlerTest.runTests(
	new RequestHandlerTest(
		new Request('http://example.com/api/base64', {
			method: 'POST',
			headers: { Accept: 'text/plain' },
			body: new File([text], 'hi.txt', { type: 'text/plain' })
		}), [
			RequestHandlerTest.shouldHaveContentType('text/plain'),
			async (resp, req) => {
				const result = await resp.text();

				if (result !== expected) {
					throw new Error(`${req.method } <${req.url}> expected body text of "${expected}" but got "${result}.`);
				}
			}
		]
	)
);

if (error instanceof Error) {
	throw error;
}
