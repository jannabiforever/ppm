import prettier from 'eslint-config-prettier';
import { includeIgnoreFile } from '@eslint/compat';
import js from '@eslint/js';
import svelte from 'eslint-plugin-svelte';
import globals from 'globals';
import { fileURLToPath } from 'node:url';
import ts from 'typescript-eslint';
import svelteConfig from './svelte.config.js';

const gitignorePath = fileURLToPath(new URL('./.gitignore', import.meta.url));

export default ts.config(
	includeIgnoreFile(gitignorePath),
	js.configs.recommended,
	...ts.configs.recommended,
	...svelte.configs.recommended,
	prettier,
	...svelte.configs.prettier,
	{
		languageOptions: {
			globals: { ...globals.browser, ...globals.node }
		},
		rules: {
			// typescript-eslint strongly recommend that you do not use the no-undef lint rule on TypeScript projects.
			// see: https://typescript-eslint.io/troubleshooting/faqs/eslint/#i-get-errors-from-the-no-undef-rule-about-global-variables-not-being-defined-even-though-there-are-no-typescript-errors
			'no-undef': 'off',

			// Custom rules to prevent DateTime toString() usage
			'no-restricted-syntax': [
				'error',
				{
					selector:
						"CallExpression[callee.type='MemberExpression'][callee.property.name='toString'][callee.object.type='Identifier'][callee.object.name=/.*[Dd]ate.*|.*[Tt]ime.*/]",
					message:
						'Avoid using toString() on DateTime objects. Use DateTime.formatIso() instead to prevent PostgreSQL conversion errors.'
				},
				{
					selector:
						"CallExpression[callee.type='MemberExpression'][callee.property.name='toString'][callee.object.type='CallExpression'][callee.object.callee.type='MemberExpression'][callee.object.callee.object.name='DateTime']",
					message:
						'Avoid using toString() on DateTime objects. Use DateTime.formatIso() instead to prevent PostgreSQL conversion errors.'
				}
			]
		}
	},
	{
		files: ['**/*.svelte', '**/*.svelte.ts', '**/*.svelte.js'],
		languageOptions: {
			parserOptions: {
				projectService: true,
				extraFileExtensions: ['.svelte'],
				parser: ts.parser,
				svelteConfig
			}
		}
	}
);
