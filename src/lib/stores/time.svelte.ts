import { SvelteDate } from 'svelte/reactivity';

/**
 * currentTime constant that is synchronized globally.
 */
export const currentTime = new SvelteDate();

while (true) {
	await new Promise((resolve) => setTimeout(resolve, 500));
	currentTime.setTime(Date.now());
}
