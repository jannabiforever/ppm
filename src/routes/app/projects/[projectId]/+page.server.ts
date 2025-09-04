import { Effect, Either, Layer } from 'effect';
import type { PageServerLoad } from './$types';
import { Project, Task } from '$lib/modules/index.server';
import { mapDomainError } from '$lib/shared/errors';
import { error } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ locals, params }) => {
	const programResources = Layer.provide(
		Layer.merge(Task.Service.Default, Project.Service.Default),
		locals.supabase
	);
	const program = await Effect.gen(function* () {
		const tService = yield* Task.Service;
		const pService = yield* Project.Service;
		return {
			tasks: yield* tService.getTasks({ project_id: params.projectId }),
			project: yield* pService.getProjectById(params.projectId)
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
