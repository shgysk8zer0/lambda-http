import { createHandler } from '../handler.js';
import { JSON as JSON_MIME, JS } from '@shgysk8zer0/consts/mimes.js';

export default createHandler({
	async get(req) {
		const headers = new Headers({ 'Content-Type': JS });
		const reqData = {
			url: req.url,
			method: req.method,
			mode: req.mode,
			destination: req.destination,
			referrer: req.referrer,
			credentials: req.credentials,
			headers: Object.fromEntries(req.headers),
			geo: req.geo,
			requestId: req.requestId,
			ipAddress: req.ipAddress,
			uid: req.cookies.get('uid'),
		};

		const js = `fetch('./echo', {
			method: 'POST',
			mode: 'no-cors',
			credentials: 'include',
			referrerPolicy: 'origin',
			headers: new Headers({
				'Content-Type': '${JSON_MIME}',
				'X-Foo': 'Bar',
				Accept: '${JSON_MIME}',
			}),
			body: '${JSON.stringify(reqData)}',
		}).then(async resp => ({ headers: Object.fromEntries(resp.headers), body: resp.json()})).then(console.log).catch(console.error);`;

		return new Response([js], { headers });
	}
});
