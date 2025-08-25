import { Data } from 'effect';

export class SessionExistsButAssociatedProjectNotFound extends Data.TaggedError(
	'SessionExistsButAssociatedProjectNotFound'
)<{
	message: string;
	sessionId: string;
	projectId: string;
}> {
	constructor(sessionId: string, projectId: string) {
		super({
			message: `세션 ${sessionId}이 존재하지만 연관된 프로젝트 ${projectId}를 찾을 수 없습니다.`,
			sessionId,
			projectId
		});
	}
}
