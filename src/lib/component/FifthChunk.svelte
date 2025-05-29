<script lang="ts">
	import { Clock5 } from '@lucide/svelte';
	import type { Snippet } from 'svelte';

	let { isHighlighted, children }: { isHighlighted: boolean; children: Snippet } = $props();
</script>

<div
	class="card {isHighlighted
		? 'variant-filled'
		: 'variant-soft'} col-span-2 flex flex-col rounded-xl border p-6 shadow-md {isHighlighted
		? 'border-surface-400 dark:border-surface-600 border-2'
		: 'border-surface-300 dark:border-surface-700'} transition-all duration-500 hover:translate-y-[-5px] hover:shadow-xl {isHighlighted
		? 'ring-surface-500/30 ring-4'
		: ''}"
>
	<div class="mb-4 flex items-center justify-between">
		<div class="flex items-center">
			<div
				class="bg-surface-500/30 dark:bg-surface-500/20 border-surface-400 dark:border-surface-700 mr-3 rounded-lg border p-3 transition-transform duration-500 hover:scale-110"
			>
				<Clock5 class="text-surface-700 dark:text-surface-300 h-6 w-6" />
			</div>
			<h3 class="text-lg font-semibold">Managing Hours</h3>
		</div>
		{#if isHighlighted}
			<button type="button" class="chip preset-filled-surface-500 text-sm">Current</button>
		{/if}
	</div>
	<div class="mb-4 text-sm opacity-75">
		{@render children()}
	</div>
	<div class="mt-auto text-right">
		<button class="btn btn-sm variant-ghost-success transition-transform hover:scale-105">
			View Details
		</button>
	</div>
</div>
