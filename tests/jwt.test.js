import { RequestHandlerTest } from '../RequestHandlerTest.js';
import { TestRequest } from '../TestRequest.js';
import { UNAUTHORIZED } from '@shgysk8zer0/consts/status.js';
import { createOriginAuthToken } from '@shgysk8zer0/jwk-utils/origin-tokens.js';
import { PRIVATE_KEY } from '../keys.js';
import { importJWK } from '@shgysk8zer0/jwk-utils/jwk.js';

const privateKey = await importJWK(PRIVATE_KEY);
const token = await createOriginAuthToken('https://example.com' , privateKey);
const url = new URL('http://localhost:8888/api/jwt.js');

const { error } = await RequestHandlerTest.runTests(
	new RequestHandlerTest(
		new TestRequest(url, {
			headers: { origin: 'https://example.com', 'Content-Type': 'application/json' },
			method: 'POST',
			token,
			searchParams: { test: 'authorized' },
		}),
		[RequestHandlerTest.shouldBeOk, RequestHandlerTest.shouldRequireJWT, RequestHandlerTest.shouldBeJSONObject]
	),
	new RequestHandlerTest(
		new TestRequest(url, {
			searchParams: { test: 'no-token' },
			headers: { origin: 'https://example.com', 'Content-Type': 'application/json' },
			method: 'POST',
		}),
		[RequestHandlerTest.shouldHaveStatus(UNAUTHORIZED), RequestHandlerTest.shouldRequireJWT,]
	)
);

if (error) {
	throw error;
}
