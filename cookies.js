export class Cookie {
	#name;
	#value;
	#path = '/';
	#domain;
	#expires;
	#sameSite = 'Lax';
	#httpOnly = false;
	#secure = false;
	#partitioned = false;

	constructor({
		name,
		value = '',
		path = '/',
		domain,
		expires,
		sameSite = 'lax',
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

	get name() {
		return this.#name;
	}

	set name(val) {
		if (typeof val === 'string') {
			this.#name = val;
		} else {
			throw new TypeError('Cookie name must be a string.');
		}
	}

	get value() {
		return this.#value;
	}

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

	get domain() {
		return this.#domain;
	}

	set domain(val) {
		if (val instanceof URL) {
			this.#domain = val.hostname;
		} else if (typeof val !== 'string' || val.length === '') {
			throw new TypeError('Cookie domain must be a non-empty string.');
		} else {
			this.#domain = val;
		}
	}

	get expires() {
		if (this.#expires instanceof Date) {
			return this.#expires.getTime();
		} else {
			return undefined;
		}
	}

	set expires(val) {
		switch (typeof val) {
			case 'string':
				this.expires = new Date(val).getTime();
				break;

			case 'number':
				this.#expires = Number.isNaN(val) ? undefined : val;
				break;

			case 'object':
				if (val === null) {
					this.#expires = undefined;
				} else if (! (val instanceof Date)) {
					throw new TypeError('Invalid expires.');
				} else {
					this.#expires = val.getTime();
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

	get httpOnly() {
		return this.#httpOnly;
	}

	set httpOnly(val) {
		if (typeof val !== 'boolean') {
			throw new TypeError('Cookie httpOnly must be a boolean.');
		} else {
			this.#httpOnly = val;
		}
	}

	get partitioned() {
		return this.#partitioned;
	}

	set partitioned(val) {
		if (typeof val !== 'boolean') {
			throw new TypeError('Cookie partitioned must be a boolean.');
		} else {
			this.#partitioned = val;
		}
	}

	get path() {
		return this.#path;
	}

	set path(val) {
		if (val instanceof URL) {
			this.#path = val.pathname;
		} else if (typeof val === 'string' && val.length !== 0) {
			this.#path = val;
		} else {
			throw new TypeError('Cookie path must be a non-empty string.');
		}
	}

	get sameSite() {
		return this.#sameSite;
	}

	set sameSite(val) {
		if (typeof val !== 'string') {
			throw new TypeError('Cookie SameSite must be a string.');
		} else if (! ['lax', 'strict', 'none'].includes(val)) {
			throw new TypeError('Cookie SameSite must be "none", "lax", or "strict".');
		} else {
			this.#sameSite = val;
		}
	}

	get secure() {
		return this.#secure;
	}

	set secure(val) {
		if (typeof val !== 'boolean') {
			throw new TypeError('Cookie secure must be a boolean.');
		} else {
			this.#secure = val;
		}
	}

	toString() {
		const parts = [`${this.#name}=${this.#value}`];

		if (typeof this.#expires === 'number') {
			parts.push(`Expires=${new Date(this.#expires).toUTCString()}`);
		}

		if (typeof this.#domain === 'string') {
			parts.push(`Domain=${this.#domain}`);
		}

		if (typeof this.#path === 'string' && this.#path !== '/') {
			parts.push(`Path=${this.#path}`);
		}

		if (typeof this.#sameSite === 'string') {
			parts.push(`SameSite=${this.sameSite[0].toUpperCase()}${this.#sameSite.substring(1).toLowerCase()}`);
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

	addToHeaders(headers) {
		if (! (headers instanceof Headers)) {
			throw new TypeError('Expected a Headers object.');
		} else {
			headers.append('Set-Cookie', this);
		}
	}

	addToResponse(resp) {
		if (resp instanceof Response) {
			this.addToHeaders(resp.headers);
		} else {
			throw new TypeError('Not a Response object.');
		}
	}
}

export class CookieStore {
	#map = new Map();

	[Symbol.iterator]() {
		return this.values();
	}

	keys() {
		return this.#map.keys();
	}

	values() {
		return this.#map.values();
	}

	entries() {
		return this.#map.entries();
	}

	has(name) {
		return this.#map.has(name);
	}

	get(name) {
		return this.#map.get(name);
	}

	getAll(name) {
		return [this.get(name)];
	}

	delete(name) {
		if (this.has(name)) {
			this.get(name).expires = 0;
		} else {
			this.set({ name, value: '', expires: 0 });
		}
	}

	set(arg, value) {
		if (typeof arg === 'string') {
			const cookie = new Cookie({ name: arg, value });

			this.#map.set(cookie.name, cookie);
		} else if (arg instanceof Cookie) {
			this.#map.set(arg.name, arg);
		} else if (typeof arg === 'object' && arg !== null) {
			const cookie = new Cookie(arg);

			this.#map.set(cookie.name, cookie);
		} else {
			throw new TypeError('Invalid arguments to cookieStore.set.');
		}
	}

	addToHeaders(headers) {
		if (! (headers instanceof Headers)) {
			throw new TypeError('Expected a Headers object.');
		} else {
			for (const cookie of this) {
				headers.append('Set-Cookie', cookie);
			}
		}
	}

	addToResponse(resp) {
		if (! (resp instanceof Response)) {
			throw new TypeError('Expected a Response object.');
		} else {
			this.addToHeaders(resp.headers);
		}
	}
}

export const cookieStore = new CookieStore();
