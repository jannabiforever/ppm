import type { Session, User } from '@supabase/supabase-js';
import type { SupabaseService } from '$lib/infra/supabase/layer.server';
import type { Layer } from 'effect';
import type { TaggedErrorClass } from 'effect/Schema';

declare global {
	namespace App {
		interface Error extends TaggedErrorClass {
			readonly _tag: string;
		}
		interface Locals {
			supabase: Layer.Layer<SupabaseService, never, never>;
			session: Session | null;
			user: User | null;
		}
		// interface PageData {}
		// interface PageState {}
		// interface Platform {}
	}
}

export {};
