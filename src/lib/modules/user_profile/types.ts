import type { User } from '@supabase/supabase-js';

import type { Tables, TablesInsert, TablesUpdate } from '$lib/shared/database.types';

export type Profile = Tables<'user_profiles'>;
export type ProfileInsert = TablesInsert<'user_profiles'>;
export type ProfileUpdate = TablesUpdate<'user_profiles'>;

/**
 * 사용자와 프로필 타입의 결합 타입.
 */
export type UserProfile = {
	user: User;
	profile: Profile;
};
