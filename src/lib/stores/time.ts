import { SvelteDate } from 'svelte/reactivity';

/**
 * 현재 시간을 추적하는 store.
 */
export let currentTime = new SvelteDate();

setInterval(() => {
	currentTime = new SvelteDate();
}, 1000);
