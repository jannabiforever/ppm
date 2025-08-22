import { Data } from 'effect';

/**
 * 사용자 프로필 관련 도메인 오류.
 * 모든 사용자는 프로필이 항상 있어야 함.
 */
export class AssociatedProfileNotFoundError extends Data.TaggedError('AssociatedProfileNotFound')<{
	readonly message: string;
	readonly userId: string;
}> {
	constructor(userId: string) {
		super({
			message: `다음 id의 사용자에 해당하는 프로필이 존재하지 않습니다: ${userId}`,
			userId
		});
	}
}
