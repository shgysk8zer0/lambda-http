import { RequestHandlerTest } from '../RequestHandlerTest.js';

const { error } = await RequestHandlerTest.runTests(
	new RequestHandlerTest(
		new Request('https://example.com/api/redirect', { redirect: 'manual' }),
		RequestHandlerTest.shouldRedirect
	)
);

if (error) {
	throw error;
}
