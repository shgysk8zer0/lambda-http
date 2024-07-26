import { INTERNAL_SERVER_ERROR } from './status.js';

export class HTTPError extends Error {
	#status = INTERNAL_SERVER_ERROR;
	#headers = {};

	constructor(message, status = INTERNAL_SERVER_ERROR, { cause, headers } = {}) {
		super(message, { cause });
		this.#status = typeof status === 'number' && status > 0 && status < 600 ? status : INTERNAL_SERVER_ERROR;

		if (typeof headers === 'object' && headers !== null) {
			this.#headers = headers instanceof Headers ? Object.fromEntries(headers) : headers;
		}
	}

	get headers() {
		return this.#headers;
	}

	get status() {
		return this.#status;
	}

	toJSON() {
		return {
			error: {
				message: this.message,
				status: this.status,
			}
		};
	}
}
