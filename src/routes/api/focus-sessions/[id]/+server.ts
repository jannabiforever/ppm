import * as FocusSession from '$lib/modules/focus_sessions/index.server';
import * as S from 'effect/Schema';
import type { RequestHandler } from './$types';
import { Effect, Layer, Console, Either } from 'effect';
import { error, json } from '@sveltejs/kit';
import { mapToAppError } from '$lib/shared/errors';

export const GET: RequestHandler = async ({ locals, params }) => {
	const programResources = Layer.provide(FocusSession.Service.Default, locals.supabase);
	const program = await Effect.gen(function* () {
		const fsService = yield* FocusSession.Service;
		const session = yield* fsService.getFocusSessionById(params.id);

		// 인코딩하여 클라이언트에 전송
		return yield* S.encode(FocusSession.FocusSessionSchema)(session);
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
		const json = yield* Effect.promise(() => request.json());

		// 검증 후 재 인코딩
		const payload: typeof FocusSession.FocusSessionUpdateSchema.Encoded = yield* S.decodeUnknown(
			FocusSession.FocusSessionUpdateSchema
		)(json).pipe(Effect.flatMap(S.encode(FocusSession.FocusSessionUpdateSchema)));

		const fsService = yield* FocusSession.Service;
		yield* fsService.updateFocusSession(params.id, payload);

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
		const fsService = yield* FocusSession.Service;
		yield* fsService.deleteFocusSession(params.id);

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
