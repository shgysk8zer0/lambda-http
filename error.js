import { INTERNAL_SERVER_ERROR } from './status.js';

export class HTTPError extends Error {
	#status = INTERNAL_SERVER_ERROR;
	#headers = {};
	#details = null;

	constructor(message, status = INTERNAL_SERVER_ERROR, { cause, headers, details = null } = {}) {
		super(message, { cause });
		this.#status = typeof status === 'number' && status > 0 && status < 600 ? status : INTERNAL_SERVER_ERROR;
		this.#details = details;

		if (typeof headers === 'object' && headers !== null) {
			this.#headers = headers instanceof Headers ? Object.fromEntries(headers) : headers;
		}
	}

	get details() {
		return this.#details;
	}

	get headers() {
		return this.#headers;
	}

	get status() {
		return this.#status;
	}

	get response() {
		return Response.json(this, { status: this.#status, headers: new Headers(this.#headers) });
	}

	toJSON() {
		return {
			error: {
				message: this.message,
				status: this.#status,
				details: this.#details,
			}
		};
	}
}
