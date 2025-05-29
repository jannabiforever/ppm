<script lang="ts">
	import '../app.css';

	import { Navigation } from '@skeletonlabs/skeleton-svelte';
	import { browser } from '$app/environment';

	// Icons
	import { Folder, LandPlot, LayoutDashboard, Settings, SquareKanban, Stars } from '@lucide/svelte';
	import { onMount } from 'svelte';

	// Get default theme from local storage
	const theme = browser ? (localStorage.getItem('theme') === 'light' ? 'light' : 'dark') : 'light';

	let isLightMode = $state(theme === 'light');

	// Animation position value
	let animatedPosition = $derived(isLightMode ? 1 : 0);

	// Fixed moon position for visibility
	const sunMoonPosition = { x: 50, y: 30 }; // Fixed position when in dark mode

	$effect(() => {
		// try update local storage when mode changes
		if (browser) {
			localStorage.setItem('theme', isLightMode ? 'light' : 'dark');
		}

		// set document class as mode
		document.documentElement.setAttribute('data-mode', isLightMode ? 'light' : 'dark');

		// Only run animation when light mode changes
		if (browser) {
			// Update animation value with transition
			const targetValue = isLightMode ? 1 : 0;
			const duration = 800; // ms
			const startTime = Date.now();
			const startValue = animatedPosition;

			function animate() {
				const elapsed = Date.now() - startTime;
				const progress = Math.min(elapsed / duration, 1);

				// Easing function (cubic out)
				const eased = 1 - Math.pow(1 - progress, 3);

				// Update position
				animatedPosition = startValue + (targetValue - startValue) * eased;

				if (progress < 1) {
					requestAnimationFrame(animate);
				}
			}

			if (startValue !== targetValue) {
				animate();
			}
		}
	});

	function toggleTheme(lightMode: boolean) {
		// Simply update the mode - animation is triggered by the effect
		isLightMode = lightMode;
	}

	// Generate stars for the night sky
	let stars: { top: string; left: string; size: string; opacity: number }[] = [];
	onMount(() => {
		// Generate random stars
		for (let i = 0; i < 25; i++) {
			stars.push({
				top: Math.random() * 100 + '%',
				left: Math.random() * 100 + '%',
				size: Math.random() * 2 + 1 + 'px',
				opacity: Math.random() * 0.7 + 0.3
			});
		}
	});

	let { children } = $props();
</script>

<div class="card border-surface-100-900 grid h-dvh w-full grid-cols-[auto_1fr] border-[1px]">
	<!-- Component -->
	<Navigation.Rail>
		{#snippet header()}
			<div class="theme-toggle-container flex flex-col items-center p-2">
				<button
					class="relative h-16 w-16 overflow-hidden rounded-full border-2 transition-all duration-300 {isLightMode
						? 'border-amber-200'
						: 'border-indigo-800'}"
					onclick={() => toggleTheme(!isLightMode)}
					aria-label="Toggle theme"
				>
					<!-- Sky background -->
					<div
						class="absolute inset-0 transition-colors duration-1500 {isLightMode
							? 'bg-gradient-to-b from-sky-300 to-sky-100'
							: 'bg-gradient-to-b from-slate-900 via-blue-950 to-purple-950'}"
					></div>

					<!-- Stars icon (only visible at night) -->
					<div
						class="absolute top-2 right-2 rotate-12 transform transition-opacity duration-1000 {isLightMode
							? 'opacity-0'
							: 'opacity-100'}"
					>
						<Stars class="h-4 w-4 text-yellow-50" />
					</div>

					<!-- Sun/Moon -->
					<div
						class="absolute flex h-10 w-10 items-center justify-center rounded-full shadow-lg transition-colors duration-1000 {!isLightMode
							? 'moon-glow'
							: ''} {isLightMode ? 'bg-yellow-400' : 'bg-white'}"
						style="transform: translate({sunMoonPosition.x}%,
						{sunMoonPosition.y}%);"
					>
						{#if isLightMode}
							<div class="relative h-full w-full">
								<div
									class=" absolute inset-0 flex items-center justify-center rounded-full bg-yellow-400"
								></div>
								<div
									class="absolute right-2.5 bottom-2 h-1.5 w-1.5 rounded-full bg-slate-300"
								></div>
							</div>
						{:else}
							<div class="relative h-full w-full">
								<div
									class="bg-white-400 absolute inset-0 flex items-center justify-center rounded-full"
								></div>
								<div
									class="absolute right-2.5 bottom-2 h-1.5 w-1.5 rounded-full bg-slate-300"
								></div>
							</div>
						{/if}
					</div>

					<div
						class="absolute bottom-5 left-3 -rotate-6 transform {isLightMode
							? 'opacity-0'
							: 'opacity-100'} transition-opacity duration-1000"
						style="animation: float 3s infinite ease-in-out"
					>
						<Stars class="h-3 w-3 text-yellow-100" />
					</div>
				</button>
				<span class="mt-2 text-xs font-medium opacity-75">
					{isLightMode ? 'Day' : 'Night'}
				</span>
			</div>
		{/snippet}
		{#snippet tiles()}
			<Navigation.Tile href="/">
				<LayoutDashboard />
			</Navigation.Tile>
			<Navigation.Tile href="/notes">
				<Folder />
			</Navigation.Tile>
			<Navigation.Tile href="/planner">
				<LandPlot />
			</Navigation.Tile>
			<Navigation.Tile href="/projects">
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

<style>
	/* Custom animations that can't be handled by Tailwind */
	@keyframes twinkle {
		0% {
			opacity: 0.3;
			transform: scale(0.8);
		}
		50% {
			opacity: 1;
			transform: scale(1.1);
		}
		100% {
			opacity: 0.3;
			transform: scale(0.8);
		}
	}

	@keyframes pulse {
		0% {
			box-shadow:
				0 0 20px 8px rgba(255, 255, 255, 0.9),
				0 0 30px 15px rgba(186, 230, 253, 0.6);
		}
		50% {
			box-shadow:
				0 0 25px 10px rgba(255, 255, 255, 1),
				0 0 40px 20px rgba(186, 230, 253, 0.8);
		}
		100% {
			box-shadow:
				0 0 20px 8px rgba(255, 255, 255, 0.9),
				0 0 30px 15px rgba(186, 230, 253, 0.6);
		}
	}

	@keyframes float {
		0% {
			transform: translateY(0px);
		}
		50% {
			transform: translateY(-3px);
		}
		100% {
			transform: translateY(0px);
		}
	}

	.moon-glow {
		box-shadow:
			0 0 20px 8px rgba(255, 255, 255, 0.9),
			0 0 30px 15px rgba(186, 230, 253, 0.6);
		z-index: 10;
		animation: pulse 3s infinite ease-in-out;
	}
</style>
