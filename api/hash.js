import { createHandler } from '../handler.js';

export default createHandler({
	async post(req) {
		const bytes = await req.bytes();
		const hash = new Uint8Array(await crypto.subtle.digest('SHA-512', bytes));

		return new Response(hash.toHex());
	}
});
