import {
	mapPostgrestError,
	SupabasePostgrestError,
	SupabaseAuthError,
	NoSessionOrUserError
} from '$lib/shared/errors';
import { Context, Effect, Layer } from 'effect';
import { SupabaseService } from '$lib/infra/supabase/layer.server';
import {
	UserProfileNotFoundError,
	type CreateUserProfileInput,
	type UpdateUserProfileInput
} from './schema';
import type { Tables, TablesInsert, TablesUpdate } from '$lib/infra/supabase/types';

export type UserProfile = Tables<'user_profiles'>;

export class UserProfileService extends Context.Tag('UserProfile')<
	UserProfileService,
	{
		readonly createUserProfileAsync: (
			input: CreateUserProfileInput
		) => Effect.Effect<
			UserProfile,
			SupabasePostgrestError | SupabaseAuthError | NoSessionOrUserError
		>;
		readonly getCurrentUserProfileAsync: () => Effect.Effect<
			UserProfile,
			SupabasePostgrestError | SupabaseAuthError | NoSessionOrUserError | UserProfileNotFoundError
		>;
		readonly updateUserProfileAsync: (
			id: string,
			input: UpdateUserProfileInput
		) => Effect.Effect<UserProfile, SupabasePostgrestError>;
	}
>() {}

export const UserProfileLive = Layer.effect(
	UserProfileService,
	Effect.gen(function* () {
		const supabase = yield* SupabaseService;
		const client = yield* supabase.getClientSync();
		const user = yield* supabase.safeGetUserAsync();

		return {
			createUserProfileAsync: (input: CreateUserProfileInput) =>
				Effect.gen(function* () {
					const insertData: TablesInsert<'user_profiles'> = {
						id: user.id,
						name: input.name
					};

					const res = yield* Effect.promise(() =>
						client.from('user_profiles').insert(insertData).select().single()
					);

					return res.error
						? yield* Effect.fail(mapPostgrestError(res.error, res.status))
						: res.data;
				}),

			getCurrentUserProfileAsync: () =>
				Effect.gen(function* () {
					const res = yield* Effect.promise(() =>
						client.from('user_profiles').select().eq('id', user.id).maybeSingle()
					);

					if (res.error) {
						return yield* Effect.fail(mapPostgrestError(res.error, res.status));
					}

					if (!res.data) {
						return yield* Effect.fail(new UserProfileNotFoundError(user.id));
					}

					return res.data;
				}),

			updateUserProfileAsync: (id: string, input: UpdateUserProfileInput) =>
				supabase.getClientSync().pipe(
					Effect.flatMap((client) => {
						const updateData: TablesUpdate<'user_profiles'> = {};

						if (input.name !== undefined) updateData.name = input.name;

						return Effect.promise(() =>
							client.from('user_profiles').update(updateData).eq('id', id).select().single()
						);
					}),
					Effect.flatMap((res) =>
						res.error
							? Effect.fail(mapPostgrestError(res.error, res.status))
							: Effect.succeed(res.data)
					)
				)
		};
	})
);
