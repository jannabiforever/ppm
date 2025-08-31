import * as Task from '$lib/modules/tasks/index.server';
import * as S from 'effect/Schema';
import type { RequestHandler } from '@sveltejs/kit';
import { Effect, Layer, Console, Either } from 'effect';
import { error, json } from '@sveltejs/kit';
import { mapToAppError } from '$lib/shared/errors';

export const POST: RequestHandler = async ({ locals, request }) => {
	const programResources = Layer.provide(Task.Service.Default, locals.supabase);
	const program = await Effect.gen(function* () {
		const json = yield* Effect.promise(() => request.json());

		// 검증 후 재 인코딩
		const payload: typeof Task.TaskInsertSchema.Encoded = yield* S.decodeUnknown(
			Task.TaskInsertSchema
		)({
			...json,
			owner_id: locals.user!.id
		}).pipe(Effect.flatMap(S.encode(Task.TaskInsertSchema)));

		const taskService = yield* Task.Service;
		const id = yield* taskService.createTask(payload);

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
	const programResources = Layer.provide(Task.Service.Default, locals.supabase);
	const program = await Effect.gen(function* () {
		// URL 쿼리 파라미터를 객체로 변환
		const queryParams: Record<string, string | string[]> = {};
		url.searchParams.forEach((value, key) => {
			// status는 여러 개가 올 수 있으므로 배열로 처리
			if (key === 'status') {
				if (queryParams[key]) {
					if (Array.isArray(queryParams[key])) {
						(queryParams[key] as string[]).push(value);
					} else {
						queryParams[key] = [queryParams[key] as string, value];
					}
				} else {
					queryParams[key] = value;
				}
			} else {
				queryParams[key] = value;
			}
		});

		// 쿼리 파라미터 검증 후 재인코딩
		const query = yield* S.decodeUnknown(Task.TaskQuerySchema)(queryParams).pipe(
			Effect.flatMap(S.encode(Task.TaskQuerySchema))
		);

		const taskService = yield* Task.Service;
		const tasks = yield* taskService.getTasks(query);

		// 인코딩하여 클라이언트에 전송
		return yield* Effect.all(tasks.map((task) => S.encode(Task.TaskSchema)(task)));
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
