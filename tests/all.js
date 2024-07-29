import '../polyfills.js';
import echo from '../api/echo.js';
import error from '../api/error.js';

const headers = new Headers({
	Accept: 'application/json',
	Origin: 'http://localhost:8080',
});

await Promise.all([
	echo(new Request('http://localhost:9999/api/echo', {
		headers,
		method: 'GET',
	})),
	error(new Request('http://localhost:9999/api/error', {
		headers,
		method: 'GET',
	})),
]).then(([echo, error]) => {
	return [echo, error].every(resp => {
		return resp instanceof Response
			&& resp.headers.get('Content-Type').startsWith('application/json')
			&& resp.headers.has('Access-Control-Allow-Origin')
			&& resp.headers.has('Access-Control-Allow-Credentials');
	}) && echo.ok && (! error.ok);
}).then(result => {
	if (! result) {
		throw new Error('Error processing requests.');
	}
});
