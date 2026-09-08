import nodeResolve from '@rollup/plugin-node-resolve';
const external = ['@shgysk8zer0/polyfills'];

const modules = ['NetlifyRequest', 'RequestHandlerTest', 'TestRequest', 'consts', 'context', 'cookies', 'document', 'error', 'handler', 'lambda-http', 'utils'];
const plugins = [nodeResolve()];

export default modules.map(module => ({
	input: `${module}.js`,
	external,
	plugins,
	output: {
		file: `${module}.cjs`,
		format: 'cjs',
		exports: 'named',
	}
}));
