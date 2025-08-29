import { Data } from 'effect';

export class TaskAlreadyInSessionError extends Data.TaggedError('TaskAlreadyInSession')<{
	taskId: string;
	sessionId: string;
}> {}

export class TaskNotInSessionError extends Data.TaggedError('TaskNotInSession')<{
	taskId: string;
	sessionId: string;
}> {}

/**
 * 집중세션-태스크 관계 관련 에러
 */
export type Error = TaskAlreadyInSessionError | TaskNotInSessionError;
