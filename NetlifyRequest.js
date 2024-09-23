import '@shgysk8zer0/polyfills';
import { FORM_MULTIPART, FORM_URL_ENCODED, JSON as JSON_MIME, JSON_LD, TEXT } from '@shgysk8zer0/consts/mimes.js';
const JSON_ALT = 'text/json'; // Alternate JSON Mime-Type

/**
 * @param {Request} req
 * @returns {Map<string, string|null>}
 */
function getRequestCookies(req) {
	if (req.headers.has('Cookie')) {
		const entries = req.headers.get('Cookie').split(';')
			.map(cookie => {
				const [name, value = null] = cookie.trim().split('=');

				if (typeof value === 'string') {
					return [decodeURIComponent(name.trim()), decodeURIComponent(value.trim())];
				} else {
					return [decodeURIComponent(name.trim(), null)];
				}
			});

		return new Map(entries);
	} else {
		return new Map();
	}
}

export class NetlifyRequest extends Request {
	#accept;
	#acceptsAll;
	#contentType = '';
	#cookies;
	#context;
	#contentLength;
	#destination;
	#mode;
	#referrer;
	#referrerPolicy;
	#url;

	constructor(req, context) {
		if (! (req instanceof Request)) {
			throw new TypeError('Cannot create from a non-Request object.');
		} else if (req.bodyUsed) {
			throw new TypeError('Requst body has already been used and is unreadable.');
		} else {
			const url = new URL(req.url);

			if (URL.canParse(context?.site?.url)) {
				url.host = new URL(context.site.url).host;
			} else if (URL.canParse(req.headers.has('Host'))) {
				url.host = new URL(req.headers.get('Host')).host;
			}

			super(url, {
				headers: req.headers,
				method: req.method,
				body: req.body instanceof ReadableStream ? req.body : null,
				signal: req.signal,
				credentials: (req.headers.has('Cookie') || req.headers.has('Authorization')) ? 'include' : 'omit',
				duplex: req.body instanceof ReadableStream ? 'half' : undefined, // Required in node for anything with a body
			});

			this.#url = url;
			this.#context = context;

			this.#accept = this.headers.has('Accept')
				? this.headers.get('Accept').split(',').map(type => type.split(';')[0].trim().toLowerCase())
				: [];

			this.#acceptsAll = this.#accept.length === 0 || this.#accept.includes('*/*');

			if (this.headers.has('Content-Type')) {
				this.#contentType = this.headers.get('Content-Type').split(';')[0].trim().toLowerCase();
			}

			this.#contentLength = this.headers.has('Content-Length') ? parseInt(this.headers.get('Content-Length')) : NaN;
			this.#cookies = getRequestCookies(this);

			// The following are not set correctly by requests and some are invalid in constructor, so default to header values
			this.#destination = this.headers.get('Sec-Fetch-Dest') ?? req.destination;
			this.#mode = this.headers.get('Sec-Fetch-Mode') ?? req.mode;
			this.#referrer = this.headers.get('Referer') ?? req.referrer;
			this.#referrerPolicy = this.headers.get('Referrer-Policy') ?? super.referrerPolicy;
		}
	}

	get [Symbol.toStringTag]() {
		return 'NetlifyRequest';
	}

	get accept() {
		return this.#accept;
	}

	get cookies() {
		return this.#cookies;
	}

	get contentLength() {
		return this.#contentLength;
	}

	get contentType() {
		return this.#contentType;
	}

	get context() {
		return this.#context ?? {};
	}

	get destination() {
		return this.#destination;
	}

	get geo() {
		return this.#context?.geo ?? {};
	}

	get domian() {
		return this.#url.domian;
	}

	get hash() {
		return this.#url.hash;
	}

	get host() {
		return this.#url.host;
	}

	get hostname() {
		return this.#url.hostname;
	}

	get origin() {
		return this.#url.origin;
	}

	get password() {
		return this.#url.password;
	}

	get pathname() {
		return this.#url.pathname;
	}

	get port() {
		return this.#url.port;
	}

	get protocol() {
		return this.#url.protocol;
	}

	get search() {
		return this.#url.search;
	}

	get searchParams() {
		return this.#url.searchParams;
	}

	get username() {
		return this.#url.username;
	}

	get ipAddress() {
		return this.#context?.ip ?? '::1';
	}

	get isFormData() {
		return [FORM_MULTIPART, FORM_URL_ENCODED].includes(this.#contentType);
	}

	get isCors() {
		return this.#mode === 'cors' && this.headers.has('Origin');
	}

	get isSameOrigin() {
		const origin = this.#url.origin;

		if (this.headers.has('Sec-Fetch-Site') && this.headers.get('Sec-Fetch-Site') !== 'same-origin') {
			return false;
		} else if (origin === null && this.#url.protocol === 'file:' && this.referrer.startsWith('file:///')) {
			// Treat being imported from filesystem as same origin based on same protocol
			return true;
		} else if (this.headers.has('Origin') && URL.parse(this.headers.get('Origin'))?.origin === origin) {
			return true;
		} else if (this.#referrer === 'client' || this.#referrer === 'about:client') {
			return false;
		} else if (URL.canParse(this.#referrer)) {
			return new URL(this.#referrer).origin === this.#url.origin;
		} else {
			return false;
		}
	}

	get isJSON() {
		return [JSON_MIME, JSON_ALT, JSON_LD].includes(this.#contentType) || this.#contentType.endsWith('+json');
	}

	get isText() {
		return this.#contentType === TEXT;
	}

	get mode() {
		return this.#mode;
	}

	get referrer() {
		return this.#referrer;
	}

	get referrerPolicy() {
		return this.#referrerPolicy;
	}

	get requestId() {
		return this.#context?.requestId ?? '0';
	}

	get url() {
		return this.#url.href;
	}

	accepts(type) {
		if (this.#acceptsAll) {
			return true;
		} else if (typeof type === 'string') {
			return this.#accept.includes(type);
		} else if (type instanceof RegExp) {
			return this.#accept.some(mime => type.test(mime));
		} else if (Array.isArray(type)) {
			return type.some(t => this.#accept.includes(t));
		} else {
			return false;
		}
	}

	clone() {
		return new NetlifyRequest(super.clone(), this.#context);
	}

	async data() {
		switch (this.#contentType) {
			case '':
				return null;

			case JSON_MIME:
			case JSON_ALT:
			case JSON_LD:
				return await this.json();

			case FORM_MULTIPART:
			case FORM_URL_ENCODED:
				return await this.formData();

			case TEXT:
				return await this.text();

			default:
				return this.#contentType.endsWith('+json') ? await this.json() : await this.blob();
		}
	}

	deleteCookie(...args) {
		return this.#cookies.delete(...args);
	}

	getCookie(...args) {
		return this.#cookies.get(...args);
	}

	setCookie(...args) {
		return this.#cookies.set(...args);
	}

	redirect(url, status) {
		return Response.redirect(url, status);
	}
}
