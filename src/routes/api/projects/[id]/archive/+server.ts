import type { RequestHandler } from '@sveltejs/kit';
import { Effect, Layer, Schema, Console, Either } from 'effect';
import { error, json } from '@sveltejs/kit';
import { mapToAppError } from '$lib/shared/errors';
import { IdParamsSchema } from '$lib/shared/params';
import { Project } from '$lib/modules/index.server';

export const POST: RequestHandler = async ({ locals, params }) => {
	const programResources = Layer.provide(Project.Service.Default, locals.supabase);
	const program = await Effect.gen(function* () {
		// 파라미터 검증
		const { id } = yield* Schema.decodeUnknown(IdParamsSchema)(params);

		const projectService = yield* Project.Service;
		yield* projectService.archiveProject(id);
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
