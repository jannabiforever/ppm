<script>
	import { Trash, X } from '@lucide/svelte';
	import { Dialog } from 'bits-ui';
</script>

<Dialog.Root>
	<Dialog.Trigger class="btn btn-sm hover:bg-surface-300-700">
		<Trash class="mr-1 size-4" /> 삭제
	</Dialog.Trigger>
	<Dialog.Portal>
		<Dialog.Overlay class="fixed inset-0 z-50 backdrop-blur-sm" />
		<Dialog.Content
			class="card bg-surface-50-950 fixed top-1/2 left-1/2 z-50 grid w-full max-w-lg -translate-x-1/2 -translate-y-1/2 gap-5 rounded-xl border-t-4 p-8 shadow-2xl"
		>
			<div class="flex items-center justify-between">
				<Dialog.Title class="flex items-center gap-2 text-2xl font-bold">
					<h3 class="h3">주의!</h3>
				</Dialog.Title>
				<Dialog.Close class="btn-icon h-8 w-8 rounded-full border transition-all duration-200">
					<X size={16} />
				</Dialog.Close>
			</div>
			<Dialog.Description />
			<Dialog.Close />
		</Dialog.Content>
	</Dialog.Portal>
</Dialog.Root>
