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
	allowOrigins: ['http://localhost:9999', 'http://localhost:8080'],
	allowHeaders: ['X-Foo'],
	exposeHeaders: ['X-Foo'],
	allowCredentials: true,
	logger(err) {
		if (! (err instanceof HTTPError)) {
			console.error(err);
		}
	},
});
