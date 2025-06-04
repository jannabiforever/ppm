<script lang="ts">
	import { Dialog } from 'bits-ui';
	import { Plus, X } from '@lucide/svelte';

	let isDialogOpen = $state(false);
</script>

<Dialog.Root open={isDialogOpen} onOpenChange={(open) => (isDialogOpen = open)}>
	<Dialog.Trigger
		class="card border-surface-300 dark:border-surface-600 hover:bg-surface-100 dark:hover:bg-surface-800 flex flex-col items-center justify-center border border-dashed p-6 transition-all duration-200"
		onclick={() => (isDialogOpen = true)}
	>
		<div class="bg-surface-100 dark:bg-surface-800 mb-3 rounded-full p-3">
			<Plus />
		</div>
		<p class="font-medium">하위 프로젝트 추가</p>
	</Dialog.Trigger>
	<Dialog.Portal>
		<Dialog.Overlay class="fixed inset-0 z-50 backdrop-blur-sm" />
		<Dialog.Content
			class="card bg-surface-50-950 fixed top-1/2 left-1/2 z-50 grid w-full max-w-lg -translate-x-1/2 -translate-y-1/2 gap-5 rounded-xl border-t-4 p-8 shadow-2xl"
		>
			<div class="flex items-center justify-between">
				<Dialog.Title class="flex items-center gap-2 text-2xl font-bold">
					<span>하위 프로젝트 생성하기</span>
				</Dialog.Title>
				<Dialog.Close class="btn-icon hover:bg-surface-300-700 h-8 w-8 transition-all duration-200">
					<X size={16} />
				</Dialog.Close>
			</div>
		</Dialog.Content>
	</Dialog.Portal>
</Dialog.Root>
