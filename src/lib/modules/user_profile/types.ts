import type { User } from '@supabase/supabase-js';

import type { Tables, TablesInsert, TablesUpdate } from '$lib/shared/database.types';

/**
 * Type representing a complete user profile entity as stored in the database.
 * Contains user-specific information beyond authentication data.
 */
export type Profile = Tables<'user_profiles'>;

/**
 * Type for creating a new user profile.
 * Used when inserting profile data into the database.
 */
export type ProfileInsert = TablesInsert<'user_profiles'>;

/**
 * Type for updating an existing user profile.
 * All fields are optional to allow partial updates.
 */
export type ProfileUpdate = TablesUpdate<'user_profiles'>;

/**
 * Combined type representing a user and their associated profile.
 * This type is useful when both user authentication data and profile information are needed together.
 */
export type UserProfile = {
	user: User;
	profile: Profile;
};
