import { SvelteDate } from 'svelte/reactivity';

/**
 * 현재 시간을 추적하는 store.
 */
export const currentTime = new SvelteDate();

setInterval(() => {
	currentTime.setTime(new Date().getTime());
}, 1000);
