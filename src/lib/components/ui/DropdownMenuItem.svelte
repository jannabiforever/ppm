<script lang="ts">
	import { DropdownMenu } from 'bits-ui';
	import type { Snippet } from 'svelte';

	type Props = {
		/**
		 * icon snippet, which have xs-size.
		 */
		icon: Snippet<[]>;
		label: string;
		onSelect: () => void;

		menuClass?: string;
		labelClass?: string;
	};

	let { icon, label, onSelect, menuClass = '', labelClass = '' }: Props = $props();
</script>

<DropdownMenu.Item
	class="cursor-pointer rounded-sm p-3 hover:bg-surface-100-900 {menuClass}"
	{onSelect}
>
	<div class="flex items-center">
		{@render icon()}
		<span class="ml-3 text-xs {labelClass}">{label}</span>
	</div>
</DropdownMenu.Item>
