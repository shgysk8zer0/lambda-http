
import { JSON as JSON_MIME } from '@shgysk8zer0/consts/mimes.js';
import { CONTENT_LENGTH, CONTENT_TYPE, AUTH, REFERRER, DESTINATIONS } from './consts.js';

export class TestRequest extends Request {
	#destination = '';

	constructor(url, { token, destination = '', searchParams, signal = AbortSignal.timeout(1000), ...config } = {}) {
		const reqURL = new URL(url);
		reqURL.search = new URLSearchParams(searchParams);


		super(reqURL, { signal, ...config });

		if (! DESTINATIONS.includes(destination)) {
			throw new TypeError(`Invalid destination: ${destination}.`);
		} else {
			this.#destination = destination;
			this.headers.set('Sec-Fetch-Dest', destination.length === 0 ? 'empty' : destination);
		}

		if (! this.headers.has(CONTENT_LENGTH) && this.body instanceof ReadableStream) {
			if (typeof config.body === 'string') {
				this.headers.set(CONTENT_LENGTH, config.body.length);
			} else if (config.body instanceof Blob) {
				this.headers.set(CONTENT_LENGTH, config.body.size);
			} else if (config.body instanceof ArrayBuffer) {
				this.headers.set(CONTENT_LENGTH, new Uint8Array(config.body).byteLength);
			} else if (config.body instanceof FormData) {
				const boundary = this.headers.get(CONTENT_TYPE).substring(30);
				const entries = [...config.body.entries()];
				const boundaryLength = boundary.length + 2;

				let length = boundaryLength * (entries.length + 1) + 2;

				for (const [key, val] of entries) {
					length += `Content-Disposition: form-data; name="${key}"`.length + 4;

					if (typeof val === 'string') {
						length += val.length + 4;
					} else if(val instanceof File) {
						length += ` ; filename="${val.name}" Content-Type: ${val.type}`.length + val.size + 4;
					} else {
						throw new TypeError('FormData may only contain strings and files.');
					}
				}

				this.headers.set(CONTENT_LENGTH, length);
			} else if (config.body instanceof URLSearchParams) {
				this.headers.set(CONTENT_LENGTH, config.body.toString().length);
			} else if (config.body instanceof Uint8Array) {
				this.headers.set(CONTENT_LENGTH, config.body.byteLength);
			}
		}

		if (typeof token === 'string') {
			this.headers.set(AUTH, `Bearer ${token}`);
		}

		if (! this.headers.has('Sec-Fetch-Mode')) {
			this.headers.set('Sec-Fetch-Mode', this.mode);
		}

		if (! this.headers.has(REFERRER)) {
			this.headers.set(REFERRER, this.referrer);
		}
	}

	get [Symbol.toStringTag]() {
		return 'TestRequest';
	}

	get destination() {
		return this.#destination;
	}

	static json(data, url, { method = 'POST', headers = new Headers(), ...config } = {}) {
		const body = new Blob([JSON.stringify(data)], { type: JSON_MIME });

		if (! (headers instanceof Headers)) {
			headers = new Headers(headers);
		}

		if (! headers.has(CONTENT_LENGTH)) {
			headers.set(CONTENT_LENGTH, body.size);
		}

		if (! headers.has(CONTENT_TYPE)) {
			headers.set(CONTENT_TYPE, body.type);
		}

		return new TestRequest(url, { method, headers, ...config, body });
	}
}
