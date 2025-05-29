<script lang="ts">
	import '../app.css';

	import { Navigation } from '@skeletonlabs/skeleton-svelte';
	import { browser } from '$app/environment';

	// Icons
	import { Folder, LandPlot, LayoutDashboard, Settings, SquareKanban } from '@lucide/svelte';
	import ThemeButton from '$lib/component/themeButton.svelte';

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
			<Navigation.Tile label="Dashboard" href="/">
				<LayoutDashboard />
			</Navigation.Tile>
			<Navigation.Tile label="Notes" href="/notes">
				<Folder />
			</Navigation.Tile>
			<Navigation.Tile label="Planner" href="/planner">
				<LandPlot />
			</Navigation.Tile>
			<Navigation.Tile label="Projects" href="/projects">
				<SquareKanban />
			</Navigation.Tile>
		{/snippet}
		{#snippet footer()}
			<Navigation.Tile href="/settings" title="Settings">
				<Settings />
			</Navigation.Tile>
		{/snippet}
	</Navigation.Rail>
	<!-- Content -->
	<div class="flex items-center justify-center">
		{@render children()}
	</div>
</div>
