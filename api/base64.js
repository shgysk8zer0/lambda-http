import { createHandler } from '../handler.js';
import { HTTPError } from '../error.js';
import { BAD_REQUEST } from '../status.js';

async function base64Encode(blob) {
	const bytes = await blob.bytes();

	return new Response(`data:${blob.type || 'text/plain'};base64,${bytes.toBase64()}`, {
		headers: { 'Content-Type': 'text/plain' }
	});
}

export default createHandler({
	put: base64Encode,
	async post(req) {
		if (req.isFormData) {
			const data = await req.formData();

			if (data.has('file')) {
				const file = data.get('file');

				if (! (file instanceof File)) {
					throw new HTTPError('Form field "file" must be a File object.', BAD_REQUEST);
				} else {
					return await base64Encode(file);
				}
			} else {
				throw new HTTPError('Missing required form data field: "file".', BAD_REQUEST);
			}
		} else {
			return await base64Encode(await req.blob());
		}
	}
});
