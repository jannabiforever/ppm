import * as SessionTask from '$lib/modules/session_tasks/index.server';
import * as S from 'effect/Schema';
import type { RequestHandler } from '@sveltejs/kit';
import { Effect, Layer, Console, Either } from 'effect';
import { error, json } from '@sveltejs/kit';
import { mapToAppError } from '$lib/shared/errors';
import { IdParamsSchema } from '$lib/shared/params';
import { PaginationQuerySchema } from '$lib/shared/pagination';

// 세션의 태스크 목록 조회
export const GET: RequestHandler = async ({ locals, params, url }) => {
	const programResources = Layer.provide(SessionTask.Service.Default, locals.supabase);
	const program = await Effect.gen(function* () {
		// 파라미터 검증
		const { id: sessionId } = yield* S.decodeUnknown(IdParamsSchema)(params);

		// 쿼리 파라미터 처리
		const queryParams: Record<string, string> = {};
		url.searchParams.forEach((value, key) => {
			queryParams[key] = value;
		});

		// 페이지네이션 파라미터 검증
		const pagination =
			Object.keys(queryParams).length > 0
				? yield* S.decodeUnknown(PaginationQuerySchema)(queryParams)
				: undefined;

		const sessionTaskService = yield* SessionTask.Service;
		const tasks = yield* sessionTaskService.getTasksBySession(sessionId, pagination);

		// 인코딩하여 클라이언트에 전송
		return yield* Effect.all(tasks.map((task) => S.encode(SessionTask.SessionTaskSchema)(task)));
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

// 세션에 태스크 추가
export const POST: RequestHandler = async ({ locals, params, request }) => {
	const programResources = Layer.provide(SessionTask.Service.Default, locals.supabase);
	const program = await Effect.gen(function* () {
		// 파라미터 검증
		const { id: sessionId } = yield* S.decodeUnknown(IdParamsSchema)(params);

		const json = yield* Effect.promise(() => request.json());
		const { task_id } = yield* S.decodeUnknown(S.Struct({ task_id: S.String }))(json);

		const sessionTaskService = yield* SessionTask.Service;
		yield* sessionTaskService.addTaskToSession({
			session_id: sessionId,
			task_id
		});

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

// 세션의 모든 태스크 제거
export const DELETE: RequestHandler = async ({ locals, params }) => {
	const programResources = Layer.provide(SessionTask.Service.Default, locals.supabase);
	const program = await Effect.gen(function* () {
		// 파라미터 검증
		const { id: sessionId } = yield* S.decodeUnknown(IdParamsSchema)(params);

		const sessionTaskService = yield* SessionTask.Service;
		yield* sessionTaskService.clearSessionTasks(sessionId);

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
