# 확인 없이 파일/폴더를 임의로 만들지 말 것.

일관성을 유지하기 위해, 모든 파일과 폴더가 적절하게 관리되고 추적되도록 해야 한다. 여기에는 통제된 방식으로 파일과 폴더를 생성, 업데이트, 삭제하는 것이 포함된다.
새로운 위치에 새 파일을 생성할 필요가 있을 때마다, 쉽게 찾고 지속 가능하게 관리할 수 있도록 해야 하므로 이러한 작업에는 새로운 **규칙**이 생성되어야 한다. 그 전에는 규칙을 따르지 않는 새 파일을 생성하지 않는다.

# 모듈

주요 로직을 포함하는 `Effect.Service` 정의 파일들은 `lib/modules`에 위치함.
모듈 폴더는 기본적으로 다음과 같은 구조를 가짐.

```
src/lib/modules/focus_sessions
├── __test__
│   └── schema.test.ts
├── index.ts
├── service.server.ts
└── types.ts
```

## index.ts

단순한 export 문을 포함하는 파일

## service.server.ts

주요 로직을 포함하는 `Effect.Service` 정의 파일.
모든 서비스의 이름은 `Service`이고, 태그를 다르게 함으로써 구분함.

서비스 자체에는 주석을 달 필요는 없고, 대신 인터페이스들에 주석을 달아 사용한다.

```typescript
export class Service extends Effect.Service<Service>()('ProjectService', {
	effect: Effect.gen(function* () {
	...
	})
}) {};
```

## types.ts

타입 정의 파일. Supabase database 타입에서 특정 부분을 포함한 타입과,
해당 타입을 표현하는 스키마 상수 정의를 포함함. (`effect/Schema` 활용)

아래 예시와 같이 구성. 모든 타입은 그에 대응되는 스키마를 포함함.
만약 해당 서비스와 관련된 rpc 함수나, 뷰가 있다면 그에 맞는 타입 정의와 스키마가 모두 정의되어야 함.

```typescript
import type { Tables, TablesInsert, TablesUpdate } from '$lib/shared/database.types';
import * as S from 'effect/Schema';

export type Project = Tables<'projects'>;
export const ProjectSchema = S.Struct({
	active: S.Boolean,
	created_at: S.DateTimeUtc,
	description: S.NullOr(S.String),
	id: S.String,
	name: S.String,
	owner_id: S.String,
	updated_at: S.DateTimeUtc
});

export type ProjectInsert = TablesInsert<'projects'>;
export const ProjectInsertSchema = S.Struct({
	active: S.optional(S.Boolean),
	created_at: S.optional(S.DateTimeUtc),
	description: S.NullishOr(S.String),
	id: S.optional(S.String),
	name: S.String,
	owner_id: S.String,
	updated_at: S.optional(S.DateTimeUtc)
});

export type ProjectUpdate = TablesUpdate<'projects'>;
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
````

## __test__/schema.test.ts

supabase에서 자동으로 생성한 타입 정의와, 스키마 상수가 올바르게 짝 지어서 구성된 건지 확인하는 테스트.
`lib/shared/scheam/index.ts`에 정의되어 있는 `Equal` 헬퍼 타입을 사용해서 구성함:

```typescript
import { describe, expect, it } from 'vitest';
import {
	ProjectInsertSchema,
	ProjectSchema,
	ProjectUpdateSchema,
	type Project,
	type ProjectInsert,
	type ProjectUpdate
} from '..';
import * as S from 'effect/Schema';
import type { Equal } from '$lib/shared/schema';

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
