<script lang="ts">
	import { Checkbox, Label } from 'bits-ui';
	import { Check } from 'lucide-svelte';

	interface Props {
		label: string;
		name: string;
		checked: boolean;
		onCheckedChange?: (checked: boolean) => void;
	}

	let {
		label,
		name,
		checked = $bindable(),
		onCheckedChange = () => {},
		...props
	}: Props & Record<string, unknown> = $props();
</script>

<div class="flex items-center gap-2.5">
	<Checkbox.Root
		bind:checked
		class="inline-flex size-[24px] items-center justify-center rounded-md border border-surface-100-900 bg-surface-50-950 transition-all duration-150 ease-in-out active:scale-[0.98] data-[state=checked]:bg-surface-800-200 data-[state=unchecked]:hover:border-surface-400-600"
		{name}
		id={name}
		{onCheckedChange}
		{...props}
	>
		{#snippet children({ checked, indeterminate })}
			<div class="inline-flex items-center justify-center">
				{#if checked || indeterminate}
					<Check color="white" size={18} />
				{/if}
			</div>
		{/snippet}
	</Checkbox.Root>
	<Label.Root for={name} class="text-sm">{label}</Label.Root>
</div>
