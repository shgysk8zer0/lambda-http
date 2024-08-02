import { RequestHandlerTest } from '../RequestHandlerTest.js';
import { METHOD_NOT_ALLOWED } from '../status.js';
import handler from '../api/error.js';

const url = 'http://localhost:8888/api/error';
const headers = new Headers({ Accept: 'application/json', Origin: 'http://localhost:9999' });

const { error } = await RequestHandlerTest.runTests(
	new RequestHandlerTest(
		new Request(url, { headers }),
		handler,
		async (resp) => {
			if (resp.status < 500) {
				throw new Error('Response should return an error status.');
			}
		}
	),
	new RequestHandlerTest(
		new Request(url, { method: 'DELETE', headers }),
		handler,
		resp => {
			if (resp.status !== METHOD_NOT_ALLOWED) {
				throw new Error('Endpoint should report not supporting the DELETE method.');
			}
		}
	),
	new RequestHandlerTest(
		new Request(url, {
			method: 'OPTIONS',
			headers: new Headers({ 'Access-Control-Request-Method': 'GET', Origin: 'http://localhost:9999' }),
		}),
		handler,
		resp => {
			if (! resp.ok) {
				throw new Error('Response should not be an error status.');
			} else if (!resp.headers.has('Access-Control-Allow-Methods')) {
				throw new Error('Missing "Access-Control-Allow-Methods" header.');
			}
		}
	)
);

if (error instanceof Error) {
	throw error;
}
