<script>
	import { TriangleAlert, Trash, X } from '@lucide/svelte';
	import { Dialog } from 'bits-ui';

	let showingConfirmButton = $state(false);
	let dialogOpen = $state(false);

	function startTimer() {
		showingConfirmButton = false;
		setTimeout(() => {
			showingConfirmButton = true;
		}, 3000);
	}
</script>

<Dialog.Root open={dialogOpen} onOpenChange={(open) => open && startTimer()}>
	<Dialog.Trigger class="btn hover:bg-surface-300-700">
		<Trash class="mr-1 size-4" /> 삭제
	</Dialog.Trigger>
	<Dialog.Portal>
		<Dialog.Overlay class="fixed inset-0 z-50 backdrop-blur-sm" />
		<Dialog.Content
			class="card bg-surface-50-950 fixed top-1/2 left-1/2 z-50 grid w-full max-w-lg -translate-x-1/2 -translate-y-1/2 gap-5 rounded-xl border-t-4 p-8 shadow-2xl"
		>
			<div class="flex items-center justify-between">
				<Dialog.Title class="flex items-center gap-2 text-2xl font-bold">
					<h3 class="h3 ml-3 flex flex-row">프로젝트 삭제</h3>
				</Dialog.Title>
				<Dialog.Close class="btn-icon hover:bg-surface-300-700 h-8 w-8 transition-all duration-200">
					<X size={16} />
				</Dialog.Close>
			</div>
			<Dialog.Description>
				<div class="preset-tonal-warning flex items-center gap-3 p-4 text-center">
					<TriangleAlert />
					해당 작업은 복구할 수 없습니다. 그래도 진행하시겠습니까?
				</div>
			</Dialog.Description>
			<div class="flex w-full justify-center">
				{#if showingConfirmButton}
					<Dialog.Close
						class="btn hover:bg-surface-300-700 w-1/2"
						type="submit"
						onclick={() => console.log('삭제')}
					>
						확인
					</Dialog.Close>
				{/if}
			</div>
		</Dialog.Content>
	</Dialog.Portal>
</Dialog.Root>
