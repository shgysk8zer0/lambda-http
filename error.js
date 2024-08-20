import {
	BAD_GATEWAY, BAD_REQUEST, CONFLICT, EXPECTATION_FAILED, FORBIDDEN, GATEWAY_TIMEOUT, GONE, HTTP_VERSION_NOT_SUPPORTED,
	IM_A_TEAPOT, INTERNAL_SERVER_ERROR, LENGTH_REQUIRED, METHOD_NOT_ALLOWED, MISDIRECTED_REQUEST, NOT_ACCEPTABLE,
	NOT_FOUND, NOT_IMPLEMENTED, PAYLOAD_TOO_LARGE, PAYMENT_REQUIRED, PRECONDITION_FAILED, PRECONDITION_REQUIRED,
	PROXY_AUTHENTICATION_REQUIRED, RANGE_NOT_SATISFIABLE, REQUEST_HEADER_FIELDS_TOO_LARGE, REQUEST_TIMEOUT, SERVICE_UNAVAILABLE,
	TOO_MANY_REQUESTS, UNAUTHORIZED, UNAVAILABLE_FOR_LEGAL_REASONS, UNSUPPORTED_MEDIA_TYPE, URI_TOO_LONG, VARIANT_ALSO_NEGOTIATES,
} from '@shgysk8zer0/consts/status.js';

export class HTTPError extends Error {
	#status = INTERNAL_SERVER_ERROR;
	#headers = {};
	#details = null;

	constructor(message, status = INTERNAL_SERVER_ERROR, { cause, headers, details = null } = {}) {
		super(message, { cause, headers, details });
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

export class HTTPClientError extends HTTPError {};
export class HTTPServerError extends HTTPError {};

export class HTTPBadRequestError extends HTTPClientError {
	constructor(message, { cause, headers, details = null } = {}) {
		super(message,BAD_REQUEST, { cause, headers, details });
	}
}

export class HTTPUnauthorizedError extends HTTPClientError {
	constructor(message, { cause, headers, details = null } = {}) {
		super(message, UNAUTHORIZED, { cause, headers, details });
	}
}

export class HTTPPaymentRequiredError extends HTTPClientError {
	constructor(message, { cause, headers, details = null } = {}) {
		super(message, PAYMENT_REQUIRED, { cause, headers, details });
	}
}

export class HTTPForbiddenError extends HTTPClientError {
	constructor(message, { cause, headers, details = null } = {}) {
		super(message, FORBIDDEN, { cause, headers, details });
	}
}

export class HTTPNotFoundError extends HTTPClientError {
	constructor(message, { cause, headers, details = null } = {}) {
		super(message, NOT_FOUND, { cause, headers, details });
	}
}

export class HTTPMethodNotAllowedError extends HTTPClientError {
	constructor(message, { cause, headers, details = null } = {}) {
		super(message, METHOD_NOT_ALLOWED, { cause, headers, details });
	}
}

export class HTTPNotAcceptableError extends HTTPClientError {
	constructor(message, { cause, headers, details = null } = {}) {
		super(message, NOT_ACCEPTABLE, { cause, headers, details });
	}
}

export class HTTPProxyAuthenticationRequiredError extends HTTPClientError {
	constructor(message, { cause, headers, details = null } = {}) {
		super(message, PROXY_AUTHENTICATION_REQUIRED, { cause, headers, details });
	}
}

export class HTTPRequestTimeoutError extends HTTPClientError {
	constructor(message, { cause, headers, details = null } = {}) {
		super(message, REQUEST_TIMEOUT, { cause, headers, details });
	}
}

export class HTTPConflictError extends HTTPClientError {
	constructor(message, { cause, headers, details = null } = {}) {
		super(message, CONFLICT, { cause, headers, details });
	}
}

export class HTTPGoneError extends HTTPClientError {
	constructor(message, { cause, headers, details = null } = {}) {
		super(message, GONE, { cause, headers, details });
	}
}

export class HTTPLengthRequiredError extends HTTPClientError {
	constructor(message, { cause, headers, details = null } = {}) {
		super(message, LENGTH_REQUIRED, { cause, headers, details });
	}
}

export class HTTPPreconditionFailedError extends HTTPClientError {
	constructor(message, { cause, headers, details = null } = {}) {
		super(message, PRECONDITION_FAILED, { cause, headers, details });
	}
}
export class HTTPPayloadTooLargeError extends HTTPClientError {
	constructor(message, { cause, headers, details = null } = {}) {
		super(message, PAYLOAD_TOO_LARGE, { cause, headers, details });
	}
}

export class HTTPURITooLongError extends HTTPClientError {
	constructor(message, { cause, headers, details = null } = {}) {
		super(message, URI_TOO_LONG, { cause, headers, details });
	}
}

export class HTTPUnsupportedMediaTypeError extends HTTPClientError {
	constructor(message, { cause, headers, details = null } = {}) {
		super(message, UNSUPPORTED_MEDIA_TYPE, { cause, headers, details });
	}
}

export class HTTPRangeNotSatisfiableError extends HTTPClientError {
	constructor(message, { cause, headers, details = null } = {}) {
		super(message, RANGE_NOT_SATISFIABLE, { cause, headers, details });
	}
}

export class HTTPExpectationFailedError extends HTTPClientError {
	constructor(message, { cause, headers, details = null } = {}) {
		super(message, EXPECTATION_FAILED, { cause, headers, details });
	}
}

export class HTTPIMATeapotError extends HTTPClientError {
	constructor(message, { cause, headers, details = null } = {}) {
		super(message, IM_A_TEAPOT, { cause, headers, details });
	}
}

export class HTTPMisdirectedRequestError extends HTTPClientError {
	constructor(message, { cause, headers, details = null } = {}) {
		super(message, MISDIRECTED_REQUEST, { cause, headers, details });
	}
}

export class HTTPPreconditionRequiredError extends HTTPClientError {
	constructor(message, { cause, headers, details = null } = {}) {
		super(message, PRECONDITION_REQUIRED, { cause, headers, details });
	}
}

export class HTTPTooManyRequestsError extends HTTPClientError {
	constructor(message, { cause, headers, details = null } = {}) {
		super(message, TOO_MANY_REQUESTS, { cause, headers, details });
	}
}

export class HTTPRequestHeaderFiledsTooLargeError extends HTTPClientError {
	constructor(message, { cause, headers, details = null } = {}) {
		super(message, REQUEST_HEADER_FIELDS_TOO_LARGE, { cause, headers, details });
	}
}

export class HTTPUnavailableForLegalReasonsError extends HTTPClientError {
	constructor(message, { cause, headers, details = null } = {}) {
		super(message, UNAVAILABLE_FOR_LEGAL_REASONS, { cause, headers, details });
	}
}

export class HTTPInternalServerError extends HTTPServerError {
	constructor(message, { cause, headers, details = null } = {}) {
		super(message, INTERNAL_SERVER_ERROR, { cause, headers, details });
	}
}

export class HTTPNotImplementedError extends HTTPServerError {
	constructor(message, { cause, headers, details = null } = {}) {
		super(message, NOT_IMPLEMENTED, { cause, headers, details });
	}
}

export class HTTPBadGatewayError extends HTTPServerError {
	constructor(message, { cause, headers, details = null } = {}) {
		super(message, BAD_GATEWAY, { cause, headers, details });
	}
}

export class HTTPServiceUnavailableError extends HTTPServerError {
	constructor(message, { cause, headers, details = null } = {}) {
		super(message, SERVICE_UNAVAILABLE, { cause, headers, details });
	}
}

export class HTTPGatewayTimeoutError extends HTTPServerError {
	constructor(message, { cause, headers, details = null } = {}) {
		super(message, GATEWAY_TIMEOUT, { cause, headers, details });
	}
}

export class HTTPVersionNotSupportedError extends HTTPServerError {
	constructor(message, { cause, headers, details = null } = {}) {
		super(message, HTTP_VERSION_NOT_SUPPORTED, { cause, headers, details });
	}
}

export class HTTPVariantAlsoNegotiatesError extends HTTPServerError {
	constructor(message, { cause, headers, details = null } = {}) {
		super(message, VARIANT_ALSO_NEGOTIATES, { cause, headers, details });
	}
}
