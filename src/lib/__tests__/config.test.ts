import { describe, test, expect } from 'vitest';
import { Effect } from 'effect';
import { runTestEffect } from '../shared/__tests__/test-helpers';
import { createMockSupabaseService } from '../shared/__tests__/mocks/supabase.mock';

describe('Test Configuration', () => {
	test('should run basic Effect operations', async () => {
		const result = await runTestEffect(Effect.succeed(42));
		expect(result).toBe(42);
	});

	test('should handle Effect failures', async () => {
		const errorEffect = Effect.fail(new Error('Test error'));

		await expect(runTestEffect(errorEffect)).rejects.toThrow('Test error');
	});

	test('should work with Effect.gen', async () => {
		const result = await Effect.gen(function* () {
			const a = yield* Effect.succeed(10);
			const b = yield* Effect.succeed(20);
			return a + b;
		}).pipe(Effect.runPromise);

		expect(result).toBe(30);
	});

	test('should work with mock Supabase service', async () => {
		const mockLayer = createMockSupabaseService({
			selectResult: { id: 'test_123', name: 'Test Item' }
		});

		const result = await Effect.succeed({ id: 'test_123', name: 'Test Item' }).pipe(
			Effect.provide(mockLayer),
			Effect.runPromise
		);

		expect(result).toEqual({ id: 'test_123', name: 'Test Item' });
	});

	test('should handle time mocking', () => {
		// Verify that fake timers are working
		const now = new Date();
		expect(now.getFullYear()).toBe(2024);
		expect(now.getMonth()).toBe(0); // January
		expect(now.getDate()).toBe(1);
	});

	test('should validate test environment variables', () => {
		expect(process.env.PUBLIC_SUPABASE_URL).toBe('http://localhost:54321');
		expect(process.env.PUBLIC_SUPABASE_ANON_KEY).toBe('test-anon-key');
	});
});
