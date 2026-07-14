/**
 * @typedef {"strict"|"lax"|"none"} SameSiteOption
 */

/**
 * @typedef {object} CookieConfig
 * @property {string} name The name of the cookie.
 * @property {string} [value=""] The value of the cookie.
 * @property {string} [path] The path for the cookie.
 * @property {string} [domain] The domain for the cookie.
 * @property {string|number|Date} [expires] The expiry details.
 * @property {SameSiteOption} [sameSite] The SameSite attribute.
 * @property {boolean} [httpOnly=false] Flags the cookie as HTTP-only.
 * @property {boolean} [secure=false] Flags the cookie as secure.
 * @property {boolean} [partitioned=false] Flags the cookie as partitioned.
 */

export class Cookie {
	#name;
	#value = '';
	#path;
	#domain;
	#expires;
	#sameSite;
	#httpOnly = false;
	#secure = false;
	#partitioned = false;

	/**
	 *
	 * @param {CookieConfig} config
	 */
	constructor({
		name,
		value = '',
		path,
		domain,
		expires,
		sameSite,
		httpOnly = false,
		secure = false,
		partitioned = false,
	}) {
		this.name = name;
		this.value = value;

		if (typeof domain !== 'undefined') {
			this.domain = domain;
		}

		if (typeof expires !== 'undefined') {
			this.expires = expires;
		}

		if (typeof httpOnly !== 'undefined') {
			this.httpOnly = httpOnly;
		}

		if (typeof partitioned !== 'undefined') {
			this.partitioned = partitioned;
		}

		if (typeof path !== 'undefined') {
			this.path = path;
		}

		if (typeof sameSite !== 'undefined') {
			this.sameSite = sameSite;
		}

		if (typeof secure !== 'undefined') {
			this.secure = secure;
		}
	}

	/**
	 * @returns {string}
	 */
	get name() {
		return this.#name;
	}

	/**
	 * @param {string} name
	 */
	set name(val) {
		if (typeof val === 'string') {
			this.#name = val;
		} else {
			throw new TypeError('Cookie name must be a string.');
		}
	}

	/**
	 * @returns {string}
	 */
	get value() {
		return this.#value;
	}

	/**
	 * @param {string} val
	 */
	set value(val) {
		if (typeof val === 'string') {
			this.#value = val;
		} else {
			switch(typeof val) {
				case 'undefined':
					this.#value = '';
					break;

				case 'number':
				case 'bigint':
					if (Number.isNaN(val)) {
						this.#value = '';
					} else {
						this.#value = val.toString();
					}
					break;

				case 'object':
					if (val !== null) {
						this.#value = val.toString();
					} else {
						this.#value = '';
					}
					break;

				case 'boolean':
					this.#value = val ? 'true' : 'false';
					break;

				default:
					this.#value = val.toString();
			}
		}
	}

	/**
	 * @returns {string|undefined}
	 */
	get domain() {
		return this.#domain;
	}

	/**
	 * @param {string|URL} val
	 */
	set domain(val) {
		if (val instanceof URL) {
			this.#domain = val.hostname;
		} else if (typeof val !== 'string' || val.length === 0) {
			throw new TypeError('Cookie domain must be a non-empty string.');
		} else {
			this.#domain = val;
		}
	}

	/**
	 * @returns {number|undefined}
	 */
	get expires() {
		if (this.#expires instanceof Date) {
			return this.#expires.getTime();
		} else {
			return undefined;
		}
	}

	/**
	 * @param {string|number|Date} val
	 */
	set expires(val) {
		switch (typeof val) {
			case 'string':
				this.#expires = new Date(val);
				break;

			case 'number':
				this.#expires = Number.isNaN(val) ? undefined : new Date(val);
				break;

			case 'object':
				if (val === null) {
					this.#expires = undefined;
				} else if (! (val instanceof Date)) {
					throw new TypeError('Invalid expires.');
				} else {
					this.#expires = val;
				}
				break;

			case 'boolean':
				if (val) {
					this.#expires = new Date(0);
				} else {
					this.#expires = undefined;
				}
		}
	}

	/**
	 * @returns {boolean}
	 */
	get httpOnly() {
		return this.#httpOnly;
	}

	/**
	 * @param {boolean} val
	 */
	set httpOnly(val) {
		if (typeof val !== 'boolean') {
			throw new TypeError('Cookie httpOnly must be a boolean.');
		} else {
			this.#httpOnly = val;
		}
	}

	/**
	 * @returns {boolean}
	 */
	get partitioned() {
		return this.#partitioned;
	}

	/**
	 * @param {boolean} val
	 */
	set partitioned(val) {
		if (typeof val !== 'boolean') {
			throw new TypeError('Cookie partitioned must be a boolean.');
		} else {
			this.#partitioned = val;
		}
	}

	/**
	 * @returns {string|undefined}
	 */
	get path() {
		return this.#path;
	}

	/**
	 * @param {string} val
	 */
	set path(val) {
		if (val instanceof URL) {
			this.#path = val.pathname;
		} else if (typeof val === 'string' && val.length !== 0) {
			this.#path = val;
		} else {
			throw new TypeError('Cookie path must be a non-empty string.');
		}
	}

	/**
	 * @returns {SameSiteOption}
	 */
	get sameSite() {
		return this.#sameSite;
	}

	/**
	 * @param {SameSiteOption} val
	 */
	set sameSite(val) {
		if (typeof val !== 'string') {
			throw new TypeError('Cookie SameSite must be a string.');
		} else if (! ['lax', 'strict', 'none'].includes(val)) {
			throw new TypeError('Cookie SameSite must be "none", "lax", or "strict".');
		} else {
			this.#sameSite = val;
		}
	}

	/**
	 * @returns {boolean}
	 */
	get secure() {
		return this.#secure;
	}

	/**
	 * @param {boolean} val
	 */
	set secure(val) {
		if (typeof val !== 'boolean') {
			throw new TypeError('Cookie secure must be a boolean.');
		} else {
			this.#secure = val;
		}
	}

	toString() {
		const parts = [`${this.#name}=${encodeURIComponent(this.#value)}`];

		if (this.#expires instanceof Date) {
			parts.push(`Expires=${this.#expires.toUTCString()}`);
		}

		if (typeof this.#domain === 'string') {
			parts.push(`Domain=${this.#domain}`);
		}

		if (typeof this.#path === 'string') {
			parts.push(`Path=${this.#path}`);
		}

		if (typeof this.#sameSite === 'string') {
			parts.push(`SameSite=${this.#sameSite[0].toUpperCase()}${this.#sameSite.substring(1).toLowerCase()}`);
		}

		if (this.#httpOnly) {
			parts.push('HttpOnly');
		}

		if (this.#secure) {
			parts.push('Secure');
		}

		if (this.#partitioned) {
			parts.push('Partitioned');
		}

		return parts.join('; ');
	}

	toJSON() {
		return this.toString();
	}

	/**
	 *
	 * @param {Headers} headers
	 */
	addToHeaders(headers) {
		if (! (headers instanceof Headers)) {
			throw new TypeError('Expected a Headers object.');
		} else {
			headers.append('Set-Cookie', this.toString());
		}
	}

	/**
	 *
	 * @param {Response} resp
	 */
	addToResponse(resp) {
		if (resp instanceof Response) {
			this.addToHeaders(resp.headers);
		} else {
			throw new TypeError('Not a Response object.');
		}
	}
}

export class CookieStore extends EventTarget {
	/**
	 * @type {Map<string,Cookie>}
	 */
	#map = new Map();

	/**
	 *
	 * @returns {MapIterator<Cookie>}
	 */
	[Symbol.iterator]() {
		return this.values();
	}

	/**
	 *
	 * @returns {MapIterator<string>}
	 */
	keys() {
		return this.#map.keys();
	}

	/**
	 *
	 * @returns {MapIterator<Cookie>}
	 */
	values() {
		return this.#map.values();
	}

	/**
	 *
	 * @returns {MapIterator<[string, Cookie]>}
	 */
	entries() {
		return this.#map.entries();
	}

	/**
	 *
	 * @param {string} name
	 * @returns {boolean}
	 */
	has(name) {
		return typeof name === 'string' ? this.#map.has(name) : this.#map.has(name?.name);
	}

	/**
	 *
	 * @param {string} name
	 * @returns {Cookie|null}
	 */
	get(name) {
		if (typeof name === 'string') {
			return this.#map.get(name) ?? null;
		} else if (typeof name?.name === 'string') {
			return this.#map.get(name.name) ?? null;
		} else {
			return null;
		}
	}

	/**
	 *
	 * @param {string} name
	 * @returns {Cookie[]}
	 * @todo Support multiple values/cookies
	 */
	getAll(name) {
		return this.has(name) ? [this.get(name)] : [];
	}

	/**
	 *
	 * @param {string} name
	 */
	delete(name) {
		if (this.has(name)) {
			this.get(name).expires = 0;
		} else if (typeof name === 'object' && typeof name?.name === 'string') {
			this.set({ ...name, value: '', expires: 0 });
		} else {
			this.set({ name, value: '', expires: 0 });
		}
	}

	/**
	 *
	 * @param {string} arg
	 * @param {string|Cookie|CookieConfig} value
	 */
	set(arg, value) {
		if (typeof arg === 'string') {
			const cookie = new Cookie({ name: arg, value });

			this.#map.set(cookie.name, cookie);
		} else if (arg instanceof Cookie) {
			this.#map.set(arg.name, arg);
		} else if (typeof arg === 'object' && arg !== null && typeof arg.name === 'string') {
			const cookie = new Cookie(arg);

			this.#map.set(cookie.name, cookie);
		} else {
			throw new TypeError('Invalid arguments to cookieStore.set.');
		}
	}

	/**
	 *
	 * @param {Headers} headers
	 */
	addToHeaders(headers) {
		if (! (headers instanceof Headers)) {
			throw new TypeError('Expected a Headers object.');
		} else {
			for (const cookie of this) {
				headers.append('Set-Cookie', cookie.toString());
			}
		}
	}

	/**
	 *
	 * @param {Response} resp
	 */
	addToResponse(resp) {
		if (! (resp instanceof Response)) {
			throw new TypeError('Expected a Response object.');
		} else {
			this.addToHeaders(resp.headers);
		}
	}

	/**
	 *
	 * @param {Headers} headers
	 * @returns {CookieStore}
	 */
	static fromHeaders(headers) {
		if (headers instanceof Headers) {
			const store = new CookieStore();

			if (headers.has('Cookie')) {
				const cookies = headers.get('Cookie').split(';');

				for (const cookie of cookies) {
					const [name, ...values] = cookie.trim().split('=');
					store.set(name, values.map(decodeURIComponent).join('='));
				}
			}

			return store;
		} else {
			throw new TypeError('Not a Headers object.');
		}
	}

	/**
	 *
	 * @param {Request} req
	 * @return {CookieStore}
	 */
	static fromRequest(req) {
		if (req instanceof Request) {
			return CookieStore.fromHeaders(req.headers);
		} else {
			throw new TypeError('Not a Request object.');
		}
	}
}

export const cookieStore = new CookieStore();
