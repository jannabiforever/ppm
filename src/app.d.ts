import type { Session, User } from '@supabase/supabase-js';
import type { SupabaseService } from '$lib/services/supabase';
import type { Layer } from 'effect';

declare global {
	namespace App {
		// interface Error {}
		interface Locals {
			supabase: Layer.Layer<SupabaseService, never, never>;
			session: Session | null;
			user: User | null;
		}
		// PageData {}
		// interface PageState {}
		// interface Platform {}
	}
}

export {};
