# Style Guide for the `Effect.ts` System

## Imports

Do not import subsystems of effect (e.g. `Option`, `Schema`, etc.) directly from `effect`.
Import subsystems in the following way:

```typescript
import * as Option from 'effect/Option';
import * as Schema from 'effect/Schema';
```

Similarly, when importing custom implementation modules related to services, import them in a similar way:

```typescript
import * as Cache from 'effect/Service';

const program = Effect.gen(function* () {
	const cache = yield* Cache.Service;
	return yield* cache.lookup('key');
}).pipe(Effect.provide(Cache.Service.Default), Effect.runPromise);
```

## Services

There are two methods for defining services:

1. `Effect.Service`:

```typescript
// cache.ts
import { FileSystem } from '@effect/platform';
import { NodeFileSystem } from '@effect/platform-node';
import { Effect } from 'effect';

// Define cache service
class Service extends Effect.Service<Service>()('Cache', {
	// Define how to create the service
	effect: Effect.gen(function* () {
		const fs = yield* FileSystem.FileSystem;
		const lookup = (key: string) => fs.readFileString(`cache/${key}`);
		return { lookup } as const;
	}),
	// Specify dependencies
	dependencies: [NodeFileSystem.layer]
}) {}
```

2. `Context.Tag`:

```typescript
// cache.ts
import { FileSystem } from "@effect/platform"
import { NodeFileSystem } from "@effect/platform-node"
import { Effect } from "effect"
import * as Context from 'effect/Context'

// Define cache service
class Service extends Context.Tag("Cache")<Service, {
		readonly lookup: (key: string) => Effect<string, Error, string>
}) {}
```

Use `Effect.Service` when the service has a default implementation,
otherwise use `Context.Tag`.

## Naming Conventions

### Layers

Application layer names should end with `Live`.

```typescript
// Default `CacheService` layer used in application code
export const CacheLive = Layer.succeed(...)
```

Test layer names should end with `Test`.

```typescript
// Default `CacheService` layer used in test code
export const CacheTest = Layer.succeed(...)
```

All services should be defined one per file, and each service name should be fixed as `Service`.
When importing later, import like `import * as Some from './some'` and use it as `Some.Service`.

Functions that create Layers should have their names fixed as 'make'.
