import { RequestHandlerTest } from '../RequestHandlerTest.js';

const { error } = await RequestHandlerTest.runTests(
	new RequestHandlerTest(
		new Request('https://example.com/api/polyfills', { redirect: 'manual' }),
		[
			RequestHandlerTest.shouldRedirect,
			RequestHandlerTest.shouldRedirectTo('https://unpkg.com/@shgysk8zer0/polyfills')
		]
	)
);

if (error) {
	throw error;
}
