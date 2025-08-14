import {
	mapPostgrestError,
	SupabasePostgrestError,
	SupabaseAuthError,
	NoSessionOrUserError
} from '$lib/shared/errors';
import { Context, Effect, Layer, Schema } from 'effect';
import { SupabaseService } from '$lib/infra/supabase/layer.server';
import {
	UserProfileNotFoundError,
	CreateUserProfileSchema,
	UpdateUserProfileSchema
} from './schema';
import type { Tables, TablesInsert, TablesUpdate } from '$lib/infra/supabase/types';

export type UserProfile = Tables<'user_profiles'>;

export class UserProfileService extends Context.Tag('UserProfile')<
	UserProfileService,
	{
		/**
		 * Creates a new user profile for the authenticated user.
		 *
		 * This method is typically called during user onboarding or first login.
		 * The profile ID matches the authenticated user's ID from Supabase Auth.
		 * Only one profile per user is allowed.
		 *
		 * @param input - The user profile creation parameters including display name
		 * @returns Effect that succeeds with the created UserProfile or fails with authentication or database error
		 *
		 * @throws {SupabasePostgrestError} When database operations fail (connection issues, unique constraint violations, access denied)
		 * @throws {SupabaseAuthError} When user authentication is invalid or expired
		 * @throws {NoSessionOrUserError} When no authenticated user session exists
		 *
		 * @example
		 * ```typescript
		 * const newProfile = yield* userProfileService.createUserProfileAsync({
		 *   name: 'John Doe'
		 * });
		 * console.log('Profile created for user:', newProfile.id);
		 * console.log('Display name:', newProfile.name);
		 * ```
		 */
		readonly createUserProfileAsync: (
			input: Schema.Schema.Type<typeof CreateUserProfileSchema>
		) => Effect.Effect<
			UserProfile,
			SupabasePostgrestError | SupabaseAuthError | NoSessionOrUserError
		>;

		/**
		 * Retrieves the user profile for the currently authenticated user.
		 *
		 * This method fetches the profile associated with the current user session.
		 * It's commonly used to display user information in the UI and for
		 * personalizing the user experience.
		 *
		 * @returns Effect that succeeds with the current user's UserProfile or fails with authentication or database error
		 *
		 * @throws {SupabasePostgrestError} When database query fails or access is denied
		 * @throws {SupabaseAuthError} When user authentication is invalid or expired
		 * @throws {NoSessionOrUserError} When no authenticated user session exists
		 * @throws {UserProfileNotFoundError} When the authenticated user doesn't have a profile yet
		 *
		 * @example
		 * ```typescript
		 * const currentProfile = yield* userProfileService.getCurrentUserProfileAsync();
		 * console.log('Welcome back,', currentProfile.name);
		 * console.log('Profile created on:', currentProfile.created_at);
		 * ```
		 */
		readonly getCurrentUserProfileAsync: () => Effect.Effect<
			UserProfile,
			SupabasePostgrestError | SupabaseAuthError | NoSessionOrUserError | UserProfileNotFoundError
		>;

		/**
		 * Updates an existing user profile with new values.
		 *
		 * Allows partial updates of profile properties. Only provided fields will be updated,
		 * leaving other properties unchanged. The profile ID cannot be changed as it's
		 * tied to the user's authentication identity.
		 *
		 * @param id - The unique identifier of the user profile to update (must match authenticated user's ID)
		 * @param input - Partial update data containing fields to modify
		 * @returns Effect that succeeds with the updated UserProfile or fails with database error
		 *
		 * @throws {SupabasePostgrestError} When database operations fail, profile not found, or access denied
		 *
		 * @example
		 * ```typescript
		 * // Update display name
		 * const updatedProfile = yield* userProfileService.updateUserProfileAsync(userId, {
		 *   name: 'Jane Smith'
		 * });
		 * console.log('Profile updated:', updatedProfile.name);
		 * ```
		 */
		readonly updateUserProfileAsync: (
			id: string,
			input: Schema.Schema.Type<typeof UpdateUserProfileSchema>
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
			createUserProfileAsync: (input: Schema.Schema.Type<typeof CreateUserProfileSchema>) =>
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

			updateUserProfileAsync: (
				id: string,
				input: Schema.Schema.Type<typeof UpdateUserProfileSchema>
			) =>
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
