import { Data } from 'effect';

/**
 * 사용자 프로필 관련 도메인 오류.
 * 모든 사용자는 프로필이 항상 있어야 함.
 */
export class AssociatedProfileNotFound extends Data.TaggedError('AssociatedProfileNotFound')<{
	readonly userId: string;
}> {}

/**
 * 사용자 프로필 관련 에러
 */
export type Error = AssociatedProfileNotFound;
