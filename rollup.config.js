import nodeResolve from '@rollup/plugin-node-resolve';

export default [{
	input: 'lambda-http.js',
	plugins: [nodeResolve()],
	output: [{
		file: 'lambda-http.mjs',
		format: 'module',
	}, {
		file: 'lambda-http.cjs',
		format: 'cjs',
	}],
}, {
	input: 'error.js',
	plugins: [nodeResolve()],
	output: {
		file: 'error.cjs',
		format: 'cjs',
	},
}, {
	input: 'mimes.js',
	output: {
		file: 'mimes.cjs',
		format: 'cjs',
	}
}, {
	input: 'status.js',
	output: {
		file: 'status.cjs',
		format: 'cjs',
	}
}, {
	input: 'handler.js',
	output: {
		file: 'handler.cjs',
		format: 'cjs',
	}
}];
