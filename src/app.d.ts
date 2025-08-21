import * as Supabase from '$lib/modules/supabase';
import * as UserProfile from '$lib/modules/user_profile';
import type { Layer } from 'effect';
import type { Session, User } from '@supabase/supabase-js';

declare global {
	namespace App {
		interface Error {
			readonly _tag: string;
			readonly message: string;
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

export {};
