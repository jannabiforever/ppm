import type { Session } from '@supabase/supabase-js';
import * as Supabase from '$lib/modules/supabase';
import type { Layer } from 'effect';
import type { UserProfile } from '$lib/modules/user_profile';

declare global {
	namespace App {
		interface Error {
			readonly _tag: string;
			readonly message: string;
		}
		interface Locals {
			supabase: Layer.Layer<Supabase.Service, never, never>;
			session: Session;
			userAndProfile: UserProfile;
		}
		// interface PageData {}
		// interface PageState {}
		// interface Platform {}
	}
}

export {};
