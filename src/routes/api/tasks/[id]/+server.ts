import * as Task from '$lib/modules/tasks/index.server';
import * as S from 'effect/Schema';
import type { RequestHandler } from '@sveltejs/kit';
import { Effect, Layer, Console, Either } from 'effect';
import { error, json } from '@sveltejs/kit';
import { mapToAppError } from '$lib/shared/errors';
import { IdParamsSchema } from '$lib/shared/params';

export const GET: RequestHandler = async ({ locals, params }) => {
	const programResources = Layer.provide(Task.Service.Default, locals.supabase);
	const program = await Effect.gen(function* () {
		// 파라미터 검증
		const { id } = yield* S.decodeUnknown(IdParamsSchema)(params);

		const taskService = yield* Task.Service;
		const task = yield* taskService.getTaskById(id);

		// 인코딩하여 클라이언트에 전송
		return yield* S.encode(Task.TaskSchema)(task);
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

export const PATCH: RequestHandler = async ({ locals, params, request }) => {
	const programResources = Layer.provide(Task.Service.Default, locals.supabase);
	const program = await Effect.gen(function* () {
		// 파라미터 검증
		const { id } = yield* S.decodeUnknown(IdParamsSchema)(params);

		const json = yield* Effect.promise(() => request.json());

		// 검증 후 재 인코딩
		const payload: typeof Task.TaskUpdateSchema.Encoded = yield* S.decodeUnknown(
			Task.TaskUpdateSchema
		)(json).pipe(Effect.flatMap(S.encode(Task.TaskUpdateSchema)));

		const taskService = yield* Task.Service;
		yield* taskService.updateTask(id, payload);

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

export const DELETE: RequestHandler = async ({ locals, params }) => {
	const programResources = Layer.provide(Task.Service.Default, locals.supabase);
	const program = await Effect.gen(function* () {
		// 파라미터 검증
		const { id } = yield* S.decodeUnknown(IdParamsSchema)(params);

		const taskService = yield* Task.Service;
		yield* taskService.deleteTask(id);

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
