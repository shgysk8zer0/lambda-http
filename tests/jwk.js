import { RequestHandlerTest } from '../RequestHandlerTest.js';
import { TestRequest } from '../TestRequest.js';
import { importJWK } from '@shgysk8zer0/jwk-utils/jwk.js';
import { MIME_TYPE } from '@shgysk8zer0/jwk-utils/consts.js';

const { error } = await RequestHandlerTest.runTests(
	new RequestHandlerTest(
		new TestRequest('http://localhost:9999/api/jwk'),
		[RequestHandlerTest.shouldBeOk, RequestHandlerTest.shouldHaveContentType(MIME_TYPE), async resp => {
			const data = await resp.json();
			const key = await importJWK(data);

			if (! (key instanceof CryptoKey)) {
				throw new TypeError('Key should be a CryptoKey.');
			} else if (key.type !== 'public') {
				throw new TypeError(`Key should be a public key, but got ${key.type}.`);
			}
		}]
	)
);

if (error) {
	console.error(error);
}
