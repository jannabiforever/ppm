import type { RequestHandler } from './$types';
import { Effect, Layer, Schema, Console, Either } from 'effect';
import { error, json } from '@sveltejs/kit';
import { mapToAppError } from '$lib/shared/errors';
import { FocusSession } from '$lib/modules/index.server';

export const POST: RequestHandler = async ({ locals, request }) => {
	const programResources = Layer.provide(FocusSession.Service.Default, locals.supabase);
	const program = await Effect.gen(function* () {
		const json = yield* Effect.promise(() => request.json());

		// 검증 후 재 인코딩
		const payload: typeof FocusSession.FocusSessionInsertSchema.Encoded =
			yield* Schema.decodeUnknown(FocusSession.FocusSessionInsertSchema)({
				...json,
				owner_id: locals.user.id
			}).pipe(Effect.flatMap(Schema.encode(FocusSession.FocusSessionInsertSchema)));

		const fsService = yield* FocusSession.Service;
		const id = yield* fsService.createFocusSession(payload);

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
	const programResources = Layer.provide(FocusSession.Service.Default, locals.supabase);
	const program = await Effect.gen(function* () {
		// URL 쿼리 파라미터를 객체로 변환
		const queryParams: Record<string, string | string[]> = {};
		url.searchParams.forEach((value, key) => {
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
		const query = yield* Schema.decodeUnknown(FocusSession.FocusSessionQuerySchema)(
			queryParams
		).pipe(Effect.flatMap(Schema.encode(FocusSession.FocusSessionQuerySchema)));

		const fsService = yield* FocusSession.Service;
		const sessions = yield* fsService.getFocusSessions(query);

		// 인코딩하여 클라이언트에 전송
		return yield* Effect.all(
			sessions.map((session) => Schema.encode(FocusSession.FocusSessionSchema)(session))
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
