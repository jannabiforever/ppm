import * as FocusSession from '$lib/modules/focus_sessions/index.server';
import * as S from 'effect/Schema';
import type { RequestHandler } from './$types';
import { Effect, Layer, Console, Either } from 'effect';
import { error, json } from '@sveltejs/kit';
import { mapDomainError } from '$lib/shared/errors';

export const POST: RequestHandler = async ({ locals, request }) => {
	const programResources = Layer.provide(FocusSession.Service.Default, locals.supabase);
	const program = await Effect.gen(function* () {
		const formData = yield* Effect.promise(() => request.formData());

		// 검증 후 재 인코딩
		const payload: typeof FocusSession.FocusSessionInsertSchema.Encoded = yield* S.decodeUnknown(
			FocusSession.FocusSessionInsertSchema
		)({
			...Object.fromEntries(formData.entries()),
			owner_id: locals.user.id
		}).pipe(Effect.flatMap(S.encode(FocusSession.FocusSessionInsertSchema)));

		const fsService = yield* FocusSession.Service;
		const id = yield* fsService.createFocusSession(payload);

		return {
			id
		};
	}).pipe(
		Effect.provide(programResources),
		Effect.tapError(Console.error),
		Effect.mapError(mapDomainError),
		Effect.either,
		Effect.runPromise
	);

	return Either.match(program, {
		onLeft: (err) => error(err.status, err),
		onRight: (data) => json(data)
	});
};
