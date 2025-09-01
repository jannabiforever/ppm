import type { RequestHandler } from '@sveltejs/kit';
import { Effect, Layer, Console, Either, Schema } from 'effect';
import { error, json } from '@sveltejs/kit';
import { mapToAppError } from '$lib/shared/errors';
import { IdParamsSchema } from '$lib/shared/params';
import { Task } from '$lib/modules/index.server';

export const GET: RequestHandler = async ({ locals, params }) => {
	const programResources = Layer.provide(Task.Service.Default, locals.supabase);
	const program = await Effect.gen(function* () {
		// 파라미터 검증
		const { id: projectId } = yield* Schema.decodeUnknown(IdParamsSchema)(params);

		const taskService = yield* Task.Service;
		const tasks = yield* taskService.getTasks({
			project_id: projectId
		});

		// 인코딩하여 클라이언트에 전송
		return yield* Effect.all(tasks.map((task) => Schema.encode(Task.TaskSchema)(task)));
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
