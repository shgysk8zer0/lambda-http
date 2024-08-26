import { RequestHandlerTest } from '../RequestHandlerTest.js';
import { TestRequest } from '../TestRequest.js';

const { error } = await RequestHandlerTest.runTests(
	new RequestHandlerTest(
		new TestRequest('https://example.com/api/polyfills', { redirect: 'manual' }),
		[
			RequestHandlerTest.shouldRedirect,
			RequestHandlerTest.shouldRedirectTo(new URLPattern('https://unpkg.com/@shgysk8zer0/polyfills@:version/all.min.js'))
		]
	)
);

if (error) {
	throw error;
}
