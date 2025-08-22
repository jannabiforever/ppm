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
