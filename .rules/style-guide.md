# `Effect.ts` 시스템의 스타일 가이드

## 임포트

effect의 하위 시스템(예: `Option`, `Schema` 등)을 `effect`에서 직접 임포트하지 말 것.
다음과 같이 하위 시스템을 임포트해 사용:

```typescript
import * as Option from 'effect/Option';
import * as Schema from 'effect/Schema';
```

마찬가지로, 서비스와 관련된 커스텀 구현 모듈을 임포트 할 때에도 비슷한 방식으로 임포트:

```typescript
import * as Cache from 'effect/Service';

const program = Effect.gen(function* () {
  const cache = yield* Cache.Service;
  return yield* cache.lookup('key')
}).pipe(
  Effect.provide(Cache.Service.Default),
  Effect.runPromise
)
```

## 서비스

서비스를 정의하는 데에는 두 가지 방법이 있음:

1. `Effect.Service`:

```typescript
// cache.ts
import { FileSystem } from "@effect/platform"
import { NodeFileSystem } from "@effect/platform-node"
import { Effect } from "effect"

// 캐시 서비스 정의
class Service extends Effect.Service<Service>()("Cache", {
  // 서비스 생성 방법 정의
  effect: Effect.gen(function* () {
    const fs = yield* FileSystem.FileSystem
    const lookup = (key: string) => fs.readFileString(`cache/${key}`)
    return { lookup } as const
  }),
  // 의존성 지정
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

// 캐시 서비스 정의
class Service extends Context.Tag("Cache")<Service, {
  readonly lookup: (key: string) => Effect<string, Error, string>
}) {}
```

서비스가 디폴트 구현이 있는 경우엔 `Effect.Service`를 사용하고,
그렇지 않은 경우엔 `Context.Tag`를 사용.

## 명명 규칙

### 레이어

애플리케이션 레이어의 이름은 `Live`로 끝나야 함.
```typescript
// 애플리케이션 코드에서 사용되는 기본 `CacheService` 레이어
export const CacheLive = Layer.succeed(...)
```

테스트 레이어의 이름은 `Test`로 끝나야 함.
```typescript
// 테스트 코드에서 사용되는 기본 `CacheService` 레이어
export const CacheTest = Layer.succeed(...)
```

모든 서비스는 한 파일에 하나씩만 정의되고, 각 서비스의 이름은 `Service`로 고정.
후에 임포트 할 시에는 `import * as Some from './some'`과 같이 임포트 후 `Some.Service`로 사용.

Layer를 만드는 함수는 'make'으로 이름을 고정해서 사용할 것.
