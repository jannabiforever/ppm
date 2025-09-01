import type { RequestHandler } from '@sveltejs/kit';
import { Effect, Schema, Layer, Console, Either, Option } from 'effect';
import { error, json } from '@sveltejs/kit';
import { mapToAppError } from '$lib/shared/errors';
import { SessionTask } from '$lib/modules/index.server';

const ParamsSchema = Schema.Struct({
	id: Schema.String,
	taskId: Schema.String
});

// 특정 세션-태스크 연결 조회
export const GET: RequestHandler = async ({ locals, params }) => {
	const programResources = Layer.provide(SessionTask.Service.Default, locals.supabase);
	const program = await Effect.gen(function* () {
		// 파라미터 검증
		const { id: sessionId, taskId } = yield* Schema.decodeUnknown(ParamsSchema)(params);

		const sessionTaskService = yield* SessionTask.Service;
		const sessionTaskOption = yield* sessionTaskService.getSessionTask({
			session_id: sessionId,
			task_id: taskId
		});

		if (Option.isNone(sessionTaskOption)) {
			return yield* Effect.fail(new SessionTask.TaskNotInSessionError({ taskId, sessionId }));
		}

		return yield* Schema.encode(SessionTask.SessionTaskSchema)(sessionTaskOption.value);
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

// 세션에서 특정 태스크 제거
export const DELETE: RequestHandler = async ({ locals, params }) => {
	const programResources = Layer.provide(SessionTask.Service.Default, locals.supabase);
	const program = await Effect.gen(function* () {
		// 파라미터 검증
		const { id: sessionId, taskId } = yield* Schema.decodeUnknown(ParamsSchema)(params);

		const sessionTaskService = yield* SessionTask.Service;
		yield* sessionTaskService.removeTaskFromSession({
			session_id: sessionId,
			task_id: taskId
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
