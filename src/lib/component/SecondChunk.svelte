<script lang="ts">
	import { Clock10 } from '@lucide/svelte';
	import type { Snippet } from 'svelte';

	let { isHighlighted, children }: { isHighlighted: boolean; children: Snippet } = $props();
</script>

<div
	class="card {isHighlighted
		? 'variant-filled-secondary'
		: 'variant-soft-secondary'} flex flex-col rounded-xl border p-6 shadow-md {isHighlighted
		? 'border-secondary-400 dark:border-secondary-600 border-2'
		: 'border-secondary-300 dark:border-secondary-800'} transition-all duration-500 hover:translate-y-[-5px] hover:shadow-xl {isHighlighted
		? 'ring-secondary-500/30 ring-4'
		: ''}"
>
	<div class="mb-4 flex items-center justify-between">
		<div class="flex items-center">
			<div
				class="bg-secondary-500/30 dark:bg-secondary-500/20 border-secondary-400 dark:border-secondary-700 mr-3 rounded-lg border p-3 transition-transform duration-500 hover:scale-110"
			>
				<Clock10 class="text-secondary-700 dark:text-secondary-300 h-6 w-6" />
			</div>
			<h3 class="text-lg font-semibold">10 / Second</h3>
		</div>
		{#if isHighlighted}
			<button type="button" class="chip preset-tonal-secondary text-sm">Current</button>
		{/if}
	</div>
	<div class="mb-4 text-sm opacity-75">
		{@render children()}
	</div>
</div>
