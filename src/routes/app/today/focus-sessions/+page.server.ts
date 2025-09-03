import type { PageServerLoad } from './$types';
import { FocusSessionProjectLookup } from '$lib/applications/index.server';
import { Effect, DateTime, Console, Either, Layer } from 'effect';
import { error } from '@sveltejs/kit';
import { mapDomainError } from '$lib/shared/errors';
import { FocusSession, Project } from '$lib/modules/index.server';

export const load: PageServerLoad = async ({ locals }) => {
	const programResources = Layer.mergeAll(FocusSessionProjectLookup.Service.Default).pipe(
		Layer.provide(Layer.mergeAll(FocusSession.Service.Default, Project.Service.Default)),
		Layer.provide(locals.supabase)
	);

	const program = await Effect.gen(function* () {
		const focusSessionRepo = yield* FocusSessionProjectLookup.Service;
		const today = yield* DateTime.nowAsDate;
		return {
			todayFocusSessionProjectLookups:
				yield* focusSessionRepo.getFocusSessionProjectLookupsByDate(today)
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
		onRight: (data) => data
	});
};
