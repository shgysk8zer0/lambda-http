import { SVG } from '@shgysk8zer0/consts/mimes.js';
import { createHandler } from '../handler.js';

export default createHandler({
	async get(req) {
		// Create an SVG template with the text data
		const headers = new Headers({ 'Content-Type': SVG });
		const theme = req.cookies.get('theme') ?? 'light';
		const fill = theme === 'light' ? '#f8f8f8' : '#232323';
		const color = theme === 'light' ? '#333' : '#fafafa';

		const svg = String.dedent`
			<svg xmlns="http://www.w3.org/2000/svg" width="590" height="100">
				<rect width="100%" height="100%" fill="${fill}"/>
				<text x="10" y="20" font-family="monospace" font-size="12" fill="${color}">URL: ${req.url}</text>
				<text x="10" y="32" font-family="monospace" font-size="12" fill="${color}">Method: ${req.method}</text>
				<text x="10" y="44" font-family="monospace" font-size="12" fill="${color}">Referrer: ${req.referrer}</text>
				<text x="10" y="56" font-family="monospace" font-size="12" fill="${color}">Mode: ${req.mode}</text>
				<text x="10" y="68" font-family="monospace" font-size="12" fill="${color}">Dest: ${req.destination}</text>
				<text x="10" y="80" font-family="monospace" font-size="12" fill="${color}">Credentials: ${req.credentials}</text>
				<text x="10" y="92" font-family="monospace" font-size="12" fill="${color}">Accept: ${req.headers.get('Accept')}</text>
			</svg>
		`;

		return new Response(svg, { headers });
	}
}, {
	logger: err => console.error(err),
});
