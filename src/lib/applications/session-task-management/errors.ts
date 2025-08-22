import { Data } from 'effect';

/**
 * 활성 상태가 아닌 세션에 태스크를 추가하려고 할 때 발생하는 에러
 */
export class SessionNotActiveError extends Data.TaggedError('SessionNotActiveError')<{
	session_id: string;
	message?: string;
}> {
	constructor(params: { session_id: string; message?: string }) {
		super({
			session_id: params.session_id,
			message: params.message ?? `세션 ${params.session_id}이(가) 활성 상태가 아닙니다`
		});
	}
}

/**
 * 이미 세션에 존재하는 태스크를 다시 추가하려고 할 때 발생하는 에러
 */
export class TaskAlreadyInSessionError extends Data.TaggedError('TaskAlreadyInSessionError')<{
	task_id: string;
	session_id: string;
	message?: string;
}> {
	constructor(params: { task_id: string; session_id: string; message?: string }) {
		super({
			task_id: params.task_id,
			session_id: params.session_id,
			message:
				params.message ??
				`태스크 ${params.task_id}이(가) 이미 세션 ${params.session_id}에 존재합니다`
		});
	}
}

/**
 * 세션에 존재하지 않는 태스크를 제거하려고 할 때 발생하는 에러
 */
export class TaskNotInSessionError extends Data.TaggedError('TaskNotInSessionError')<{
	task_id: string;
	session_id: string;
	message?: string;
}> {
	constructor(params: { task_id: string; session_id: string; message?: string }) {
		super({
			task_id: params.task_id,
			session_id: params.session_id,
			message:
				params.message ??
				`태스크 ${params.task_id}이(가) 세션 ${params.session_id}에 존재하지 않습니다`
		});
	}
}
