import { Effect, Either, Layer } from 'effect';
import type { PageServerLoad } from './$types';
import { Task } from '$lib/modules/index.server';
import { mapDomainError } from '$lib/shared/errors';
import { error } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ locals }) => {
	const programResources = Layer.provide(Task.Service.Default, locals.supabase);
	const program = await Effect.gen(function* () {
		const s = yield* Task.Service;
		return {
			inboxTasks: yield* s.getTasks({ project_id: null })
		};
	}).pipe(
		Effect.provide(programResources),
		Effect.mapError(mapDomainError),
		Effect.either,
		Effect.runPromise
	);

	return Either.match(program, {
		onLeft: (err) => error(err.status, err),
		onRight: (data) => data
	});
};
