import { Data } from 'effect';

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
