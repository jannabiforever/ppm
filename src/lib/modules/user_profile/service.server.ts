import { Effect, Schema } from 'effect';
import * as Supabase from '$lib/modules/supabase';
import { CreateSchema, UpdateSchema, type UserProfile } from './types';
import { NotFoundError } from './errors';

export class Service extends Effect.Service<Service>()('UserProfileService', {
	effect: Effect.gen(function* () {
		const supabase = yield* Supabase.Service;
		const client = yield* supabase.getClient();
		const user = yield* supabase.getUser();

		return {
			createUserProfile: (
				input: Schema.Schema.Type<typeof CreateSchema>
			): Effect.Effect<UserProfile, Supabase.PostgrestError | NotFoundError> =>
				Effect.promise(() =>
					client
						.from('user_profiles')
						.insert({
							id: user.id,
							name: input.name
						})
						.select()
						.single()
				).pipe(Effect.flatMap(Supabase.mapPostgrestResponse)),

			getCurrentUserProfile: (): Effect.Effect<
				UserProfile,
				Supabase.PostgrestError | NotFoundError
			> =>
				Effect.promise(() =>
					client.from('user_profiles').select().eq('id', user.id).maybeSingle()
				).pipe(
					Effect.flatMap(Supabase.mapPostgrestResponse),
					Effect.flatMap((res) => {
						if (res === null) return Effect.fail(new NotFoundError(user.id));
						return Effect.succeed(res);
					})
				),

			updateUserProfile: (id: string, input: Schema.Schema.Type<typeof UpdateSchema>) =>
				Effect.promise(() =>
					client.from('user_profiles').update(input).eq('id', id).select().single()
				).pipe(Effect.flatMap(Supabase.mapPostgrestResponseVoid))
		};
	})
}) {}
