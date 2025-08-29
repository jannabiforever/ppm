import { Data } from 'effect';

/**
 * 주어진 id에 대응되는 프로젝트가 조회되지 않았을 때 발생하는 에러
 */
export class NotFound extends Data.TaggedError('Project/NotFound')<{
	/**
	 * 조회 시도된 id
	 */
	projectId: string;
}> {}

/**
 * 프로젝트 이름이 이미 존재할 때 발생하는 에러
 */
export class NameAlreadyExists extends Data.TaggedError('Project/NameAlreadyExists')<{
	/**
	 * 충돌되는 이름
	 */
	name: string;
}> {}

/**
 * 프로젝트가 다른 리소스에서 참조되고 있어 삭제할 수 없을 때 발생하는 에러
 */
export class HasDependencies extends Data.TaggedError('Project/HasDependencies')<{
	/**
	 * 삭제 시도된 project id
	 */
	projectId: string;
}> {}

/**
 * 프로젝트 모듈 관련 에러
 */
export type Error = NotFound | NameAlreadyExists | HasDependencies;
