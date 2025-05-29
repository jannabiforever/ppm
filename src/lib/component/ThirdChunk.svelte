<script lang="ts">
	import { Clock1 } from '@lucide/svelte';
	import type { Snippet } from 'svelte';

	let { isHighlighted, children }: { isHighlighted: boolean; children: Snippet } = $props();
</script>

<div
	class="card {isHighlighted
		? 'variant-filled-tertiary'
		: 'variant-soft-tertiary'} flex flex-col rounded-xl border p-6 shadow-md {isHighlighted
		? 'border-tertiary-400 dark:border-tertiary-600 border-2'
		: 'border-tertiary-300 dark:border-tertiary-800'} transition-all duration-500 hover:translate-y-[-5px] hover:shadow-xl {isHighlighted
		? 'ring-tertiary-500/30 ring-4'
		: ''}"
>
	<div class="mb-4 flex items-center justify-between">
		<div class="flex items-center">
			<div
				class="bg-tertiary-500/30 dark:bg-tertiary-500/20 border-tertiary-400 dark:border-tertiary-700 mr-3 rounded-lg border p-3 transition-transform duration-500 hover:scale-110"
			>
				<Clock1 class="text-tertiary-700 dark:text-tertiary-300 h-6 w-6" />
			</div>
			<h3 class="text-lg font-semibold">01 / Third</h3>
		</div>
		{#if isHighlighted}
			<button type="button" class="chip preset-tonal-tertiary text-sm">Current</button>
		{/if}
	</div>
	<div class="mb-4 text-sm opacity-75">
		{@render children()}
	</div>
</div>
