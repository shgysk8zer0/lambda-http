import { RequestHandlerTest } from '../RequestHandlerTest.js';
import { NO_CONTENT } from '@shgysk8zer0/consts/status.js';

const origin = 'http://localhost:8888';

const { error } = await RequestHandlerTest.runTests(
	new RequestHandlerTest(
		new Request(new URL('/api/reset', origin), { headers: { Referer: origin }}),
		[
			RequestHandlerTest.shouldHaveStatus(NO_CONTENT),
			RequestHandlerTest.shouldRequireSameOrigin,
			RequestHandlerTest.shouldNotHaveHeader('Content-Type'),
			RequestHandlerTest.shouldHaveHeader('Clear-Site-Data'),
		]
	)
);

if (error) {
	throw error;
}
