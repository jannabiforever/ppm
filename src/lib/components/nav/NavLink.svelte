<script lang="ts">
	import type { Snippet } from 'svelte';

	interface Props {
		href: string;
		selected: boolean;
		label: string;
		indented?: boolean;
		/**
		 * Icon props
		 */
		children: Snippet<[]>;
	}

	let { href, indented = false, label, selected, children }: Props = $props();

	let bgColorClass = $derived(selected ? 'bg-surface-100-900' : 'bg-surface-50-950');
	let fontWeightClass = $derived(indented ? 'font-medium' : 'font-semibold');
</script>

<a
	{href}
	class="flex items-center gap-2.5 {bgColorClass} {fontWeightClass} rounded-sm p-2 text-sm hover:bg-surface-100-900/80"
	class:ml-5={indented}
>
	{@render children()}
	<span>{label}</span>
</a>
