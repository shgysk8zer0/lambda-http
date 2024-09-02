import { createHandler } from '../handler.js';
import { PUBLIC_KEY } from '../keys.js';
import { importJWK, createJWKFile } from '@shgysk8zer0/jwk-utils/jwk.js';

export default createHandler({
	async get() {
		const key = await importJWK(PUBLIC_KEY);
		const file = await createJWKFile(key);
		return new Response(file);
	}
});
