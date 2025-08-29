import { Data } from 'effect';

/**
 * 사용 가능한 시간 슬롯을 찾을 수 없을 때 발생하는 에러
 */
export class NoAvailableTimeSlot extends Data.TaggedError('NoAvailableTimeSlot')<{
	date: string;
	duration_minutes: number;
}> {}

/**
 * 세션 스케쥴링 애플리케이션 관련 에러
 */
export type Error = NoAvailableTimeSlot;
