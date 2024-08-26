import { createHandler } from '@shgysk8zer0/lambda-http/handler.js';
import { HTTPError } from '@shgysk8zer0/lambda-http/error.js';
import { NOT_ACCEPTABLE } from '@shgysk8zer0/consts/status.js';

export default createHandler({
	async get(req) {
		if (! req.accepts('application/json')) {
			throw new HTTPError(`Does not support: ${req.accept.join(', ')}`, NOT_ACCEPTABLE);
		} else {
			return Response.error();
		}
	}
}, {
	allowOrigins: ['http://localhost:9999', 'http://localhost:8888'],
	// allowHeaders: ['X-Foo'],
	exposeHeaders: ['X-Foo'],
	allowCredentials: true,
	// logger: console.error,
	// logger(err) {
	// 	if (! (err instanceof HTTPError)) {
	// 		console.error(err);
	// 	}
	// },
});
