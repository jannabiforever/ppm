import { Data } from 'effect';

export class SessionExistsButAssociatedProjectNotFound extends Data.TaggedError(
	'app/SessionProjectLookup/SessionExistsButAssociatedProjectNotFound'
)<{
	sessionId: string;
	projectId: string;
}> {}

/**
 * 집중 세션 - 프로젝트 룩업 애플리케이션 관련 서비스
 */
export type Error = SessionExistsButAssociatedProjectNotFound;
