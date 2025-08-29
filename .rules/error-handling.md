# 에러 명명

에러를 표현하는 클래스 이름에는 Error를 넣지 않을 것.
어차피 Data.TaggedError를 사용해 구분할 수 있기 때문.

```typescript
// 잘못된 예시
export class ProjectNotFoundError extends Data.TaggedError("ProjectNotFound") {
  ...
}

// 좋은 예시
// 외부에서 해당 모듈 임포트시
// import * as Project from '$lib/modules/projects';
// 와 같이 할 것이기 때문에 해당 에러는
// Project.NotFound 와 같이 사용
export class NotFound extends Data.TaggedError("Project/NotFound") {
  ...
}
```

# 에러 표현

에러의 정의에는 표현 방법과 관련된 어떤 정보도 넣지 않는다. (ex. http status code, error message)
단, 이미 구현된 외부 api가 사용되는 경우는 예외로 한다.

이들은 하나의 에러 클래스가 다양한 컨텍스트를 지원하기 때문이므로,
에러 메시지나 status code가 들어가는 경우가 많기 때문이다.

에러의 표현은, `$lib/shared/errors.ts`에 정의되어 있다.
