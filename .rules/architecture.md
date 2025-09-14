# Do not create files/folders arbitrarily without confirmation.

To maintain consistency, all files and folders must be properly managed and tracked. This includes creating, updating, and deleting files and folders in a controlled manner.
Whenever there is a need to create new files in new locations, new **rules** must be established to ensure they can be easily found and sustainably managed. Before that, do not create new files that do not follow the rules.

# stores

At the client level, store objects that are created and used globally should be placed in the `src/lib/stores` folder.

# Shared

Objects, functions, or test helper functions that are commonly used across all services should be placed in the `src/lib/shared` folder.

# Modules

Modules that directly interact with infrastructure are located in the 'src/lib/modules' folder.

For example, repository pattern services that directly call the Supabase API,
or services that use external modules like Redis, AWS S3, etc. should be placed here.

# Applications

Services that implement use cases by utilizing modules (services that use external APIs) should be placed in the 'src/lib/applications' folder.
For example, if you want to define a service that calls the Supabase API to upload files to S3, you should create a service definition folder like 'src/lib/applications/some-use-case'.

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

- **Module (Repository/Adapter)**
		- Interface between infrastructure ↔ domain
		- Interprets DB errors and converts them to domain invariant errors
		- Unaware of cross-policy or transactions

- **Application (UseCase)**
		- Applies cross-entity rules
		- Combines multiple modules and manages transaction boundaries
		- Remaps module errors to its own use case errors

### Conclusion

- **Module = Invariant/Contract Layer**, **Application = Policy/Orchestration Layer**
- Interpreting DB constraints in modules is inevitable, but this is **domain invariant naming** not business logic infiltration
- Cross-policies, transactions, and workflows must be managed at the application layer

# Service Definition Folder Rules

A folder defining an arbitrary service should be structured as follows:

```
src/lib/modules/focus_sessions
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

## index.server.ts

A file containing server-only exports. It exports server-only files such as service.server.ts.

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

## service.server.ts

An `Effect.Service` definition file containing the main logic.
All services are named `Service` and are distinguished by different tags.

Comments are not added to the service itself, but are instead added to the interfaces.

```typescript
export class Service extends Effect.Service<Service>()('ProjectService', {
	effect: Effect.gen(function* () {
	...
	})
}) {};
```

Each interface method basically uses schema constants defined in `types.ts`,
with parameters being `typeof Schema.Encode` and the success type of the returned Effect being `typeof Schema.Type`.

```typescript
/**
	* Retrieves a list of tasks matching the conditions
	*/
getTasks: (
	query: typeof TaskQuerySchema.Encoded
): Effect.Effect<Array<typeof TaskSchema.Type>, Supabase.PostgrestError> => {};
```

## types.ts

Schema constant definitions. (Using `effect/Schema`)

Structured as in the example below. All types include their corresponding schemas.
If there are RPC functions or views related to the service, appropriate schemas should be defined for all of them.

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
	status: S.optional(S.Boolean)
});
```

## **test**/schema.test.ts

A test to check if the automatically generated type definitions from Supabase and schema constants are correctly paired.
It uses the type definitions generated by Supabase defined in `lib/shared/database.types.ts` and
the `Equal` helper type defined in `lib/shared/schema/index.ts`:

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
