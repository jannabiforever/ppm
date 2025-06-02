<script lang="ts">
	import { Check, X } from '@lucide/svelte';
	
	// Define props with types
	let {
		type = 'success',
		message = ''
	}: {
		type: 'success' | 'error';
		message: string;
	} = $props();
</script>

{#if message}
	{#if type === 'success'}
		<div
			class="bg-success-600/20 border-success-400 flex animate-pulse items-center gap-2 rounded-lg border p-4 backdrop-blur-sm"
		>
			<div class="bg-success-400 rounded-full p-1">
				<Check size={14} class="text-success-900" />
			</div>
			<span class="font-medium">{message}</span>
		</div>
	{:else if type === 'error'}
		<div
			class="flex items-center gap-2 rounded-lg border border-red-400 bg-red-600/20 p-4 text-red-100 backdrop-blur-sm"
		>
			<div class="bg-error-400 rounded-full p-1">
				<X size={14} class="text-error-900" />
			</div>
			<span class="font-medium">{message}</span>
		</div>
	{/if}
{/if}