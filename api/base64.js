import { createHandler } from '../handler.js';

async function base64Encode(req) {
	const blob = await req.blob();
	const bytes = await blob.bytes();

	return new Response(`data:${blob.type || 'text/plain'};base64,${bytes.toBase64()}`, {
		headers: { 'Content-Type': 'text/plain' }
	});
}

export default createHandler({
	put: base64Encode,
	post: base64Encode,
}, { logger: err => console.error(err) });
