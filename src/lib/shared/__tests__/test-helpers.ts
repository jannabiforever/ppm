import { Effect, Layer } from 'effect';
import { vi } from 'vitest';

// Common test utilities for Effect.ts testing

/**
 * Helper to run Effect with error catching for tests
 */
export const runTestEffect = <A, E>(effect: Effect.Effect<A, E, never>): Promise<A> => {
	return effect.pipe(Effect.runPromise);
};

/**
 * Helper to run Effect with layers and error handling
 */
export const runTestWithLayers = <A, E, R>(
	effect: Effect.Effect<A, E, R>,
	layer: Layer.Layer<R, never, never>
): Promise<A> => {
	return effect.pipe(Effect.provide(layer), Effect.runPromise);
};

/**
 * Helper to test error scenarios
 */
export const expectEffectError = async <A, E>(
	effect: Effect.Effect<A, E, never>,
	errorMatcher?: (error: E) => boolean | void
): Promise<E> => {
	try {
		await Effect.runPromise(effect);
		throw new Error('Expected effect to fail, but it succeeded');
	} catch (error) {
		if (errorMatcher) {
			const result = errorMatcher(error as E);
			if (result === false) {
				throw new Error(`Error did not match expected pattern: ${error}`);
			}
		}
		return error as E;
	}
};

/**
 * Helper to test Effect success scenarios
 */
export const expectEffectSuccess = async <A, E>(effect: Effect.Effect<A, E, never>): Promise<A> => {
	return Effect.runPromise(effect);
};

/**
 * Create a spy function that returns an Effect
 */
export const createEffectSpy = <A, E = never>(returnValue: A, shouldFail = false, error?: E) => {
	const spy = vi.fn();

	if (shouldFail) {
		spy.mockReturnValue(Effect.fail(error));
	} else {
		spy.mockReturnValue(Effect.succeed(returnValue));
	}

	return spy;
};

/**
 * Wait for a specific amount of time in tests
 */
export const waitFor = (ms: number): Promise<void> => {
	return new Promise((resolve) => setTimeout(resolve, ms));
};

/**
 * Generate unique test IDs
 */
export const generateTestId = (prefix = 'test'): string => {
	return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * Create a test timestamp
 */
export const createTestTimestamp = (offsetMinutes = 0): string => {
	const now = new Date('2024-01-01T10:00:00Z');
	now.setMinutes(now.getMinutes() + offsetMinutes);
	return now.toISOString();
};

/**
 * Compare two objects ignoring timestamps
 */
export const compareWithoutTimestamps = (
	actual: Record<string, unknown>,
	expected: Record<string, unknown>,
	timestampFields = ['created_at', 'updated_at', 'started_at', 'closed_at', 'scheduled_end_at']
): boolean => {
	const actualFiltered = { ...actual };
	const expectedFiltered = { ...expected };

	timestampFields.forEach((field) => {
		delete actualFiltered[field];
		delete expectedFiltered[field];
	});

	return JSON.stringify(actualFiltered) === JSON.stringify(expectedFiltered);
};

/**
 * Assert that timestamps are valid ISO strings
 */
export const assertValidTimestamps = (obj: Record<string, unknown>, fields: string[]): void => {
	fields.forEach((field) => {
		if (obj[field] !== null && obj[field] !== undefined) {
			const date = new Date(obj[field] as string);
			if (isNaN(date.getTime())) {
				throw new Error(`Invalid timestamp in field ${field}: ${obj[field]}`);
			}
		}
	});
};

/**
 * Create a layer that merges multiple service layers
 */
export const createTestLayers = <R>(
	...layers: Layer.Layer<unknown, never, never>[]
): Layer.Layer<R, never, never> => {
	return layers.reduce((acc, layer) => Layer.mergeAll(acc, layer)) as Layer.Layer<R, never, never>;
};

/**
 * Mock timer utilities for testing time-dependent operations
 */
export const mockTime = {
	/**
	 * Set a specific time for tests
	 */
	setTime: (time: string | Date): void => {
		vi.setSystemTime(new Date(time));
	},

	/**
	 * Advance time by specified milliseconds
	 */
	advanceTime: (ms: number): void => {
		vi.advanceTimersByTime(ms);
	},

	/**
	 * Advance time by specified minutes
	 */
	advanceMinutes: (minutes: number): void => {
		vi.advanceTimersByTime(minutes * 60 * 1000);
	},

	/**
	 * Reset to real timers
	 */
	reset: (): void => {
		vi.useRealTimers();
	}
};

/**
 * Database record counting helper
 */
export const createRecordCounter = () => ({
	countRecords: (): Promise<number> => {
		// This would be implemented based on your mock structure
		// For now, return a mock count
		return Promise.resolve(0);
	},

	verifyRecordExists: async (): Promise<boolean> => {
		// Mock implementation
		return Promise.resolve(true);
	}
});

/**
 * Create test data validation helpers
 */
export const validators = {
	/**
	 * Validate that an object has all required fields
	 */
	hasRequiredFields: <T>(obj: T, requiredFields: (keyof T)[]): boolean => {
		return requiredFields.every((field) => obj[field] !== undefined && obj[field] !== null);
	},

	/**
	 * Validate UUID format
	 */
	isValidUUID: (uuid: string): boolean => {
		const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
		return uuidRegex.test(uuid);
	},

	/**
	 * Validate ISO timestamp format
	 */
	isValidISOTimestamp: (timestamp: string): boolean => {
		const date = new Date(timestamp);
		return !isNaN(date.getTime()) && timestamp.includes('T') && timestamp.includes('Z');
	}
};

/**
 * Batch operation helpers for testing
 */
export const batchHelpers = {
	/**
	 * Create multiple test records
	 */
	createMultiple: <T>(factory: () => T, count: number): T[] => {
		return Array.from({ length: count }, factory);
	},

	/**
	 * Run multiple effects in parallel and collect results
	 */
	runParallel: async <A, E>(effects: Effect.Effect<A, E, never>[]): Promise<A[]> => {
		return Effect.all(effects, { concurrency: 'unbounded' }).pipe(Effect.runPromise);
	},

	/**
	 * Run multiple effects sequentially
	 */
	runSequential: async <A, E>(effects: Effect.Effect<A, E, never>[]): Promise<A[]> => {
		const results: A[] = [];
		for (const effect of effects) {
			const result = await Effect.runPromise(effect);
			results.push(result);
		}
		return results;
	}
};

/**
 * Test scenario builder for complex test setups
 */
export class TestScenarioBuilder {
	private steps: (() => Promise<unknown>)[] = [];
	private cleanup: (() => Promise<void>)[] = [];

	step(name: string, fn: () => Promise<unknown>): this {
		this.steps.push(async () => {
			console.log(`Executing step: ${name}`);
			return await fn();
		});
		return this;
	}

	onCleanup(fn: () => Promise<void>): this {
		this.cleanup.push(fn);
		return this;
	}

	async execute(): Promise<unknown[]> {
		const results: unknown[] = [];

		try {
			for (const step of this.steps) {
				const result = await step();
				results.push(result);
			}
			return results;
		} finally {
			// Run cleanup in reverse order
			for (const cleanupFn of this.cleanup.reverse()) {
				try {
					await cleanupFn();
				} catch (error) {
					console.warn('Cleanup failed:', error);
				}
			}
		}
	}
}

/**
 * Create a new test scenario builder
 */
export const scenario = (): TestScenarioBuilder => new TestScenarioBuilder();
