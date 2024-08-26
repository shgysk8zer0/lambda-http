import { RequestHandlerTest } from '../RequestHandlerTest.js';
import { TestRequest } from '../TestRequest.js';
const msg = 'Hello, World!';
const expected = '374d794a95cdcfd8b35993185fef9ba368f160d8daf432d08ba9f1ed1e5abe6cc69291e0fa2fe0006a52570ef18c19def4e617c33ce52ef0a6e5fbe318cb0387';

const { error } = await RequestHandlerTest.runTests(
	new RequestHandlerTest(
		new TestRequest('https://localhost:8888/api/hash', {
			method: 'POST',
			body: msg,
		}),
		[RequestHandlerTest.shouldBeOk, async resp => {
			if (! await resp.clone().text() === expected) {
				throw new Error('SHA-512 mismatch');
			}
		}]
	)
);

if (error) {
	throw error;
}
