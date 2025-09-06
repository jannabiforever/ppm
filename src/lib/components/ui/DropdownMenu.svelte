<script lang="ts">
	import { DropdownMenu } from 'bits-ui';
	import { Ellipsis } from 'lucide-svelte';
	import { ICON_PROPS } from '../constants';
	import type { Snippet } from 'svelte';

	type Props = {
		items: Snippet<[]>;
	};

	let { items }: Props = $props();
</script>

<DropdownMenu.Root>
	<DropdownMenu.Trigger
		class="rounded-full border-surface-200-800 p-1 ring-surface-200-800 hover:ring"
	>
		<Ellipsis {...ICON_PROPS.md} />
	</DropdownMenu.Trigger>
	<DropdownMenu.Portal>
		<DropdownMenu.Content
			class="w-[200px] rounded-sm border border-surface-200-800 bg-surface-50-950 p-1 shadow-xl"
			sideOffset={8}
		>
			{@render items()}
		</DropdownMenu.Content>
	</DropdownMenu.Portal>
</DropdownMenu.Root>
