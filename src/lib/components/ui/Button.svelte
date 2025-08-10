<script lang="ts">
	import type { Snippet } from 'svelte';

	interface Props {
		children: Snippet<[]>;
		filled: boolean;
		type: 'submit' | 'reset' | 'button';
	}

	let { children, filled, type, ...props }: Props & Record<string, unknown> = $props();

	let bgClass = $derived(
		filled
			? 'bg-surface-950-50 text-surface-contrast-950-50'
			: 'bg-surface-50-950 border border-surface-200-800 text-surface-contrast-50-950'
	);
</script>

<button
	{type}
	class="rounded-[9px] {bgClass} flex items-center justify-center gap-2.5 px-6 py-4 heading-font-weight"
	{...props}
>
	{@render children()}
</button>
