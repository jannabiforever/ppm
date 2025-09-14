# Error Naming

Do not include "Error" in class names that represent errors.
This is because we can distinguish them using Data.TaggedError.

```typescript
// Bad example
export class ProjectNotFoundError extends Data.TaggedError("ProjectNotFound") {
  ...
}

// Good example
// When importing this module from outside
// import * as Project from '$lib/modules/projects';
// this error will be used as
// Project.NotFound
export class NotFound extends Data.TaggedError("Project/NotFound") {
  ...
}
```

# Error Representation

Do not include any information related to representation methods (ex. http status code, error message) in error definitions.
However, exceptions are made when already implemented external APIs are being used.

This is because a single error class may support various contexts,
which often leads to the inclusion of error messages or status codes.

Error representation is defined in `$lib/shared/errors.ts`.
