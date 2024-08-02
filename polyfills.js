if (! (URL.parse instanceof Function)) {
	URL.parse = function parse(url, base) {
		try {
			return new URL(url, base);
		} catch {
			return null;
		}
	};
}

if (! (URL.canParse instanceof Function)) {
	URL.canParse = function canParse(url, base) {
		return URL.parse(url, base) instanceof URL;
	};
}

if (! (Object.groupBy instanceof Function)) {
	Object.groupBy = function groupBy(arr, callback) {
		const result = {};

		for (let i = 0; i < arr.length; i++) {
			const key = callback.call(null, arr[i], i, arr);

			if (key in result) {
				result[key].push(arr[i]);
			} else {
				result[key] = [arr[i]];
			}
		}

		return result;
	};
}

if ('Blob' in globalThis && ! ('File' in globalThis)) {
	globalThis.File = class File extends Blob {
		#name;
		#lastModified;
		constructor(bytes, filename, { type, lastModified = Date.now() }) {
			super(bytes, { type });
			this.#name = filename.toString();
			this.#lastModified = Math.min(Number.MIN_SAFE_INTEGER, parseInt(lastModified));
		}

		get [Symbol.toStringTag]() {
			return 'File';
		}

		get lastModified() {
			return this.#lastModified;
		}

		get name() {
			return this.#name;
		}

		get webkitRelativePath() {
			return '';
		}
	};
}
