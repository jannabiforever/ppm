import * as Project from '$lib/modules/projects/index.server';
import * as S from 'effect/Schema';
import type { RequestHandler } from '@sveltejs/kit';
import { Effect, Layer, Console, Either } from 'effect';
import { error, json } from '@sveltejs/kit';
import { mapToAppError } from '$lib/shared/errors';

export const POST: RequestHandler = async ({ locals, request }) => {
	const programResources = Layer.provide(Project.Service.Default, locals.supabase);
	const program = await Effect.gen(function* () {
		const json = yield* Effect.promise(() => request.json());

		// 검증 후 재 인코딩
		const payload: typeof Project.ProjectInsertSchema.Encoded = yield* S.decodeUnknown(
			Project.ProjectInsertSchema
		)({
			...json,
			owner_id: locals.user!.id
		}).pipe(Effect.flatMap(S.encode(Project.ProjectInsertSchema)));

		const projectService = yield* Project.Service;
		const id = yield* projectService.createProject(payload);

		return {
			id
		};
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

export const GET: RequestHandler = async ({ locals, url }) => {
	const programResources = Layer.provide(Project.Service.Default, locals.supabase);
	const program = await Effect.gen(function* () {
		// URL 쿼리 파라미터를 객체로 변환
		const queryParams: Record<string, string | string[]> = {};
		url.searchParams.forEach((value: string, key: string) => {
			if (queryParams[key]) {
				if (Array.isArray(queryParams[key])) {
					(queryParams[key] as string[]).push(value);
				} else {
					queryParams[key] = [queryParams[key] as string, value];
				}
			} else {
				queryParams[key] = value;
			}
		});

		// 쿼리 파라미터 검증 후 재인코딩
		const query = yield* S.decodeUnknown(Project.ProjectQuerySchema)(queryParams).pipe(
			Effect.flatMap(S.encode(Project.ProjectQuerySchema))
		);

		const projectService = yield* Project.Service;
		const projects = yield* projectService.getProjects(query);

		// 인코딩하여 클라이언트에 전송
		return yield* Effect.all(projects.map((project) => S.encode(Project.ProjectSchema)(project)));
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
