import { Effect, Schema } from 'effect';
import * as Supabase from '$lib/modules/supabase';
import { CreateSchema, UpdateSchema, type Insert, type Update, type UserProfile } from './schema';
import { mapPostgrestError, SupabasePostgrestError } from '$lib/shared/errors';
import { NotFoundError } from './errors';

export class Service extends Effect.Service<Service>()('UserProfileService', {
	effect: Effect.gen(function* () {
		const supabase = yield* Supabase.Service;
		const client = yield* supabase.getClient();
		const user = yield* supabase.getUser();

		return {
			createUserProfile: (input: Schema.Schema.Type<typeof CreateSchema>) =>
				Effect.gen(function* () {
					const insertData: Insert = {
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

			getCurrentUserProfile: (): Effect.Effect<
				UserProfile,
				SupabasePostgrestError | NotFoundError
			> =>
				Effect.gen(function* () {
					const res = yield* Effect.promise(() =>
						client.from('user_profiles').select().eq('id', user.id).maybeSingle()
					);

					if (res.error) {
						return yield* Effect.fail(mapPostgrestError(res.error, res.status));
					}

					if (!res.data) {
						return yield* Effect.fail(new NotFoundError(user.id));
					}

					return res.data;
				}),

			updateUserProfile: (id: string, input: Schema.Schema.Type<typeof UpdateSchema>) =>
				supabase.getClient().pipe(
					Effect.flatMap((client) => {
						const updateData: Update = {};

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
}) {}
