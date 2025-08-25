import { Data } from 'effect';

export class NotFound extends Data.TaggedError('Task/NotFound')<{
	readonly message: string;
	readonly taskId: string;
}> {
	constructor(taskId: string) {
		super({
			message: `태스크 ${taskId}를 찾을 수 없습니다.`,
			taskId
		});
	}
}
