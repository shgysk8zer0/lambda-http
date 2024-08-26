import js from '@eslint/js';
import globals from 'globals';
import { includeIgnoreFile } from '@eslint/compat';

export default [
	includeIgnoreFile(new URL(import.meta.resolve('./.gitignore')).pathname),
	{
		rules: {
			...js.configs.recommended.rules,
			'indent': [2, 'tab', { 'SwitchCase': 1 }],
			'quotes': [2, 'single'],
			'semi': [2, 'always'],
			'no-console': 0,
			'no-async-promise-executor': 0,
			'no-prototype-builtins': 0,
			'no-unused-vars': 'error',
		},
		languageOptions: {
			ecmaVersion: 'latest',
			sourceType: 'module',
			globals: { ...globals.node, URLPattern: false },
		}
	}
];
