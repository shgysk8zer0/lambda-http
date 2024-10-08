import { RequestHandlerTest } from '../RequestHandlerTest.js';

const { error } = await RequestHandlerTest.runTests(
	new RequestHandlerTest(
		new Request('https://example.com/api/redirect', {
			redirect: 'manual',
			headers: { Origin: 'http://localhost:9999' },
		}),
		RequestHandlerTest.shouldRedirectTo(new URLPattern({ pathname: '/api/echo' }))
	)
);

if (error) {
	throw error;
}
