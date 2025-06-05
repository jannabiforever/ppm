<script lang="ts">
	import { TriangleAlert, Trash2, X, CheckCircle, XCircle } from '@lucide/svelte';
	import { Dialog } from 'bits-ui';
	import { enhance } from '$app/forms';
	import { goto } from '$app/navigation';
	import { browser } from '$app/environment';

	let {
		entityName = '',
		entityId = '',
		actionPath = '',
		inputName = 'id',
		warningMessage = '해당 작업은 복구할 수 없습니다. 그래도 진행하시겠습니까?',
		buttonText = '삭제',
		triggerButtonClass = 'btn-icon btn-sm variant-soft-surface hover:variant-soft-error',
		triggerContent,
		onSuccess = undefined,
		onError = undefined,
		form = undefined,
		navigateTo = undefined,
		successMessage = undefined,
		waitTimeBeforeNavigate = 3000,
		reloadPage = false
	}: {
		entityName?: string;
		entityId?: string;
		actionPath?: string;
		inputName?: string;
		warningMessage?: string;
		buttonText?: string;
		triggerButtonClass?: string;
		triggerContent?: import('svelte').Snippet;
		onSuccess?: () => void;
		onError?: (message?: string) => void;
		form?: unknown;
		navigateTo?: string;
		successMessage?: string;
		waitTimeBeforeNavigate?: number;
		reloadPage?: boolean;
	} = $props();

	let dialogOpen = $state(false);
	let showingConfirmButton = $state(false);
	let showingSuccessMessage = $state(false);
	let showingFailureMessage = $state(false);
	let failureMessage = $state('');

	function startTimer() {
		showingConfirmButton = false;
		setTimeout(() => {
			showingConfirmButton = true;
		}, 1000);
	}

	function handleDeleteSuccess() {
		showingSuccessMessage = true;
		setTimeout(() => {
			if (navigateTo) {
				goto(navigateTo);
			} else if (reloadPage && browser) {
				window.location.reload();
			} else {
				dialogOpen = false;
				showingSuccessMessage = false;
				if (onSuccess) onSuccess();
			}
		}, (navigateTo || reloadPage) ? waitTimeBeforeNavigate : 2000);
	}

	function handleDeleteFailure(message?: string) {
		showingFailureMessage = true;
		failureMessage = message || `${entityName} 삭제 중 오류가 발생했습니다.`;
		setTimeout(() => {
			showingFailureMessage = false;
			failureMessage = '';
			if (onError) onError(message);
		}, 5000);
	}
</script>

<Dialog.Root
	open={dialogOpen}
	onOpenChange={(open) => {
		dialogOpen = open;
		if (open) startTimer();
	}}
>
	<Dialog.Trigger class={triggerButtonClass}>
		{#if triggerContent}
			{@render triggerContent()}
		{:else}
			<Trash2 class="size-4" />
			<span class="sr-only">{entityName} 삭제</span>
		{/if}
	</Dialog.Trigger>
	<Dialog.Portal>
		<Dialog.Overlay class="fixed inset-0 z-50 backdrop-blur-sm" />
		<Dialog.Content
			class="card bg-surface-50-950 fixed top-1/2 left-1/2 z-50 grid w-full max-w-lg -translate-x-1/2 -translate-y-1/2 gap-5 rounded-xl border-t-4 p-8 shadow-2xl"
		>
			<div class="flex items-center justify-between">
				<Dialog.Title class="flex items-center gap-2 text-2xl font-bold">
					<h3 class="h3 ml-3 flex flex-row">{entityName} 삭제</h3>
				</Dialog.Title>
				<Dialog.Close class="btn-icon hover:bg-surface-300-700 h-8 w-8 transition-all duration-200">
					<X size={16} />
				</Dialog.Close>
			</div>

			{#if showingSuccessMessage}
				<div class="preset-tonal-success flex items-center gap-3 p-4 text-center">
					<CheckCircle />
					{successMessage || `${entityName}이(가) 성공적으로 삭제되었습니다.${navigateTo ? ` ${Math.ceil(waitTimeBeforeNavigate / 1000)}초 후 이동합니다.` : ''}`}
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
						{warningMessage}
					</div>
				</Dialog.Description>

				<div class="flex w-full justify-center">
					{#if showingConfirmButton}
						<form
							action={actionPath}
							method="POST"
							class="w-full justify-center"
							use:enhance={() => {
								return async ({ result }) => {
									if (result.type === 'success') {
										handleDeleteSuccess();
									} else if (result.type === 'failure') {
										const message =
											(result.data && typeof result.data === 'object' && 'error' in result.data
												? String(result.data.error)
												: undefined) ||
											(form && typeof form === 'object' && 'error' in form
												? String(form.error)
												: undefined) ||
											`${entityName} 삭제 중 오류가 발생했습니다.`;
										handleDeleteFailure(message);
									} else if (result.type === 'error') {
										handleDeleteFailure('서버 오류가 발생했습니다.');
									}
								};
							}}
						>
							<input type="hidden" name={inputName} value={entityId} />
							<button type="submit" class="btn hover:bg-surface-300-700 w-full p-4"
								>{buttonText}</button
							>
						</form>
					{/if}
				</div>
			{/if}
		</Dialog.Content>
	</Dialog.Portal>
</Dialog.Root>
