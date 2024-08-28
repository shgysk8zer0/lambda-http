import { createHandler } from '@shgysk8zer0/lambda-http/handler.js';
import { HTTPNotAcceptableError } from '../error.js';

export default createHandler({
	async get(req) {
		if (! req.accepts('application/json')) {
			throw new HTTPNotAcceptableError(`Does not support: ${req.accept.join(', ')}`);
		} else {
			return Response.error();
		}
	}
}, {
	allowOrigins: ['http://localhost:9999', 'http://localhost:8888'],
});
