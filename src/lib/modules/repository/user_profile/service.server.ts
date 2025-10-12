import { Effect } from 'effect';
import * as Supabase from '$lib/modules/infra/supabase/index.server';
import { type Profile, type ProfileInsert, type ProfileUpdate } from './types';
import { AssociatedProfileNotFound } from './errors';

/**
 * Service class for managing user profiles in the database.
 * Provides methods for creating, retrieving, and updating user profile information.
 */
export class Service extends Effect.Service<Service>()('UserProfileRepository', {
	effect: Effect.gen(function* () {
		const supabase = yield* Supabase.Service;
		const client = yield* supabase.getClient();
		const user = yield* supabase.getUser();

		const createUserProfile = (
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
			).pipe(Effect.flatMap(Supabase.mapPostgrestResponse));

		const getCurrentUserProfile = (): Effect.Effect<
			Profile,
			Supabase.PostgrestError | AssociatedProfileNotFound
		> =>
			Effect.promise(() =>
				client.from('user_profiles').select().eq('id', user.id).maybeSingle()
			).pipe(
				Effect.flatMap(Supabase.mapPostgrestResponse),
				Effect.flatMap((res) => {
					if (res === null) return Effect.fail(new AssociatedProfileNotFound({ userId: user.id }));
					return Effect.succeed(res);
				})
			);

		const updateUserProfile = (
			id: string,
			input: ProfileUpdate
		): Effect.Effect<void, Supabase.PostgrestError> =>
			Effect.promise(() => client.from('user_profiles').update(input).eq('id', id)).pipe(
				Effect.flatMap(Supabase.mapPostgrestResponseVoid)
			);

		return {
			/**
			 * Creates a new user profile for the authenticated user.
			 *
			 * @param input - The profile data to insert
			 * @returns Effect containing the created Profile or an error
			 * @throws {Supabase.PostgrestError} When database operation fails
			 * @throws {AssociatedProfileNotFound} When profile creation fails
			 */
			createUserProfile,

			/**
			 * Retrieves the current authenticated user's profile.
			 *
			 * @returns Effect containing the user's Profile or an error
			 * @throws {Supabase.PostgrestError} When database operation fails
			 * @throws {AssociatedProfileNotFound} When no profile exists for the current user
			 */
			getCurrentUserProfile,

			/**
			 * Updates an existing user profile.
			 *
			 * @param id - The ID of the profile to update
			 * @param input - The profile data to update
			 * @returns Effect containing void or an error
			 * @throws {Supabase.PostgrestError} When database operation fails
			 */
			updateUserProfile
		};
	})
}) {}
