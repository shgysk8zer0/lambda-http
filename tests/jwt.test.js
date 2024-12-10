import { RequestHandlerTest } from '../RequestHandlerTest.js';
import { TestRequest } from '../TestRequest.js';
import { UNAUTHORIZED } from '@shgysk8zer0/consts/status.js';
import { PRIVATE_KEY } from '../keys.js';
import { importJWK } from '@shgysk8zer0/jwk-utils/jwk.js';
import { createJWT } from '@shgysk8zer0/jwk-utils/jwt.js';

const privateKey = await importJWK(PRIVATE_KEY);
const sub = 'https://example.com';
const iss = 'http://localhost:8888';
const iat = Math.floor(Date.now() / 1000);
const exp = iat + 60;
// const publicKey = await importJWK(PUBLIC_KEY);
const token = await createJWT({ sub, iss, iat, exp }, privateKey);
const url = new URL('/api/jwt.js', iss);


const { error } = await RequestHandlerTest.runTests(
	new RequestHandlerTest(
		new TestRequest(url, {
			headers: { origin: sub, 'Content-Type': 'application/json' },
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
		[RequestHandlerTest.shouldHaveStatus(UNAUTHORIZED), RequestHandlerTest.shouldRequireJWT]
	)
);

if (error) {
	throw error;
}
