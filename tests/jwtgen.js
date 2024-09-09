import { RequestHandlerTest } from '../RequestHandlerTest.js';
import { TestRequest } from '../TestRequest.js';
import { verifyJWT } from '@shgysk8zer0/jwk-utils/jwt.js';
import { PUBLIC_KEY } from '../keys.js';
import { importJWK } from '@shgysk8zer0/jwk-utils/jwk.js';

const { error } = await RequestHandlerTest.runTests(
	new RequestHandlerTest(
		new TestRequest('http://localhost:9999/api/jwtgen'),
		async resp => {
			const { token } = await resp.json();
			const publicKey = await importJWK(PUBLIC_KEY);
			const decoded = await verifyJWT(token, publicKey);

			if (decoded instanceof Error) {
				throw decoded;
			}
		}
	)
);

if (error) {
	throw error;
}
