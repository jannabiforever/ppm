import type { RequestHandler } from './$types';
import { Effect, Layer, Schema, Console, Either } from 'effect';
import { error, json } from '@sveltejs/kit';
import { mapToAppError } from '$lib/shared/errors';
import { IdParamsSchema } from '$lib/shared/params';
import { FocusSession } from '$lib/modules/index.server';

export const GET: RequestHandler = async ({ locals, params }) => {
	const programResources = Layer.provide(FocusSession.Service.Default, locals.supabase);
	const program = await Effect.gen(function* () {
		// 파라미터 검증
		const { id } = yield* Schema.decodeUnknown(IdParamsSchema)(params);

		const fsService = yield* FocusSession.Service;
		const session = yield* fsService.getFocusSessionById(id);

		// 인코딩하여 클라이언트에 전송
		return yield* Schema.encode(FocusSession.FocusSessionSchema)(session);
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
	const programResources = Layer.provide(FocusSession.Service.Default, locals.supabase);
	const program = await Effect.gen(function* () {
		// 파라미터 검증
		const { id } = yield* Schema.decodeUnknown(IdParamsSchema)(params);

		const json = yield* Effect.promise(() => request.json());

		// 검증 후 재 인코딩
		const payload: typeof FocusSession.FocusSessionUpdateSchema.Encoded =
			yield* Schema.decodeUnknown(FocusSession.FocusSessionUpdateSchema)(json).pipe(
				Effect.flatMap(Schema.encode(FocusSession.FocusSessionUpdateSchema))
			);

		const fsService = yield* FocusSession.Service;
		yield* fsService.updateFocusSession(id, payload);

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
	const programResources = Layer.provide(FocusSession.Service.Default, locals.supabase);
	const program = await Effect.gen(function* () {
		// 파라미터 검증
		const { id } = yield* Schema.decodeUnknown(IdParamsSchema)(params);

		const fsService = yield* FocusSession.Service;
		yield* fsService.deleteFocusSession(id);

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
