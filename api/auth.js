import { createHandler } from '../handler.js';
import { AUTH } from '../consts.js';

export default createHandler({
	async get(req) {
		const bytes = Uint8Array.fromBase64(req.headers.get(AUTH).substring(6).trim());
		return Response.json(JSON.parse(new TextDecoder().decode(bytes)));
	}
}, {
	allowOrigins: new URLPattern({ hostname: 'localhost', port: ':port(8888|9999)' }),
	requireHeaders: [AUTH],
	allowCredentials: true,
});
