import * as Schema from 'effect/Schema';
import type { RequestHandler } from '@sveltejs/kit';
import { Effect, Layer, Console, Either } from 'effect';
import { error, json } from '@sveltejs/kit';
import { mapToAppError } from '$lib/shared/errors';
import { SessionTask } from '$lib/modules/index.server';

// 현재 활성 세션의 태스크 목록 조회
export const GET: RequestHandler = async ({ locals }) => {
	const programResources = Layer.provide(SessionTask.Service.Default, locals.supabase);
	const program = await Effect.gen(function* () {
		const sessionTaskService = yield* SessionTask.Service;
		const tasks = yield* sessionTaskService.getActiveSessionTasks();

		// 인코딩하여 클라이언트에 전송
		return yield* Effect.all(
			tasks.map((task) => Schema.encode(SessionTask.SessionTaskSchema)(task))
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
