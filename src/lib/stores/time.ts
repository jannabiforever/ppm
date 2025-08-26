import { SvelteDate } from 'svelte/reactivity';

/**
 * 현재 시간을 추적하는 store.
 */
export const currentTime = new SvelteDate();

while (true) {
	await new Promise((resolve) => setTimeout(resolve, 500));
	currentTime.setTime(Date.now());
}
