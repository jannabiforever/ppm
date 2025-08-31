import * as Task from '$lib/modules/tasks/index.server';
import * as S from 'effect/Schema';
import type { RequestHandler } from '@sveltejs/kit';
import { Effect, Layer, Console, Either } from 'effect';
import { error, json } from '@sveltejs/kit';
import { mapToAppError } from '$lib/shared/errors';

export const GET: RequestHandler = async ({ locals }) => {
	const programResources = Layer.provide(Task.Service.Default, locals.supabase);
	const program = await Effect.gen(function* () {
		const taskService = yield* Task.Service;
		// 모든 태스크를 조회한 후 프로젝트가 없는 것만 필터링
		const allTasks = yield* taskService.getTasks({});
		const inboxTasks = allTasks.filter((task) => task.project_id === null);

		// 인코딩하여 클라이언트에 전송
		return yield* Effect.all(inboxTasks.map((task) => S.encode(Task.TaskSchema)(task)));
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
