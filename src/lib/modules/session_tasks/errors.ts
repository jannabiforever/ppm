import { Data } from 'effect';

// 도메인 에러 정의
export class TaskAlreadyInSessionError extends Data.TaggedError('TaskAlreadyInSession')<{
	task_id: string;
	session_id: string;
}> {}

export class TaskNotInSessionError extends Data.TaggedError('TaskNotInSession')<{
	task_id: string;
	session_id: string;
}> {}
