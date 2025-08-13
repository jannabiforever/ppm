import { Schema, Data } from 'effect';
import type { User } from '@supabase/supabase-js';
import type { Tables } from '$lib/infra/supabase/types';

/**
 * User profile creation schema
 */
export const CreateUserProfileSchema = Schema.Struct({
	name: Schema.String.pipe(Schema.minLength(1), Schema.maxLength(100))
});

/**
 * User profile update schema
 */
export const UpdateUserProfileSchema = Schema.Struct({
	name: Schema.optional(Schema.String.pipe(Schema.minLength(1), Schema.maxLength(100)))
});

/**
 * Combined User and Profile type
 * Combines Supabase Auth User with user_profiles table data
 */
export type UserAndProfile = {
	user: User;
	profile: Tables<'user_profiles'>;
};

/**
 * User profile related domain errors
 */
export class UserProfileNotFoundError extends Data.TaggedError('UserProfileNotFound')<{
	readonly message: string;
	readonly userId: string;
}> {
	constructor(userId: string) {
		super({
			message: `User profile not found for user ${userId}`,
			userId
		});
	}
}

// Type exports
export type CreateUserProfileInput = typeof CreateUserProfileSchema.Type;
export type UpdateUserProfileInput = typeof UpdateUserProfileSchema.Type;
