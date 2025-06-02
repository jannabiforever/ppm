<script lang="ts">
	import { Combobox } from 'bits-ui';
	import { ChevronsUpDown, Check, X } from '@lucide/svelte';
	import PriorityChip from '$lib/component/PriorityChip.svelte';

	let {
		value = 'medium' as App.PriorityLevel,
		error = '',
		name = 'priority',
		onChange = undefined
	}: {
		value: App.PriorityLevel;
		error?: string;
		name: string;
		onChange?: (value: App.PriorityLevel) => void;
	} = $props();

	// Priority options
	const priorityOptions: App.PriorityLevel[] = ['high', 'medium', 'low', 'system'];
	
	// Track combobox open state
	let isComboboxOpen = $state(false);
	
	// Handle value change
	function handleValueChange(newValue: string) {
		if (onChange) {
			onChange(newValue as App.PriorityLevel);
		}
	}
</script>

<div class="grid gap-2">
	<label for="priority" class="flex items-center gap-1.5 text-sm font-medium">
		중요도
	</label>
	<input type="hidden" {name} {value} />
	<Combobox.Root
	type="single"
	bind:open={isComboboxOpen}
	value={value}
	onValueChange={handleValueChange}
>
		<div class="relative w-full">
			<div class="input flex h-11 items-center justify-between rounded-lg border px-3">
				<div class="flex items-center gap-2">
					<PriorityChip priority={value} />
				</div>
				<Combobox.Trigger class="ml-auto">
					<ChevronsUpDown class="size-4" />
				</Combobox.Trigger>
			</div>
			<Combobox.Input class="sr-only" />
			<Combobox.Portal>
				<Combobox.Content
					class="dark:bg-surface-800 animate-in fade-in-80 z-50 min-w-[200px] overflow-hidden rounded-md border bg-white p-1 shadow-md"
					sideOffset={5}
				>
					<Combobox.Viewport>
						{#each priorityOptions as priority, i (i)}
							<Combobox.Item
								value={priority}
								label={priority}
								class="dark:hover:bg-surface-700 flex cursor-pointer items-center rounded-sm p-2 hover:bg-gray-100"
							>
								{#snippet children({ selected })}
									<div class="flex w-full items-center justify-between">
										<PriorityChip {priority} />
										{#if selected}
											<Check class="ml-2 size-4" />
										{/if}
									</div>
								{/snippet}
							</Combobox.Item>
						{/each}
					</Combobox.Viewport>
				</Combobox.Content>
			</Combobox.Portal>
		</div>
	</Combobox.Root>
	{#if error}
		<p class="mt-1 flex items-center gap-1 text-xs font-medium text-red-200">
			<X size={12} class="text-red-300" />
			{error}
		</p>
	{/if}
</div>