import nodeResolve from '@rollup/plugin-node-resolve';
const external = ['@shgysk8zer0/polyfills'];

const modules = ['NetlifyRequest', 'RequestHandlerTest', 'TestRequest', 'consts', 'context', 'cookies', 'document', 'error', 'handler', 'utils'];
const plugins = [nodeResolve()];

export default [{
	input: 'lambda-http.js',
	external,
	plugins,
	output: [{
		file: 'lambda-http.cjs',
		format: 'cjs',
		exports: 'named',
	}, {
		file: 'lambda-http.mjs',
		format: 'esm',
		exports: 'named',
	}]
} ,...modules.map(module => ({
	input: `${module}.js`,
	external,
	plugins,
	output: [{
		file: `${module}.cjs`,
		format: 'cjs',
		exports: 'named',
	}]
}))];
