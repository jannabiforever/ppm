import { Data } from 'effect';

/**
 * 주어진 id에 대응되는 프로젝트가 조회되지 않았을 때 발생하는 에러
 */
export class NotFound extends Data.TaggedError('Project/NotFound')<{
	message: string;
}> {
	constructor(projectId: string) {
		super({ message: `다음 아이디를 가진 프로젝트를 찾을 수 없습니다: ${projectId}` });
	}
}

/**
 * 프로젝트 이름이 이미 존재할 때 발생하는 에러
 */
export class NameAlreadyExists extends Data.TaggedError('Project/NameAlreadyExists')<{
	message: string;
}> {
	constructor(name: string) {
		super({ message: `다음 이름을 가진 프로젝트가 이미 존재합니다: ${name}` });
	}
}

/**
 * 유효하지 않은 소유자로 프로젝트를 생성하려 할 때 발생하는 에러
 */
export class InvalidOwner extends Data.TaggedError('Project/InvalidOwner')<{
	message: string;
}> {
	constructor(ownerId: string) {
		super({ message: `유효하지 않은 소유자 ID입니다: ${ownerId}` });
	}
}

/**
 * 프로젝트가 다른 리소스에서 참조되고 있어 삭제할 수 없을 때 발생하는 에러
 */
export class HasDependencies extends Data.TaggedError('Project/HasDependencies')<{
	message: string;
}> {
	constructor(projectId: string) {
		super({ message: `프로젝트 ${projectId}가 다른 리소스에서 사용 중이므로 삭제할 수 없습니다` });
	}
}
