import type { RequestHandler } from '@sveltejs/kit';
import { Effect, Layer, Console, Either, Schema } from 'effect';
import { error, json } from '@sveltejs/kit';
import { mapToAppError } from '$lib/shared/errors';
import { Project } from '$lib/modules/index.server';

export const GET: RequestHandler = async ({ locals }) => {
	const programResources = Layer.provide(Project.Service.Default, locals.supabase);
	const program = await Effect.gen(function* () {
		const projectService = yield* Project.Service;
		const projects = yield* projectService.getActiveProjects();

		// 인코딩하여 클라이언트에 전송
		return yield* Effect.all(
			projects.map((project) => Schema.encode(Project.ProjectSchema)(project))
		);
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
