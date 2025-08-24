<script lang="ts">
	import { DropdownMenu } from 'bits-ui';
	import { cn } from '$lib/utils/cn';

	type Props = {
		open?: boolean;
		onOpenChange?: (open: boolean) => void;
		children?: import('svelte').Snippet;
		trigger?: import('svelte').Snippet;
		class?: string;
		triggerClass?: string;
		contentClass?: string;
		side?: 'top' | 'right' | 'bottom' | 'left';
		align?: 'start' | 'center' | 'end';
		sideOffset?: number;
	};

	let {
		open = $bindable(false),
		onOpenChange,
		children,
		trigger,
		triggerClass,
		contentClass,
		side = 'bottom',
		align = 'start',
		sideOffset = 8,
		...restProps
	}: Props = $props();

	// 상태 변경 시 콜백 호출
	$effect(() => {
		onOpenChange?.(open);
	});
</script>

<DropdownMenu.Root bind:open {...restProps}>
	<DropdownMenu.Trigger
		class={cn(
			'focus-visible:ring-ring inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50',
			triggerClass
		)}
	>
		{#if trigger}
			{@render trigger()}
		{/if}
	</DropdownMenu.Trigger>

	<DropdownMenu.Content
		class={cn(
			'z-50 min-w-[8rem] overflow-hidden rounded-md border border-surface-300-700 bg-surface-100-900 p-1 text-surface-900-100 shadow-md',
			contentClass
		)}
		{side}
		{align}
		{sideOffset}
	>
		{#if children}
			{@render children()}
		{/if}
	</DropdownMenu.Content>
</DropdownMenu.Root>
