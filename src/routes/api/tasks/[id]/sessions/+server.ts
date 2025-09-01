import type { RequestHandler } from '@sveltejs/kit';
import { Effect, Layer, Schema, Console, Either } from 'effect';
import { error, json } from '@sveltejs/kit';
import { mapToAppError } from '$lib/shared/errors';
import { SessionTask } from '$lib/modules/index.server';
import { PaginationQuerySchema } from '$lib/shared/pagination';
import { IdParamsSchema } from '$lib/shared/params';

// 태스크가 속한 세션 목록 조회
export const GET: RequestHandler = async ({ locals, params, url }) => {
	const programResources = Layer.provide(SessionTask.Service.Default, locals.supabase);
	const program = await Effect.gen(function* () {
		// 파라미터 검증
		const { id: taskId } = yield* Schema.decodeUnknown(IdParamsSchema)(params);

		// 쿼리 파라미터 처리
		const queryParams: Record<string, string> = {};
		url.searchParams.forEach((value, key) => {
			queryParams[key] = value;
		});

		// 페이지네이션 파라미터 검증
		const pagination =
			Object.keys(queryParams).length > 0
				? yield* Schema.decodeUnknown(PaginationQuerySchema)(queryParams)
				: undefined;

		const sessionTaskService = yield* SessionTask.Service;
		const sessions = yield* sessionTaskService.getSessionsByTask(taskId, pagination);

		// 인코딩하여 클라이언트에 전송
		return yield* Effect.all(
			sessions.map((session) => Schema.encode(SessionTask.SessionTaskSchema)(session))
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
