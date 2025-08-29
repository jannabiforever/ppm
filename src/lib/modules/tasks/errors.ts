import { Data } from 'effect';

/**
 * 주어진 id에 대응되는 태스크가 조회되지 않았을 때 발생하는 에러
 */
export class NotFound extends Data.TaggedError('Task/NotFound')<{
	/**
	 * 조회 시도한 taskId
	 */
	readonly taskId: string;
}> {}

/**
 * 유효하지 않은 프로젝트에 태스크를 연결하려 할 때 발생하는 에러
 */
export class InvalidProject extends Data.TaggedError('Task/InvalidProject')<{
	/**
	 * 연결 시도했으나 발견되지 않은 projectId
	 */
	readonly projectId: string;
}> {}

/**
 * 유효하지 않은 세션에 태스크를 연결하려 할 때 발생하는 에러
 */
export class InvalidSession extends Data.TaggedError('Task/InvalidSession')<{
	/**
	 * 연결 시도했으나 발견되지 않은 sessionId
	 */
	readonly sessionId: string;
}> {}

/**
 * 태스크가 다른 리소스에서 참조되고 있어 삭제할 수 없을 때 발생하는 에러
 */
export class HasDependencies extends Data.TaggedError('Task/HasDependencies')<{
	/**
	 * 삭제 시도한 taskId
	 */
	readonly taskId: string;
}> {}

/**
 * 태스크 관련 에러
 */
export type Error = NotFound | InvalidProject | InvalidSession | HasDependencies;
