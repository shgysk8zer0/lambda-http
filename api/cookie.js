import { createHandler } from '../handler.js';

export default createHandler({
	async get(req) {
		return Response.json(Object.fromEntries(req.cookies));
	}
}, {
	requiredCookies: ['foo'],
});
