import { createHandler } from '../handler.js';

export default createHandler({
	async get(req) {
		return Response.redirect(new URL('./echo', req.url));
	}
}, {
	allowOrigins: ['http://localhost:9999', 'http://localhost:8888'],
	logger: console.error
});
