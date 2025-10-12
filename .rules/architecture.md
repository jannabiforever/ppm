# Do not create files/folders arbitrarily without confirmation.

To maintain consistency, all files and folders must be properly managed and tracked. This includes creating, updating, and deleting files and folders in a controlled manner.
Whenever there is a need to create new files in new locations, new **rules** must be established to ensure they can be easily found and sustainably managed. Before that, do not create new files that do not follow the rules.

# stores

At the client level, store objects that are created and used globally should be placed in the `src/lib/stores` folder.

# Shared

Objects, functions, or test helper functions that are commonly used across all services should be placed in the `src/lib/shared` folder.

# Modules

Modules are organized into two categories under 'src/lib/modules':

## Infrastructure (src/lib/modules/infra)

Core infrastructure services that provide foundational functionality:
- `supabase` - Supabase client, authentication, and database connection management
- `auth` - Authentication operations (sign in, sign out, OAuth)
- Future infrastructure services like Redis, AWS S3, external APIs, etc. should be placed here

## Repository (src/lib/modules/repository)

Repository pattern services that handle data persistence and retrieval:
- `projects` - Project data management
- `tasks` - Task data management
- `focus_sessions` - Focus session data management
- `session_tasks` - Session-task relationship management
- `user_profile` - User profile data management

These repository services use the infrastructure services to interact with the database.

# Applications

Services that implement use cases by utilizing modules should be placed in the 'src/lib/applications' folder.
Application services orchestrate multiple repository/infrastructure modules to implement complex business logic.

Examples:
- `session-scheduling` - Manages focus session scheduling with conflict detection
- `session-task-management` - Handles task assignment to sessions
- `session-project-lookup` - Enriches session data with project information

## Boundary between Applications and Modules

It may appear that business logic is seeping into modules due to DB constraints, but the boundary becomes clear when separating **invariant interpretation** and **policy application**.

### Logic allowed in modules (OK)

- **DB Constraint Interpretation**: Converting database error codes (SQLSTATE) or constraint names to **domain invariant errors**
		- Example: `projects_name_key` → `Project/NameAlreadyTaken`
		- Example: `tasks_project_id_fkey` → `Project/NotFound`

- **Single-resource level invariant checks**
		- unique, foreign key, check constraints, etc.

- **Format/Range Validation**: Schema-based type validation, value normalization
- **Input/Output Safeguards**: Page size limits, sort key whitelists, and other security-purpose restrictions

### Logic that should not be placed in modules (NG)

- **Cross-entity rules**: "A project must have an initial task when created"
- **Policy-based branching**: "If user level is X, then use strategy Y"
- **Multi-repo/external system orchestration**
- **Transaction boundary setting**

### Layer Role Summary

- **Infrastructure Module**
		- Provides access to external systems (databases, APIs, etc.)
		- Handles authentication and connection management
		- Technology-specific implementation details

- **Repository Module**
		- Interface between infrastructure ↔ domain
		- Interprets DB errors and converts them to domain invariant errors
		- Single entity CRUD operations
		- Unaware of cross-entity policies or transactions

- **Application (UseCase)**
		- Applies cross-entity rules
		- Combines multiple modules and manages transaction boundaries
		- Implements complex business workflows
		- Remaps module errors to its own use case errors

### Conclusion

- **Infrastructure = External System Access**, **Repository = Data Persistence**, **Application = Business Logic Orchestration**
- Interpreting DB constraints in repository modules is inevitable, but this is **domain invariant naming** not business logic infiltration
- Cross-entity policies, transactions, and complex workflows must be managed at the application layer

# Service Definition Folder Rules

A folder defining a service should follow this structure:

## Repository Service Structure

```
src/lib/modules/repository/projects
├── __test__
│   └── schema.test.ts
├── api.ts
├── errors.ts
├── index.ts
├── index.server.ts
├── service.server.ts
└── types.ts
```

## Infrastructure Service Structure

```
src/lib/modules/infra/supabase
├── cookies.ts
├── errors.ts
├── index.server.ts
├── index.ts
└── service.server.ts
```

## Application Service Structure

```
src/lib/applications/session-scheduling
├── __test__
│   └── schema.test.ts
├── api.ts
├── errors.ts
├── index.ts
├── index.server.ts
├── service.server.ts
└── types.ts
```

## index.ts

A file containing exports that can be used on both client and server. It mainly exports types, schemas, error definitions, and API services.

```typescript
export * from './types';
export * from './errors';
export { ApiService } from './api';
```

## index.server.ts

A file containing server-only exports. It exports server-only files such as service.server.ts.

```typescript
export { Service } from './service.server';
export * from './errors';
```

## api.ts

A service file for calling server APIs from the client. It is configured using `Effect.Service` and `HttpClient`.

```typescript
export class ApiService extends Effect.Service<ApiService>()('api/FocusSession', {
	effect: Effect.gen(function* () {
		const client = yield* HttpClient.HttpClient;

		return {
			createFocusSession: (payload: Omit<typeof FocusSessionInsertSchema.Encoded, 'owner_id'>) =>
				HttpBody.json(payload).pipe(
					Effect.flatMap((body) => client.post('/api/focus-sessions', { body })),
					Effect.flatMap((res) => res.json),
					Effect.flatMap(parseOrAppError(CreateFocusSessionSchemaResponse))
				)
		};
	})
}) {}
```

- Client-side service that communicates with server REST API endpoints
- Fields automatically set by the server, such as `owner_id`, are excluded from the payload
- Responses are validated through schemas and converted to `App.Error`

## errors.ts

Error definition file. Defines errors using `Data.TaggedError`. See error-handling.md for details.

```typescript
import { Data } from 'effect';

export class NotFound extends Data.TaggedError('Project/NotFound')<{
	projectId: string;
}> {}

export class NameAlreadyExists extends Data.TaggedError('Project/NameAlreadyExists')<{
	name: string;
}> {}
```

## service.server.ts

An `Effect.Service` definition file containing the main logic.

### Repository Service Example

```typescript
export class Service extends Effect.Service<Service>()('ProjectService', {
	effect: Effect.gen(function* () {
		const supabase = yield* Supabase.Service;
		const client = yield* supabase.getClient();
		const user = yield* supabase.getUser();

		return {
			/**
			 * Creates a new project for the authenticated user
			 */
			createProject: (payload: typeof ProjectInsertSchema.Encoded) =>
				// Implementation
		};
	})
}) {}
```

### Infrastructure Service Example

```typescript
export class Service extends Effect.Service<Service>()('infra/supabase', {
	effect: Effect.gen(function* () {
		const cookies = yield* Cookies.Service;
		const client = createServerClient(PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY, { cookies });

		return {
			/**
			 * Retrieves the Supabase client instance
			 */
			getClient: (): Effect.Effect<SupabaseClient<Database>> =>
				Effect.succeed(client),
		};
	})
}) {}
```

### Application Service Example

```typescript
export class Service extends Effect.Service<Service>()('app/SessionScheduling', {
	effect: Effect.gen(function* () {
		const focusSessions = yield* FocusSessions.Service;
		const supabase = yield* Supabase.Service;

		return {
			/**
			 * Creates a session with conflict checking
			 */
			createSessionWithConflictCheck: (params: typeof CreateSessionWithConflictCheckParamsSchema.Type) =>
				// Complex orchestration logic
		};
	})
}) {}
```

Comments are not added to the service itself, but are instead added to the interface methods.

Each interface method uses schema constants defined in `types.ts`:
- Parameters: `typeof Schema.Encoded`
- Return type: `Effect.Effect<typeof Schema.Type, ErrorTypes>`

## types.ts

Schema constant definitions using `effect/Schema`.

```typescript
import * as S from 'effect/Schema';

export const ProjectSchema = S.Struct({
	active: S.Boolean,
	created_at: S.DateTimeUtc,
	description: S.NullOr(S.String),
	id: S.String,
	name: S.String,
	owner_id: S.String,
	updated_at: S.DateTimeUtc
});

export const ProjectInsertSchema = S.Struct({
	active: S.optional(S.Boolean),
	created_at: S.optional(S.DateTimeUtc),
	description: S.NullishOr(S.String),
	id: S.optional(S.String),
	name: S.String,
	owner_id: S.String,
	updated_at: S.optional(S.DateTimeUtc)
});

export const ProjectUpdateSchema = S.Struct({
	active: S.optional(S.Boolean),
	created_at: S.optional(S.DateTimeUtc),
	description: S.NullishOr(S.String),
	id: S.optional(S.String),
	name: S.optional(S.String),
	owner_id: S.optional(S.String),
	updated_at: S.optional(S.DateTimeUtc)
});

export const ProjectQuerySchema = S.Struct({
	name_query: S.optional(S.String),
	active: S.optional(S.Boolean)
});
```

All types include their corresponding schemas. If there are RPC functions or views related to the service, appropriate schemas should be defined for all of them.

## __test__/schema.test.ts

A test to check if the automatically generated type definitions from Supabase and schema constants are correctly paired.

```typescript
import { describe, expect, it } from 'vitest';
import type { Tables, TablesInsert, TablesUpdate } from '$lib/shared/database.types';
import { ProjectInsertSchema, ProjectSchema, ProjectUpdateSchema } from '..';
import * as S from 'effect/Schema';
import type { Equal } from '$lib/shared/schema';

type Project = Tables<'projects'>;
type ProjectInsert = TablesInsert<'projects'>;
type ProjectUpdate = TablesUpdate<'projects'>;

describe('Schema of Project', () => {
	type ProjectSchemaEncoded = S.Schema.Encoded<typeof ProjectSchema>;

	it('Project and ProjectSchema should be compatible', () => {
		const match: Equal<Project, ProjectSchemaEncoded> = true;
		expect(match).toBe(true);
	});
});

describe('Schema of ProjectInsert', () => {
	type ProjectInsertSchemaEncoded = S.Schema.Encoded<typeof ProjectInsertSchema>;

	it('ProjectInsert and ProjectInsertSchema should be compatible', () => {
		const match: Equal<ProjectInsert, ProjectInsertSchemaEncoded> = true;
		expect(match).toBe(true);
	});
});

describe('Schema of ProjectUpdate', () => {
	type ProjectUpdateSchemaEncoded = S.Schema.Encoded<typeof ProjectUpdateSchema>;

	it('ProjectUpdate and ProjectUpdateSchema should be compatible', () => {
		const match: Equal<ProjectUpdate, ProjectUpdateSchemaEncoded> = true;
		expect(match).toBe(true);
	});
});
```

This test ensures type safety between database-generated types and application schemas.
