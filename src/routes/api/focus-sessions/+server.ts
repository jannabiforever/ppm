import * as Console from 'effect/Console';
import * as Either from 'effect/Either';
import * as FS from '$lib/modules/focus_sessions/index.server';
import * as S from 'effect/Schema';
import type { RequestHandler } from './$types';
import { Effect } from 'effect';
import { StatusCodes } from 'http-status-codes';
import { error, json } from '@sveltejs/kit';

export const POST: RequestHandler = async ({ locals, request }) => {
	const result = await Effect.gen(function* () {
		const formData = yield* Effect.promise(() => request.formData());

		// 검증 후 재 인코딩
		const payload: typeof FS.FocusSessionInsertSchema.Encoded = yield* S.decodeUnknown(
			FS.FocusSessionInsertSchema
		)({
			...Object.fromEntries(formData.entries()),
			owner_id: locals.user.id
		}).pipe(Effect.flatMap(S.encode(FS.FocusSessionInsertSchema)));

		const fsService = yield* FS.Service;
		const id = yield* fsService.createFocusSession(payload);

		return {
			id
		};
	}).pipe(
		Effect.provide(FS.Service.Default),
		Effect.provide(locals.supabase),
		Effect.tapError(Console.error),
		Effect.either,
		Effect.runPromise
	);

	return Either.match(result, {
		onLeft: (err) => {
			Console.error(err);
			switch (err._tag) {
				case 'SupabasePostgrest':
					return error(err.status, { _tag: err._tag, message: err.message });
				case 'SupabaseAuth':
					return error(StatusCodes.UNAUTHORIZED, { _tag: err._tag, message: err.message });
				case 'NoSessionOrUser':
					return error(StatusCodes.UNAUTHORIZED, { _tag: err._tag, message: err.message });
			}
			return error(StatusCodes.BAD_REQUEST, { _tag: err._tag, message: err.message });
		},
		onRight: (data) => {
			return json(data);
		}
	});
};
