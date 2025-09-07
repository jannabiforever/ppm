import { readable, derived } from 'svelte/store';
import { DateTime } from 'effect';
import { getKstMidnightAsUtc } from '$lib/shared/utils/datetime';

// time store
export const currentTime = readable(new Date(), (set) => {
	const id = setInterval(() => set(new Date()), 10_000);
	return () => clearInterval(id);
});

// effect/DateTime current time store
export const currentTimeUtc = derived(currentTime, ($t) => DateTime.unsafeFromDate($t));

export const currentKSTMidnight = derived(currentTimeUtc, ($utc) => getKstMidnightAsUtc($utc));
