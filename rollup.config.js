import nodeResolve from '@rollup/plugin-node-resolve';
const external = ['@shgysk8zer0/polyfills', '@shgysk8zer0/consts/mimes.js', '@shgysk8zer0/consts/status.js'];

const modules = ['NetlifyRequest', 'RequestHandlerTest', 'TestRequest', 'context', 'cookies', 'document', 'error', 'handler', 'lambda-http', 'utils'];
const plugins = [nodeResolve()];

export default modules.map(module => ({
	input: `${module}.js`,
	external,
	plugins,
	output: {
		file: `${module}.cjs`,
		format: 'cjs',
	}
}));

// export default [{
// 	input: 'lambda-http.js',
// 	external,
// 	plugins: [nodeResolve()],
// 	output: [{
// 		file: 'lambda-http.mjs',
// 		format: 'module',
// 	}, {
// 		file: 'lambda-http.cjs',
// 		format: 'cjs',
// 	}],
// }, {
// 	input: 'error.js',
// 	external,
// 	plugins: [nodeResolve()],
// 	output: {
// 		file: 'error.cjs',
// 		format: 'cjs',
// 	},
// }, {
// 	input: 'handler.js',
// 	external,
// 	output: {
// 		file: 'handler.cjs',
// 		format: 'cjs',
// 	}
// }, {
// 	input: 'cookies.js',
// 	external,
// 	output: {
// 		file: 'cookies.cjs',
// 		format: 'cjs',
// 	}
// }, {
// 	input: 'NetlifyRequest.js',
// 	external,
// 	output: {
// 		file: 'NetlifyRequest.cjs',
// 		format: 'cjs',
// 	}
// }];
