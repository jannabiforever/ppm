import { Effect } from 'effect';
import * as Supabase from '$lib/modules/supabase';
import { type Profile, type ProfileInsert, type ProfileUpdate } from './types';
import { AssociatedProfileNotFound } from './errors';

export class Service extends Effect.Service<Service>()('UserProfileRepository', {
	effect: Effect.gen(function* () {
		const supabase = yield* Supabase.Service;
		const client = yield* supabase.getClient();
		const user = yield* supabase.getUser();

		return {
			createUserProfile: (
				input: ProfileInsert
			): Effect.Effect<Profile, Supabase.PostgrestError | AssociatedProfileNotFound> =>
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
				Profile,
				Supabase.PostgrestError | AssociatedProfileNotFound
			> =>
				Effect.promise(() =>
					client.from('user_profiles').select().eq('id', user.id).maybeSingle()
				).pipe(
					Effect.flatMap(Supabase.mapPostgrestResponse),
					Effect.flatMap((res) => {
						if (res === null) return Effect.fail(new AssociatedProfileNotFound(user.id));
						return Effect.succeed(res);
					})
				),

			updateUserProfile: (
				id: string,
				input: ProfileUpdate
			): Effect.Effect<void, Supabase.PostgrestError> =>
				Effect.promise(() => client.from('user_profiles').update(input).eq('id', id)).pipe(
					Effect.flatMap(Supabase.mapPostgrestResponseVoid)
				)
		};
	})
}) {}
