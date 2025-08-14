# Testing Setup Documentation

This directory contains the complete testing infrastructure for the PPM (Personal Project Manager) application built with Effect.ts and SvelteKit.

## 📁 Directory Structure

```
src/__tests__/
├── README.md                           # This file
├── config.test.ts                      # Configuration verification tests
├── setup/                              # Global test setup files
│   ├── test-environment.ts             # Effect runtime and global setup
│   ├── mock-supabase.ts                # Supabase mocking utilities
│   └── test-helpers.ts                 # Common test utilities
└── fixtures/                           # Shared test data
    └── global/                         # Cross-module fixtures
        ├── users.ts                    # Test user data
        └── common-errors.ts            # Common error scenarios
```

## 🛠️ Configuration

### Vitest Setup

- **Configuration**: `vitest.config.ts` in project root
- **Environment**: Node.js with Effect.ts runtime
- **Coverage**: 80% statements, 75% branches target
- **Timeout**: 10s integration tests, 5s setup/teardown

### Key Features

- **Effect.ts Integration**: Full support for Effect pipelines and error handling
- **Supabase Mocking**: Complete mock infrastructure for database operations
- **Time Control**: Fake timers and TestClock for deterministic time testing
- **Layer Management**: Proper dependency injection testing patterns

## 🚀 Running Tests

### Basic Commands

```bash
# Run all tests
npm run test

# Run tests in watch mode
npm run test:watch

# Run with coverage report
npm run test:coverage

# Run once (CI mode)
npm run test:run
```

### Specialized Test Categories

```bash
# Integration tests
npm run test:integration

# Unit tests only
npm run test:unit

# Timing/duration tests
npm run test:timing

# Concurrency tests
npm run test:concurrent

# Database cleanup tests
npm run test:db
```

## 📋 Testing Conventions

### File Naming

- `*.test.ts` - Integration tests
- `*.unit.test.ts` - Business logic unit tests
- `*.spec.ts` - Schema validation tests

### Test Structure

```typescript
import { describe, test, expect } from 'vitest';
import { Effect } from 'effect';
import { runTestEffect } from '../setup/test-helpers';

describe('ServiceName methodName', () => {
	test('should perform action when condition met', async () => {
		const result = await Effect.succeed(42).pipe(Effect.runPromise);
		expect(result).toBe(42);
	});
});
```

## 🔧 Effect.ts Testing Patterns

### Basic Effect Testing

```typescript
// Success case
const result = await Effect.succeed(value).pipe(Effect.runPromise);

// Error case
await expect(Effect.fail(new Error('Test error')).pipe(Effect.runPromise)).rejects.toThrow(
	'Test error'
);
```

### Service Testing with Layers

```typescript
const result = await Effect.gen(function* () {
	const service = yield* MyService;
	return yield* service.methodAsync(input);
}).pipe(Effect.provide(mockLayer), Effect.runPromise);
```

### Error Validation

```typescript
await expect(serviceMethod(invalidInput).pipe(Effect.runPromise)).rejects.toMatchObject({
	_tag: 'ValidationError',
	message: expect.stringContaining('required')
});
```

## 🏗️ Mock Infrastructure

### Supabase Mocking

```typescript
import { createMockSupabaseService, mockConfigs } from '../setup/mock-supabase';

// Success scenario
const mockLayer = createMockSupabaseService(mockConfigs.successfulInsert(mockData));

// Error scenario
const errorLayer = createMockSupabaseService(mockConfigs.databaseError('Connection failed'));
```

### Service Mocking

```typescript
import { Layer } from 'effect';
import { TaskService } from '$lib/modules/task';

const mockTaskService = Layer.succeed(TaskService, {
	createTaskAsync: () => Effect.succeed(mockTask),
	updateTaskStatusAsync: () => Effect.succeed(mockTask)
});
```

## ⏰ Time Testing

### Using TestClock

```typescript
import { TestClock } from '@effect/platform';

test('should handle scheduled operations', async () => {
	const testClock = TestClock.make();

	const result = await Effect.gen(function* () {
		yield* Effect.sleep('5 minutes');
		return 'completed';
	}).pipe(Effect.provide(testClock), Effect.runPromise);
});
```

### Fake Timers (Vitest)

```typescript
import { mockTime } from '../setup/test-helpers';

test('should advance time correctly', () => {
	mockTime.setTime('2024-01-01T10:00:00Z');
	mockTime.advanceMinutes(30);
	// Test time-dependent logic
});
```

## 🎯 Test Categories

### Schema Validation Tests

- Input/output validation
- Type safety verification
- Boundary condition testing

### Business Logic Unit Tests

- Pure functions
- Status transitions
- Domain rule validation

### Service Integration Tests

- Complete Effect pipelines
- Database operations
- Service dependencies

### Error Handling Tests

- Database failures
- Business rule violations
- Network errors

## 📊 Coverage Guidelines

### Target Coverage

- **80%+ statements** on service methods
- **100% coverage** on business logic functions
- **Focus on edge cases** and error scenarios

### What NOT to Test

- Generated types (`types.ts`)
- Re-export files (`index.ts`)
- External library code

## 🔍 Debugging Tests

### Common Issues

1. **Layer conflicts**: Use explicit `Layer.mergeAll()` ordering
2. **Time-dependent failures**: Ensure fake timers are properly set
3. **Database state**: Verify cleanup between tests
4. **Mock isolation**: Reset mocks in `beforeEach`

### Debug Commands

```bash
# Run single test file
npm run test path/to/test.ts

# Run with debug output
npm run test -- --reporter=verbose

# Run UI mode for debugging
npm run test:ui
```

## 📚 Resources

- [Testing Conventions](./.testing-conventions.md) - Complete testing rules
- [Effect.ts Testing Guide](https://effect.website/docs/testing)
- [Vitest Documentation](https://vitest.dev/)

## 🤝 Contributing

When adding new tests:

1. Follow the established patterns in `setup/`
2. Use appropriate fixtures from `fixtures/global/`
3. Add module-specific fixtures to your test directory
4. Ensure proper cleanup and isolation
5. Follow the pipe-first coding style

## ✅ Verification

The test setup is verified by `config.test.ts` which checks:

- Basic Effect operations
- Error handling
- Mock Supabase integration
- Time mocking
- Environment variables

Run `npm run test:run` to verify your setup is working correctly.
