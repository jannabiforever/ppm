import type { RequestHandler } from '@sveltejs/kit';
import { Effect, Layer, Console, Either, Schema } from 'effect';
import { error, json } from '@sveltejs/kit';
import { mapToAppError } from '$lib/shared/errors';
import { Project } from '$lib/modules/index.server';
import { IdParamsSchema } from '$lib/shared/params';

export const GET: RequestHandler = async ({ locals, params }) => {
	const programResources = Layer.provide(Project.Service.Default, locals.supabase);
	const program = await Effect.gen(function* () {
		// 파라미터 검증
		const { id } = yield* Schema.decodeUnknown(IdParamsSchema)(params);

		const projectService = yield* Project.Service;
		const project = yield* projectService.getProjectById(id);

		// 인코딩하여 클라이언트에 전송
		return yield* Schema.encode(Project.ProjectSchema)(project);
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
	const programResources = Layer.provide(Project.Service.Default, locals.supabase);
	const program = await Effect.gen(function* () {
		// 파라미터 검증
		const { id } = yield* Schema.decodeUnknown(IdParamsSchema)(params);

		const json = yield* Effect.promise(() => request.json());

		// 검증 후 재 인코딩
		const payload: typeof Project.ProjectUpdateSchema.Encoded = yield* Schema.decodeUnknown(
			Project.ProjectUpdateSchema
		)(json).pipe(Effect.flatMap(Schema.encode(Project.ProjectUpdateSchema)));

		const projectService = yield* Project.Service;
		yield* projectService.updateProject(id, payload);

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
	const programResources = Layer.provide(Project.Service.Default, locals.supabase);
	const program = await Effect.gen(function* () {
		// 파라미터 검증
		const { id } = yield* Schema.decodeUnknown(IdParamsSchema)(params);

		const projectService = yield* Project.Service;
		yield* projectService.deleteProject(id);

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
