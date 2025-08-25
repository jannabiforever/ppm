import { Data } from 'effect';

/**
 * 주어진 id에 대응되는 프로젝트가 조회되지 않았을 때 발생하는 에러.
 */
export class NotFound extends Data.TaggedError('Project/NotFound')<{
	message: string;
}> {
	constructor(projectId: string) {
		super({ message: `다음 아이디를 가진 프로젝트를 찾을 수 없습니다: ${projectId}` });
	}
}
