<script lang="ts">
	import { TriangleAlert, Trash, X, CheckCircle, XCircle } from '@lucide/svelte';
	import { Dialog } from 'bits-ui';
	import { enhance } from '$app/forms';
	import { goto } from '$app/navigation';

	let { form } = $props();

	let showingConfirmButton = $state(false);
	let dialogOpen = $state(false);
	let showingSuccessMessage = $state(false);
	let showingFailureMessage = $state(false);
	let failureMessage = $state('');

	function startTimer() {
		showingConfirmButton = false;
		setTimeout(() => {
			showingConfirmButton = true;
		}, 3000);
	}

	function handleDeleteSuccess() {
		showingSuccessMessage = true;
		setTimeout(() => {
			goto('/projects');
		}, 3000);
	}

	function handleDeleteFailure(message?: string) {
		showingFailureMessage = true;
		failureMessage = message || '프로젝트 삭제 중 오류가 발생했습니다.';
		setTimeout(() => {
			showingFailureMessage = false;
			failureMessage = '';
		}, 5000);
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

			{#if showingSuccessMessage}
				<div class="preset-tonal-success flex items-center gap-3 p-4 text-center">
					<CheckCircle />
					프로젝트가 성공적으로 삭제되었습니다. 3초 후 프로젝트 목록으로 이동합니다.
				</div>
			{:else if showingFailureMessage}
				<div class="preset-tonal-error flex items-center gap-3 p-4 text-center">
					<XCircle />
					{failureMessage}
				</div>
			{:else}
				<Dialog.Description>
					<div class="preset-tonal-warning flex items-center gap-3 p-4 text-center">
						<TriangleAlert />
						해당 작업은 복구할 수 없습니다. 그래도 진행하시겠습니까?
					</div>
				</Dialog.Description>

				<div class="flex w-full justify-center">
					{#if showingConfirmButton}
						<form
							action="?/deleteRootProject"
							method="POST"
							class="w-full justify-center"
							use:enhance={() => {
								return async ({ result }) => {
									if (result.type === 'success') {
										handleDeleteSuccess();
									} else if (result.type === 'failure') {
										const message =
											result.data?.message ||
											form?.message ||
											'프로젝트 삭제 중 오류가 발생했습니다.';
										handleDeleteFailure(message);
									} else if (result.type === 'error') {
										handleDeleteFailure('서버 오류가 발생했습니다.');
									}
								};
							}}
						>
							<button type="submit" class="btn hover:bg-surface-300-700 w-full p-4"> 확인 </button>
						</form>
					{/if}
				</div>
			{/if}
		</Dialog.Content>
	</Dialog.Portal>
</Dialog.Root>
