import * as S from 'effect/Schema';
import type { User } from '@supabase/supabase-js';

import type { Tables, TablesInsert, TablesUpdate } from '$lib/shared/database.types';

export type UserProfile = Tables<'user_profiles'>;
export type Insert = TablesInsert<'user_profiles'>;
export type Update = TablesUpdate<'user_profiles'>;

/**
 * 사용자 프로필 생성 스키마.
 */
export const CreateSchema = S.Struct({
	name: S.String.pipe(S.minLength(1), S.maxLength(100))
});

/**
 * 사용자 프로필 업데이트 스키마.
 */
export const UpdateSchema = S.Struct({
	name: S.optional(S.String.pipe(S.minLength(1), S.maxLength(100)))
});

/**
 * 사용자와 프로필 타입의 결합 타입.
 */
export type UserAndProfile = {
	user: User;
	profile: Tables<'user_profiles'>;
};
