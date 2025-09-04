<script lang="ts">
	interface Props {
		label: string;
		placeholder: string;
		disabled?: boolean;
		name: string;
		type?: string;
		value: string;
		autocomplete?: 'email' | 'username' | 'current-password' | null;
	}

	let {
		label,
		placeholder,
		disabled = false,
		name,
		type = 'text',
		value = $bindable(),
		autocomplete = null,
		...props
	}: Props & Record<string, unknown> = $props();
</script>

<div class="flex w-full flex-col gap-1">
	<span class="w-full text-base">
		{label}
	</span>
	<input
		class="w-full rounded-sm border border-surface-200-800 px-3 py-2 placeholder:text-sm placeholder:text-surface-300"
		class:placeholder:text-surface-300={disabled}
		{placeholder}
		{name}
		{type}
		{autocomplete}
		bind:value
		{...props}
	/>
</div>
