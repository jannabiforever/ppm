<script lang="ts">
	import { Dialog, Separator } from 'bits-ui';
	import { X } from 'lucide-svelte';
	import { type Snippet } from 'svelte';

	let {
		trigger,
		triggerClass = '',
		contentWidthClass = 'w-full',
		title,
		content,
		description = '',
		open = $bindable(false),
		onOpenChange
	}: {
		trigger?: Snippet<[]>;
		triggerClass?: string;
		contentWidthClass?: string;
		title: string;
		content: Snippet<[]>;
		description?: string;
		open?: boolean;
		onOpenChange?: (open: boolean) => void;
	} = $props();

	let overlayAnimateClass = $derived(open ? 'animate-in fade-in-0' : 'animate-out fade-out-0');
	let contentAnimateClass = $derived(
		open ? 'animate-in fade-in-0 zoom-in-95' : 'animate-out fade-out-0 zoom-out-95'
	);
</script>

<Dialog.Root bind:open {onOpenChange}>
	{#if trigger}
		<Dialog.Trigger class={triggerClass}>
			{@render trigger()}
		</Dialog.Trigger>
	{/if}
	<Dialog.Portal>
		<Dialog.Overlay class="{overlayAnimateClass} fixed inset-0 z-50 bg-surface-950/80" />
		<Dialog.Content
			class="{contentAnimateClass} fixed top-[50%] left-[50%] z-50 {contentWidthClass} max-w-[calc(100%-2rem)] translate-x-[-50%] translate-y-[-50%] rounded-[20px] border bg-surface-50-950 p-5 outline-hidden sm:max-w-[490px]"
		>
			<Dialog.Title
				class="flex w-full items-center justify-center text-lg heading-font-weight tracking-tight"
			>
				{title}
			</Dialog.Title>
			<Dialog.Close
				class="absolute top-5 right-5 rounded-md focus-visible:ring-2 focus-visible:ring-surface-950 focus-visible:ring-offset-2 focus-visible:outline-hidden active:scale-[0.98]"
			>
				<div>
					<X size={24} />
					<span class="sr-only">Close</span>
				</div>
			</Dialog.Close>
			<Separator.Root class="-mx-5 mt-5 mb-2 block h-px bg-surface-300" />
			{#if description}
				<Dialog.Description class="text-sm">
					{description}
				</Dialog.Description>
			{/if}
			{@render content()}
		</Dialog.Content>
	</Dialog.Portal>
</Dialog.Root>
