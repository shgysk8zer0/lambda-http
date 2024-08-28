import { createHandler } from '../handler.js';

export default createHandler({
	async post(req) {
		return Response.json({
			origin: req.headers.get('Origin'),
			mode: req.mode,
			destination: req.destination,
			headers: Object.fromEntries(req.headers),
		});
	}
}, {
	allowCredentials: true,
	allowHeaders: ['Authorization'],
	allowOrigins: new URLPattern({ hostname: 'localhost', port: ':port(8888|9999)' }),
});
