import { readFile } from 'node:fs/promises';

function convertKey(key) {
	if (typeof key !== 'string' || key.length === 0) {
		throw new TypeError('Replacements key must be a string.');
	} else {
		return key.toUpperCase();
	}
}

export class DocumentTemplate {
	#content = '';
	#replacements = new Map();

	constructor(content = '') {
		if (typeof content !== 'string' || content.length === 0) {
			throw new TypeError('Template content must be a non-empty string.');
		} else {
			this.#content = content;
		}
	}

	[Symbol.iterator]() {
		return this.entries();
	}

	toString() {
		let content = this.#content;

		for (const [key, value] of this) {
			content = content.replaceAll(`{{ ${key} }}`, value);
		}

		return content;
	}

	toJSON() {
		return {
			content: this.#content,
			replacements: Object.fromEntries(this.#replacements),
		};
	}

	keys() {
		return this.#replacements.keys();
	}

	values() {
		return this.#replacements.values();
	}

	entries() {
		return this.#replacements.entries();
	}

	escape(str) {
		return str.toString()
			.replaceAll('&', '&amp;')
			.replaceAll('<', '&lt;')
			.replaceAll('>', '&gt;')
			.replaceAll('"', '&quot;');
	}

	set(key, value, { escape = true } = {}) {
		if (typeof value === 'undefined' || Object.is(value, null)) {
			throw new TypeError('Cannot replace with null or undefined.');
		} else if (escape) {
			this.#replacements.set(convertKey(key), this.escape(value));
			return this;
		} else {
			this.#replacements.set(convertKey(key), value.toString());
			return this;
		}
	}

	setSafe(key, value) {
		return this.set(key, value, { escape: true });
	}

	setUnsafe(key, value) {
		return this.set(key, value, { escape: false });
	}

	setAll(replacements, { escape = true } = {}) {
		if (typeof replacements !== 'object' || Array.isArray(replacements) || replacements === null) {
			throw new TypeError('Replacements should be a plain object.');
		} else {
			const errs = [];
			Object.entries(replacements).forEach(([key, value]) => {
				try {
					this.set(key, value, { escape });
				} catch(err) {
					errs.push(err);
				}
			});

			if (errs.length === 0) {
				return this;
			} else if (errs.length === 1) {
				throw errs[0];
			} else {
				throw new AggregateError(errs, 'Error when setting replacements.');
			}
		}
	}

	setAllSafe(replacements) {
		return this.setAll(replacements, { escape: true });
	}

	setAllUnsafe(replacements) {
		return this.setAll(replacements, { escape: false });
	}

	clear() {
		return this.#replacements.clear();
	}

	has(key) {
		return this.#replacements.has(convertKey(key));
	}

	delete(key) {
		return this.#replacements.delete(convertKey(key));
	}

	blob({ type = 'text/html', lastModified = Date.now() } = {}) {
		return new Blob([this.toString()], { type, lastModified });
	}

	response({ headers = new Headers(), status = 200, statusText, type, lastModified } = {}) {
		return new Response(this.blob({ type, lastModified }), { headers, status, statusText });
	}

	static async load(path) {
		const content = await readFile(path, 'utf-8');
		return new DocumentTemplate(content);
	}

	static async create(path, replacements, { escape = true } = {}) {
		const doc = await DocumentTemplate.load(path);
		doc.setAll(replacements, { escape });
		return doc;
	}

	static async createBlob(path, replacements = {}, { type, lastModified, escape = true } = {}) {
		const doc = await DocumentTemplate.create(path, replacements, { escape });
		return doc.blob({ type, lastModified });
	}

	static async createResponse(path, replacements = {}, { headers, status, statusText, type, lastModified, escape = true } = {}) {
		const doc = await DocumentTemplate.create(path, replacements, { escape });
		return doc.response({ headers, status, statusText, type, lastModified });
	}
}
