import { Data } from 'effect';

/**
 * 세션 시간이 다른 세션과 충돌할 때 발생하는 에러
 */
export class TimeConflictError extends Data.TaggedError('TimeConflictError')<{
	start_at: string;
	end_at: string;
	conflicting_session_ids: string[];
	message?: string;
}> {
	constructor(params: {
		start_at: string;
		end_at: string;
		conflicting_session_ids: string[];
		message?: string;
	}) {
		super({
			start_at: params.start_at,
			end_at: params.end_at,
			conflicting_session_ids: params.conflicting_session_ids,
			message:
				params.message ??
				`${params.start_at} ~ ${params.end_at} 시간대에 ${params.conflicting_session_ids.length}개의 세션과 충돌이 발생합니다`
		});
	}
}

/**
 * 세션 시간이 유효하지 않을 때 발생하는 에러
 */
export class InvalidSessionTimeError extends Data.TaggedError('InvalidSessionTimeError')<{
	start_at: string;
	end_at: string;
	message?: string;
}> {
	constructor(params: { start_at: string; end_at: string; message?: string }) {
		super({
			start_at: params.start_at,
			end_at: params.end_at,
			message:
				params.message ??
				`세션 시간이 유효하지 않습니다. 시작: ${params.start_at}, 종료: ${params.end_at}`
		});
	}
}

/**
 * 사용 가능한 시간 슬롯을 찾을 수 없을 때 발생하는 에러
 */
export class NoAvailableTimeSlotError extends Data.TaggedError('NoAvailableTimeSlotError')<{
	date: string;
	duration_minutes: number;
	message?: string;
}> {
	constructor(params: { date: string; duration_minutes: number; message?: string }) {
		super({
			date: params.date,
			duration_minutes: params.duration_minutes,
			message:
				params.message ??
				`${params.date}에 ${params.duration_minutes}분 동안 사용 가능한 시간을 찾을 수 없습니다`
		});
	}
}
