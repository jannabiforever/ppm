<script lang="ts">
	import '../app.css';

	import { Navigation } from '@skeletonlabs/skeleton-svelte';
	import { browser } from '$app/environment';

	// Icons
	import { Calendar, Folder, LayoutDashboard, Settings, Sunrise } from '@lucide/svelte';
	import ThemeButton from '$lib/component/ThemeButton.svelte';

	// Get default theme from local storage
	const theme = browser ? (localStorage.getItem('theme') === 'light' ? 'light' : 'dark') : 'light';

	let isLightMode = $state(theme === 'light');

	let { children } = $props();
</script>

<div class="card border-surface-100-900 grid h-dvh w-full grid-cols-[auto_1fr] border-[1px]">
	<!-- Component -->
	<Navigation.Rail>
		{#snippet header()}
			<ThemeButton {isLightMode} />
		{/snippet}
		{#snippet tiles()}
			<Navigation.Tile label="Days" href="/" labelClasses="text-center">
				<Sunrise />
			</Navigation.Tile>
			<Navigation.Tile label="Projects" href="/projects" labelClasses="text-center">
				<LayoutDashboard />
			</Navigation.Tile>
			<Navigation.Tile label="Weeks" href="/weeks" labelClasses="text-center">
				<Calendar />
			</Navigation.Tile>
			<Navigation.Tile label="Notes" href="/notes">
				<Folder />
			</Navigation.Tile>
		{/snippet}
		{#snippet footer()}
			<Navigation.Tile href="/settings" title="Settings">
				<Settings />
			</Navigation.Tile>
		{/snippet}
	</Navigation.Rail>
	<!-- Content -->
	<div class="h-full overflow-auto">
		<div class="min-h-full p-4">
			{@render children()}
		</div>
	</div>
</div>
