import * as Supabase from '$lib/modules/supabase';
import * as UserProfile from '$lib/modules/user_profile';
import type { Layer } from 'effect';
import type { Session, User } from '@supabase/supabase-js';

declare global {
	namespace App {
		/**
		 * RFC 7807 표준에 맞춤.
		 */
		interface Error {
			/** _tag */
			readonly type: string;
			/** 에러 설명 타이틀 */
			readonly title: string;
			/** 에러 부가 내용 */
			readonly detail?: string;
			readonly status: number;
		}
		interface Locals {
			supabase: Layer.Layer<Supabase.Service, never, never>;
			session: Session;
			user: User;
			profile: UserProfile.Profile;
		}
		// interface PageData {}
		// interface PageState {}
		// interface Platform {}
	}
}
