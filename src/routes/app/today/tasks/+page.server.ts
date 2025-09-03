import type { PageServerLoad } from './$types';
import { Effect, Console, Either, Layer } from 'effect';
import { error } from '@sveltejs/kit';
import { mapDomainError } from '$lib/shared/errors';
import { Task } from '$lib/modules/index.server';

export const load: PageServerLoad = async ({ locals }) => {
	const programResources = Layer.mergeAll(Task.Service.Default).pipe(
		Layer.provide(locals.supabase)
	);

	const program = await Effect.gen(function* () {
		const taskRepo = yield* Task.Service;
		return {
			todayTasks: yield* taskRepo.getTodayTasks()
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
