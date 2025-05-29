<script lang="ts">
	import { Clock8 } from '@lucide/svelte';
	import type { Snippet } from 'svelte';

	let { isHighlighted, children }: { isHighlighted: boolean; children: Snippet } = $props();
</script>

<div
	class="card {isHighlighted
		? 'variant-filled-primary'
		: 'variant-soft-primary'} flex flex-col rounded-xl border p-6 shadow-md {isHighlighted
		? 'border-primary-400 dark:border-primary-600 border-2'
		: 'border-primary-300 dark:border-primary-800'} transition-all duration-500 hover:translate-y-[-5px] hover:shadow-xl {isHighlighted
		? 'ring-primary-500/30 ring-4'
		: ''}"
>
	<div class="mb-4 flex items-center justify-between">
		<div class="flex items-center">
			<div
				class="bg-primary-500/30 dark:bg-primary-500/20 border-primary-400 dark:border-primary-700 mr-3 rounded-lg border p-3 transition-transform duration-500 hover:scale-110"
			>
				<Clock8 class="text-primary-700 dark:text-primary-300 h-6 w-6" />
			</div>
			<h3 class="text-lg font-semibold">08 / First</h3>
		</div>
		{#if isHighlighted}
			<button type="button" class="chip preset-tonal-primary text-sm">Current</button>
		{/if}
	</div>
	<div class="mb-4 text-sm opacity-75">
		{@render children()}
	</div>
</div>
