<script lang="ts">
	import { X } from '@lucide/svelte';

	let {
		id,
		label,
		type = 'text',
		name,
		value = '',
		error = '',
		placeholder = '',
		maxlength,
		required = false,
		onInput = undefined
	}: {
		id: string;
		label: string;
		type?: string;
		name: string;
		value?: string;
		error?: string;
		placeholder?: string;
		maxlength?: number;
		required?: boolean;
		onInput?: (e: Event) => void;
	} = $props();
</script>

<div class="grid gap-2">
	<label for={id} class="flex items-center gap-1.5 text-sm font-medium">
		{label}
	</label>
	<input
		{type}
		{id}
		{name}
		class="input h-11 rounded-lg border text-sm"
		{value}
		{placeholder}
		{maxlength}
		{required}
		oninput={(e) => onInput && onInput(e)}
	/>
	{#if error}
		<p class="mt-1 flex items-center gap-1 text-xs font-medium text-red-200">
			<X size={12} class="text-red-300" />
			{error}
		</p>
	{/if}
</div>