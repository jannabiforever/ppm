import * as SessionTask from '$lib/modules/session_tasks/index.server';
import * as S from 'effect/Schema';
import type { RequestHandler } from '@sveltejs/kit';
import { Effect, Layer, Console, Either } from 'effect';
import { error, json } from '@sveltejs/kit';
import { mapToAppError } from '$lib/shared/errors';
import { IdParamsSchema } from '$lib/shared/params';

const BulkTasksPayload = S.Struct({
	task_ids: S.Array(S.String)
});

// 여러 태스크를 한번에 추가
export const POST: RequestHandler = async ({ locals, params, request }) => {
	const programResources = Layer.provide(SessionTask.Service.Default, locals.supabase);
	const program = await Effect.gen(function* () {
		// 파라미터 검증
		const { id: sessionId } = yield* S.decodeUnknown(IdParamsSchema)(params);

		const json = yield* Effect.promise(() => request.json());
		const { task_ids } = yield* S.decodeUnknown(BulkTasksPayload)(json);

		const sessionTaskService = yield* SessionTask.Service;
		yield* sessionTaskService.addTasksToSession({
			session_id: sessionId,
			task_ids
		});

		return { success: true };
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
