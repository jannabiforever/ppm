import { Effect } from 'effect';
import * as Supabase from '../supabase';

export class Service extends Effect.Service<Service>()('SessionTaskService', {
	effect: Effect.gen(function* () {
		const supabase = yield* Supabase.Service;
		const client = yield* supabase.getClient();

		return {};
	})
}) {}
