import { beforeEach, afterEach, vi } from 'vitest';
import { Effect, Layer, Runtime } from 'effect';

// Mock environment variables for testing
vi.stubEnv('PUBLIC_SUPABASE_URL', 'http://localhost:54321');
vi.stubEnv('PUBLIC_SUPABASE_ANON_KEY', 'test-anon-key');

// Global test runtime setup
let globalTestRuntime: Runtime.Runtime<never>;

beforeEach(() => {
	// Create a fresh runtime for each test
	globalTestRuntime = Runtime.defaultRuntime;

	// Clear any existing timers
	vi.clearAllTimers();

	// Mock Date for deterministic testing
	vi.useFakeTimers();
	vi.setSystemTime(new Date('2024-01-01T10:00:00Z'));
});

afterEach(() => {
	// Clean up timers
	vi.restoreAllMocks();
	vi.useRealTimers();
});

// Test utilities
export const getTestRuntime = () => globalTestRuntime;

// Helper for running Effects in tests
export const runTest = <A, E>(effect: Effect.Effect<A, E, never>): Promise<A> => {
	return Effect.runPromise(effect);
};

// Helper for running Effects with specific layers
export const runTestWithLayers = <A, E, R>(
	effect: Effect.Effect<A, E, R>,
	layer: Layer.Layer<R, never, never>
): Promise<A> => {
	return effect.pipe(Effect.provide(layer), Effect.runPromise);
};

// Test clock setup for time-dependent tests
export const createTestClock = () => {
	// Use vi fake timers for time control
	return {
		advance: (ms: number) => vi.advanceTimersByTime(ms),
		set: (time: string | Date) => vi.setSystemTime(new Date(time))
	};
};

// Mock console to reduce noise in tests
global.console = {
	...console,
	log: vi.fn(),
	debug: vi.fn(),
	info: vi.fn(),
	warn: vi.fn(),
	error: vi.fn()
};
