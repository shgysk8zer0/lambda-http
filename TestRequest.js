
const DESTINATIONS = [
	'', 'audio', 'audioworklet', 'document', 'embed', 'fencedframe', 'font', 'frame', 'iframe', 'image',
	'json', 'manifest', 'object', 'paintworklet', 'report', 'script', 'sharedworker', 'style', 'track',
	'video', 'worker', 'xslt',
];

export class TestRequest extends Request {
	#destination = '';

	constructor(url, { token, destination = '', searchParams, ...config } = {}) {
		const reqURL = new URL(url);
		reqURL.search = new URLSearchParams(searchParams);

		super(reqURL, config);

		if (! DESTINATIONS.includes(destination)) {
			throw new TypeError(`Invalid destination: ${destination}.`);
		} else {
			this.#destination = destination;
			this.headers.set('Sec-Fetch-Dest', destination.length === 0 ? 'empty' : destination);
		}

		if (! this.headers.has('Content-Length') && this.body instanceof ReadableStream) {
			if (typeof config.body === 'string') {
				this.headers.set('Content-Length', config.body.length);
			} else if (config.body instanceof Blob) {
				this.headers.set('Content-Length', config.body.size);
			} else if (config.body instanceof ArrayBuffer) {
				this.headers.set('Content-Length', new Uint8Array(config.body).byteLength);
			} else if (config.body instanceof FormData) {
				let length = 0;

				for (const [key, val] of config.body.entries()) {
					length += key.length;

					if (typeof val === 'string') {
						length += val.length;
					} else if (val instanceof Blob) {
						length += val.size;
					}

					this.headers.set('Content-Length', length);
				}
			} else if (config.body instanceof Uint8Array) {
				this.headers.set('Content-Length', config.body.byteLength);
			}
		}

		if (typeof token === 'string') {
			this.headers.set('Authorization', `Bearer ${token}`);
		}
		if (! this.headers.has('Sec-Fetch-Mode')) {
			this.headers.set('Sec-Fetch-Mode', this.mode);
		}

		if (! this.headers.has('Referer')) {
			this.headers.set('Referer', this.referrer);
		}
	}

	get [Symbol.toStringTag]() {
		return 'TestRequest';
	}

	get destination() {
		return this.#destination;
	}

	static json(data, url, { method = 'POST', headers = new Headers(), ...config } = {}) {
		config.body = JSON.stringify(data);

		if (! (headers instanceof Headers)) {
			headers = new Headers(headers);
		}

		if (! headers.has('Content-Type')) {
			headers.set('Content-Type', 'application/json');
		}

		if (! headers.has('Content-Length')) {
			headers.set('Content-Length', config.body.length);
		}

		return new TestRequest(url, { method, headers, ...config });
	}
}
