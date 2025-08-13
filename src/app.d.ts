import type { Session } from '@supabase/supabase-js';
import type { SupabaseService } from '$lib/infra/supabase/layer.server';
import type { Layer } from 'effect';
import type { UserAndProfile } from '$lib/modules/user_profile';

declare global {
	namespace App {
		interface Error {
			readonly _tag: string;
			readonly message: string;
		}
		interface Locals {
			supabase: Layer.Layer<SupabaseService, never, never>;
			session: Session;
			userAndProfile: UserAndProfile;
		}
		// interface PageData {}
		// interface PageState {}
		// interface Platform {}
	}
}

export {};
