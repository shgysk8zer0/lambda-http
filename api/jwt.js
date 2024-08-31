import { AUTH } from '../consts.js';
import { createHandler } from '../handler.js';
import { verifyJWT } from '@shgysk8zer0/jwk-utils/jwt.js';
import { PUBLIC_KEY } from '../keys.js';
import { importJWK } from '@shgysk8zer0/jwk-utils/jwk.js';

export default createHandler({
	async post(req) {
		try {
			const key = await importJWK(PUBLIC_KEY);
			const result = await verifyJWT(req.headers.get(AUTH).substring(7), key);
			return Response.json({token: req.headers.get(AUTH).substring(7), result});
		} catch(err) {
			console.error(err);
			return Response.error();
		}
	}
}, {
	requireJWT: true,
	allowCredentials: true,
});
