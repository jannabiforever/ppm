<script lang="ts">
	import { Clock3 } from '@lucide/svelte';
	import type { Snippet } from 'svelte';

	let { isHighlighted, children }: { isHighlighted: boolean; children: Snippet } = $props();
</script>

<div
	class="card {isHighlighted
		? 'variant-filled-success'
		: 'variant-soft-success'} flex flex-col rounded-xl border p-6 shadow-md {isHighlighted
		? 'border-success-400 dark:border-success-600 border-2'
		: 'border-success-300 dark:border-success-800'} transition-all duration-500 hover:translate-y-[-5px] hover:shadow-xl {isHighlighted
		? 'ring-success-500/30 ring-4'
		: ''}"
>
	<div class="mb-4 flex items-center justify-between">
		<div class="flex items-center">
			<div
				class="bg-success-500/30 dark:bg-success-500/20 border-success-400 dark:border-success-700 mr-3 rounded-lg border p-3 transition-transform duration-500 hover:scale-110"
			>
				<Clock3 class="text-success-700 dark:text-success-300 h-6 w-6" />
			</div>
			<h3 class="text-lg font-semibold">4th Chunk</h3>
		</div>
		{#if isHighlighted}
			<button type="button" class="chip preset-tonal-success text-sm">Current</button>
		{/if}
	</div>
	<div class="mb-4 text-sm opacity-75">
		{@render children()}
	</div>
	<div class="mt-auto text-right">
		<button class="btn btn-sm variant-filled transition-transform hover:scale-105">
			View Details
		</button>
	</div>
</div>
