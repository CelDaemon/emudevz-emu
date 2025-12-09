import { defineConfig } from 'eslint/config';
import js from '@eslint/js';
import globals from 'globals';

export default defineConfig([
	{
        basePath: 'src',
        ignores: ['tests/**/*'],
        plugins: {
            js,
        },
        extends: ['js/recommended'],
		rules: {
			semi: 'error',
			'prefer-const': 'error',
            eqeqeq: ['error', 'smart'],
            'block-scoped-var': 'error',
            'consistent-return': 'error',
		},
        languageOptions: {
            globals: {
                ...globals.browser
            }
        }
	},
]);
