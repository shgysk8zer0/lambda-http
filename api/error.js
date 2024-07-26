import { createHandler } from '@shgysk8zer0/lambda-http/handler.js';
import { HTTPError } from '@shgysk8zer0/lambda-http/error.js';
import { BAD_GATEWAY } from '@shgysk8zer0/lambda-http/status.js';

export default createHandler({
	get() {
		try {
			throw new Error('Testing');
		} catch(cause) {
			throw new HTTPError('Oops. Something broke :(', BAD_GATEWAY, { cause });
		}
	}
}, {
	allowOrigins: ['http://localhost:9999'],
	allowHeaders: ['X-Foo'],
	exposeHeaders: ['X-Foo'],
	allowCredentials: true,
	logger(err, req) {
		if (err.cause instanceof Error) {
			console.log(`<${req.url}> - ${err.message} [cause: "${err.cause.message}"]`);
		} else {
			console.log(`<${req.url}> - ${err.message}`);
		}
	}
});
