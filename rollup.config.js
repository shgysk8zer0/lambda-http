import nodeResolve from '@rollup/plugin-node-resolve';
const external = ['@shgysk8zer0/polyfills', '@shgysk8zer0/consts/mimes.js', '@shgysk8zer0/consts/status.js'];

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
