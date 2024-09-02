import { createHandler } from '../handler.js';
import { PRIVATE_KEY } from '../keys.js';
import { importJWK } from '@shgysk8zer0/jwk-utils/jwk.js';
import { createOriginAuthToken } from '@shgysk8zer0/jwk-utils/origin-tokens.js';

export default createHandler({
	async get(req) {
		const [privateKey] = await Promise.all([importJWK(PRIVATE_KEY)]);

		const token = await createOriginAuthToken(URL.parse(req.url)?.origin, privateKey);

		return Response.json({ token, });
	}
});
