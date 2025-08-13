<script lang="ts">
	import { Eclipse } from 'lucide-svelte';
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';
	import { DEFAULT_ICON_PROPS } from '../constants';

	let isDarkMode = $state(false);
	let dataModeAttribute = $derived(isDarkMode ? 'dark' : 'light');
	let localStorageValue = $derived(isDarkMode ? 'true' : 'false');

	onMount(() => {
		if (browser) {
			isDarkMode = (localStorage.getItem('darkMode') ?? 'false') === 'true';
		}
	});

	$effect(() => {
		document.documentElement.setAttribute('data-mode', dataModeAttribute);
		localStorage.setItem('darkMode', localStorageValue);
	});

	const toggleDarkMode = () => {
		isDarkMode = !isDarkMode;
	};
</script>

<button
	class="mx-0.5 flex items-center justify-center rounded-sm p-2 hover:bg-surface-100-900/80"
	onclick={toggleDarkMode}
>
	<Eclipse {...DEFAULT_ICON_PROPS.md} />
</button>
