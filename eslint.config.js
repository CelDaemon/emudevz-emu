import { defineConfig } from 'eslint/config';
import js from '@eslint/js';
import globals from 'globals';

export default defineConfig([
	{
        basePath: 'code',
        ignores: ['tests/**/*'],
        plugins: {
            js,
        },
        extends: ['js/recommended'],
		rules: {
			semi: 'error',
			'prefer-const': 'error',
            eqeqeq: ['error', 'smart']
		},
        languageOptions: {
            globals: {
                ...globals.browser
            }
        }
	},
]);
