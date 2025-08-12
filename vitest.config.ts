import { defineConfig } from 'vitest/config';
import { sveltekit } from '@sveltejs/kit/vite';

export default defineConfig({
	plugins: [sveltekit()],
	test: {
		globals: true,
		environment: 'node',
		setupFiles: ['./src/lib/__tests__/setup/global-environment.ts'],
		testTimeout: 10000, // 10s for integration tests
		hookTimeout: 5000, // 5s for setup/teardown
		include: ['src/**/*.{test,spec}.{js,ts}'],
		exclude: [
			'node_modules/**',
			'build/**',
			'.svelte-kit/**',
			'src/lib/infra/supabase/types.ts', // Generated types
			'src/**/*.d.ts'
		],
		coverage: {
			provider: 'v8',
			include: ['src/lib/modules/**/*.ts'],
			exclude: [
				'**/__tests__/**',
				'**/*.test.ts',
				'**/*.spec.ts',
				'**/types.ts',
				'**/index.ts', // Re-export files
				'**/*.d.ts'
			],
			thresholds: {
				statements: 80,
				branches: 75,
				functions: 80,
				lines: 80
			},
			reporter: ['text', 'html', 'json-summary']
		},
		pool: 'threads',
		poolOptions: {
			threads: {
				singleThread: true // Prevent DB conflicts in tests
			}
		},
		reporters: ['verbose']
	},
	resolve: {
		alias: {
			$lib: new URL('./src/lib', import.meta.url).pathname,
			$app: new URL('./node_modules/@sveltejs/kit/src/runtime/app', import.meta.url).pathname
		}
	}
});
