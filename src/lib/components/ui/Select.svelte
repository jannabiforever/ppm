<script lang="ts">
	import { Select } from 'bits-ui';
	import { ICON_PROPS } from '../constants';
	import { Check, ChevronsDown, ChevronsUp, ChevronsUpDown } from 'lucide-svelte';
	import { type Snippet } from 'svelte';

	type Props = {
		items: Array<{ label: string; value: string }>;
		selectedValue?: string | null;
		ariaLabel: string;
		trigger: Snippet<[{ selectedValue: string | null }]>;
	};

	let { items, ariaLabel, trigger, selectedValue = $bindable(null) }: Props = $props();
</script>

<Select.Root type="single" onValueChange={(v) => (selectedValue = v)} {items}>
	<Select.Trigger
		aria-label={ariaLabel}
		class="flex w-[220px] items-center justify-between rounded-[9px] border border-surface-200-800 px-4 py-2"
	>
		{@render trigger({ selectedValue })}
		<ChevronsUpDown {...ICON_PROPS.md} />
	</Select.Trigger>
	<Select.Portal>
		<Select.Content
			side="bottom"
			sideOffset={10}
			class="z-50 max-h-96 w-[220px] overflow-hidden rounded-[9px] border border-surface-200-800 bg-surface-50-950 shadow-xl"
		>
			<Select.ScrollUpButton
				class="flex w-full items-center justify-center py-1 hover:bg-surface-100-900"
			>
				<ChevronsUp {...ICON_PROPS.sm} />
			</Select.ScrollUpButton>
			<Select.Viewport class="p-1">
				{#each items as item (item.value)}
					<Select.Item
						value={item.value}
						label={item.label}
						class="flex h-10 w-full items-center rounded-sm py-3 pr-1.5 pl-5 text-sm outline-hidden select-none data-highlighted:bg-surface-100-900"
					>
						{#snippet children({ selected })}
							{item.label}
							{#if selected}
								<div class="ml-auto">
									<Check aria-label="선택됨" {...ICON_PROPS.md} />
								</div>
							{/if}
						{/snippet}
					</Select.Item>
				{/each}
			</Select.Viewport>
			<Select.ScrollDownButton
				class="flex w-full items-center justify-center py-1 hover:bg-surface-100-900"
			>
				<ChevronsDown {...ICON_PROPS.sm} />
			</Select.ScrollDownButton>
		</Select.Content>
	</Select.Portal>
</Select.Root>
