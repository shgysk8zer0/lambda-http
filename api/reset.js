import { createHandler } from '../handler.js';
import { NO_CONTENT } from '@shgysk8zer0/consts/status.js';

export default createHandler({
	async get() {
		return new Response(null, {
			status: NO_CONTENT,
			headers: {
				'Clear-Site-Data': '"*"',
				'Cache-Control': 'private, no-store',
			},
		});
	}
}, {
	requireSameOrigin: true,
});
