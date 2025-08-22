# 확인 없이 파일/폴더를 임의로 만들지 말 것.

일관성을 유지하기 위해, 모든 파일과 폴더가 적절하게 관리되고 추적되도록 해야 한다. 여기에는 통제된 방식으로 파일과 폴더를 생성, 업데이트, 삭제하는 것이 포함된다.
새로운 위치에 새 파일을 생성할 필요가 있을 때마다, 쉽게 찾고 지속 가능하게 관리할 수 있도록 해야 하므로 이러한 작업에는 새로운 **규칙**이 생성되어야 한다. 그 전에는 규칙을 따르지 않는 새 파일을 생성하지 않는다.

# Shared

모든 서비스에서 공통적으로 많이 활용되는 객체나 함수, 또는 테스트 헬퍼 함수들은 `src/lib/shared` 폴더에 위치시키면 된다.

# 모듈

인프라와 직접적인 상호작용을 하는 모듈은, 'src/lib/modules' 폴더에 위치한다.
예를 들어 supabase api를 직접 호출하는 리포지토리 패턴 서비스나,
redis, aws s3 등등 외부 모듈을 사용하는 것들이 위치하면 된다.

# 애플리케이션

모듈(외부 api를 사용하는 서비스들)을 다시 활용하여 유스 케이스를 구현하는 서비스들의 경우, 'src/lib/applications' 폴더에 위치한다.
예를 들어 supabase api를 호출하여 s3에 파일을 업로드 하는 서비스를 정의하려는 경우, 'src/lib/applications/some-use-case'와 같은 서비스 정의 폴더를 생성하여 작업하면 된다.

# 서비스 정의 폴더 규칙

임의의 서비스를 정의하는 폴더는 다음과 같이 구성한다.

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
