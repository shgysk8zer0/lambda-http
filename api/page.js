import { createHandler } from '../handler.js';
import { DocumentTemplate } from '../document.js';
import { Cookie } from '../cookies.js';

export default createHandler({
	async get(req) {
		const headers = new Headers();
		const now = new Date();
		const nonce = crypto.randomUUID();
		const url = URL.parse('./', req.url);

		const theme = new Cookie({
			name: 'theme',
			value: req.cookies.get('theme') ?? 'dark',
			expires: Date.now() + 3_600_000,
			path: url,
			domain: url,
			sameSite: 'lax',
			httpOnly: true,
			secure: true,
		});

		const uid = new Cookie({
			name: 'uid',
			value: req.cookies.get('uid') ?? crypto.randomUUID(),
			expires: Date.now() + 3_600_000,
			path: url,
			domain: url,
			sameSite: 'lax',
			httpOnly: true,
			secure: true,
		});

		headers.append('Set-Cookie', theme);
		headers.append('Set-Cookie', uid);
		headers.set('Content-Security-Policy', `default-src 'none'; script-src 'self' https://unpkg.com/@shgysk8zer0/ 'nonce-${nonce}'; img-src 'self'; connect-src 'self'; frame-src 'self';`);
		headers.append('Link', `<${new URL('./script', req.url)}>; rel="preload"; as="script"; referrerpolicy="no-referrer"`);
		headers.append('Link', `<${new URL('./polyfills', req.url)}>; rel="preload"; crossorigin="anonymous"; as="script"; referrerpolicy="no-referrer"`);
		headers.append('Link', `<${new URL('./svg', req.url)}>; rel="preload"; as="image"; referrerpolicy="no-referrer"`);

		const request = JSON.stringify({
			url: req.url,
			mode: req.mode,
			method: req.method,
			referrer: req.referrer,
			referrerPolicy: req.referrerPolicy,
			destination: req.destination,
			credentials: req.credentials,
			headers: Object.fromEntries(req.headers),
		}, null, 4);

		const doc = await DocumentTemplate.load('./index.html');

		return doc.setUnsafe('request', request)
			.setAllSafe({
				title: 'Test Page',
				message: '<span onclick="alert(1)">Hello, World!</span>',
				base: new URL('./', req.url),
				timestamp: now.toISOString(),
				date: now.toLocaleString(),
				nonce,
				theme: decodeURIComponent(req.cookies.get('theme') ?? 'light dark'),
			})
			.setSafe('json', JSON.stringify(doc, null, 4)).response({ headers });
	}
}, {
	logger: err => console.error(err),
});
