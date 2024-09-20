import { node, browser } from '@shgysk8zer0/eslint-config';

export default [
	// ignoreFile,
	...browser({ files: ['*.js', 'js/*.js', 'js/**.js' ] }),
	...node({ files: ['api/**/*.js'] }),
];
