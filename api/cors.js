import { createHandler } from '../handler.js';

export default createHandler({
	async post(req) {
		return Response.json({
			origin: req.headers.get('Origin'),
			mode: req.mode,
			destination: req.destination,
			headers: Object.fromEntries(req.headers),
			pattern: 'URLPattern' in globalThis,
		});
	}
}, {
	allowCredentials: true,
	allowHeaders: ['Authorization'],
	allowOrigins: ['*'],
});
