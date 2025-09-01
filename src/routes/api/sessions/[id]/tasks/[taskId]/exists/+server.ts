import type { RequestHandler } from '@sveltejs/kit';
import { Effect, Layer, Schema, Console, Either } from 'effect';
import { error, json } from '@sveltejs/kit';
import { mapToAppError } from '$lib/shared/errors';
import { SessionTask } from '$lib/modules/index.server';

const ParamsSchema = Schema.Struct({
	id: Schema.String,
	taskId: Schema.String
});

// 태스크가 세션에 있는지 확인
export const GET: RequestHandler = async ({ locals, params }) => {
	const programResources = Layer.provide(SessionTask.Service.Default, locals.supabase);
	const program = await Effect.gen(function* () {
		// 파라미터 검증
		const { id: sessionId, taskId } = yield* Schema.decodeUnknown(ParamsSchema)(params);

		const sessionTaskService = yield* SessionTask.Service;
		const exists = yield* sessionTaskService.isTaskInSession({
			session_id: sessionId,
			task_id: taskId
		});

		return { exists };
	}).pipe(
		Effect.provide(programResources),
		Effect.tapError(Console.error),
		Effect.mapError(mapToAppError),
		Effect.either,
		Effect.runPromise
	);

	return Either.match(program, {
		onLeft: (err) => error(err.status, err),
		onRight: (data) => json(data)
	});
};
