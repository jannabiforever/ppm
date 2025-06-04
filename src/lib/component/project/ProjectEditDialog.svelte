<script>
	import { Pencil, X } from '@lucide/svelte';
	import { Dialog } from 'bits-ui';
</script>

<Dialog.Root>
	<Dialog.Trigger class="btn hover:bg-surface-300-700">
		<Pencil class="mr-1 size-4" /> 수정
	</Dialog.Trigger>
	<Dialog.Portal>
		<Dialog.Overlay class="fixed inset-0 z-50 backdrop-blur-sm" />
		<Dialog.Content
			class="card bg-surface-50-950 fixed top-1/2 left-1/2 z-50 grid w-full max-w-lg -translate-x-1/2 -translate-y-1/2 gap-5 rounded-xl border-t-4 p-8 shadow-2xl"
		>
			<div class="flex items-center justify-between">
				<Dialog.Title class="flex items-start gap-2 text-2xl font-bold">
					<h3 class="h3 ml-3 flex flex-row">프로젝트 수정</h3>
				</Dialog.Title>
				<Dialog.Close
					class="btn-icon hover:bg-surface-300-700 h-8 w-8 transition-all  duration-200"
				>
					<X size={16} />
				</Dialog.Close>
			</div>
			<Dialog.Description></Dialog.Description>
			<Dialog.Close>
				<button class="btn">확인</button>
			</Dialog.Close>
		</Dialog.Content>
	</Dialog.Portal>
</Dialog.Root>
