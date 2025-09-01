import type { RequestHandler } from './$types';
import { Effect, Layer, Schema, Console, Either, Option } from 'effect';
import { FocusSession } from '$lib/modules/index.server';
import { error, json } from '@sveltejs/kit';
import { mapToAppError } from '$lib/shared/errors';

export const GET: RequestHandler = async ({ locals }) => {
	const programResources = Layer.provide(FocusSession.Service.Default, locals.supabase);
	const program = await Effect.gen(function* () {
		const fsService = yield* FocusSession.Service;
		const sessionOption = yield* fsService.getActiveFocusSession();

		return yield* Option.match(sessionOption, {
			onNone: () => Effect.succeed(null),
			onSome: (session) => Schema.encode(FocusSession.FocusSessionSchema)(session)
		});
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
