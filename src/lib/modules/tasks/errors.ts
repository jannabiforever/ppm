import { Data } from 'effect';

/**
 * 주어진 id에 대응되는 태스크가 조회되지 않았을 때 발생하는 에러
 */
export class NotFound extends Data.TaggedError('Task/NotFound')<{
	readonly message: string;
	readonly taskId: string;
}> {
	constructor(taskId: string) {
		super({
			message: `태스크 ${taskId}를 찾을 수 없습니다.`,
			taskId
		});
	}
}

/**
 * 유효하지 않은 프로젝트에 태스크를 연결하려 할 때 발생하는 에러
 */
export class InvalidProject extends Data.TaggedError('Task/InvalidProject')<{
	message: string;
}> {
	constructor(projectId: string) {
		super({ message: `유효하지 않은 프로젝트 ID입니다: ${projectId}` });
	}
}

/**
 * 유효하지 않은 세션에 태스크를 연결하려 할 때 발생하는 에러
 */
export class InvalidSession extends Data.TaggedError('Task/InvalidSession')<{
	message: string;
}> {
	constructor(sessionId: string) {
		super({ message: `유효하지 않은 세션 ID입니다: ${sessionId}` });
	}
}

/**
 * 유효하지 않은 소유자로 태스크를 생성하려 할 때 발생하는 에러
 */
export class InvalidOwner extends Data.TaggedError('Task/InvalidOwner')<{
	message: string;
}> {
	constructor(ownerId: string) {
		super({ message: `유효하지 않은 소유자 ID입니다: ${ownerId}` });
	}
}

/**
 * 태스크가 다른 리소스에서 참조되고 있어 삭제할 수 없을 때 발생하는 에러
 */
export class HasDependencies extends Data.TaggedError('Task/HasDependencies')<{
	message: string;
}> {
	constructor(taskId: string) {
		super({ message: `태스크 ${taskId}가 다른 리소스에서 사용 중이므로 삭제할 수 없습니다` });
	}
}
