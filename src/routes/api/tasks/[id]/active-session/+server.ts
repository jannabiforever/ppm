import type { RequestHandler } from '@sveltejs/kit';
import { Effect, Layer, Schema, Console, Either } from 'effect';
import { error, json } from '@sveltejs/kit';
import { mapToAppError } from '$lib/shared/errors';
import { SessionTask } from '$lib/modules/index.server';
import { IdParamsSchema } from '$lib/shared/params';

// 태스크가 활성 세션에 있는지 확인
export const GET: RequestHandler = async ({ locals, params }) => {
	const programResources = Layer.provide(SessionTask.Service.Default, locals.supabase);
	const program = await Effect.gen(function* () {
		// 파라미터 검증
		const { id: taskId } = yield* Schema.decodeUnknown(IdParamsSchema)(params);

		const sessionTaskService = yield* SessionTask.Service;
		const inActiveSession = yield* sessionTaskService.isTaskInActiveSession(taskId);

		return { inActiveSession };
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
