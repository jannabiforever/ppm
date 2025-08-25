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
// import * as Project from '$lib/modules/project';
// 와 같이 할 것이기 때문에 해당 에러는
// Project.NotFound 와 같이 사용
export class NotFound extends Data.TaggedError("Project/NotFound") {
  ...
}
```
