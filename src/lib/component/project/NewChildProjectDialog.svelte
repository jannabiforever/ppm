<script lang="ts">
	import { Dialog } from 'bits-ui';
	import { Plus, X } from '@lucide/svelte';
	import PrioritySelector from '$lib/component/form/PrioritySelector.svelte';
	import FormField from '$lib/component/form/FormField.svelte';
	import FormMessage from '$lib/component/form/FormMessage.svelte';
	import { invalidateAll } from '$app/navigation';
	import { enhance } from '$app/forms';

	let { form } = $props();
	let isDialogOpen = $state(false);

	function closeDialog() {
		isDialogOpen = false;
	}

	// New project form data with state
	let newProject = $state({
		name: '',
		goal: '',
		priority: 'medium' as App.PriorityLevel
	});

	// Form validation state
	let nameError = $state('');
	let goalError = $state('');
	let priorityError = $state('');
	let showSuccessMessage = $state(false);
	let isSubmitting = $state(false);
	let formError = $state('');

	// Form submission handler
	function handleEnhance() {
		isSubmitting = true;
		showSuccessMessage = false;
		formError = '';

		// Form validation
		if (!newProject.name.trim()) {
			nameError = '프로젝트 이름은 필수입니다.';
			isSubmitting = false;
			return;
		}

		if (!newProject.goal.trim()) {
			goalError = '프로젝트 목표는 필수입니다.';
			isSubmitting = false;
			return;
		}

		return ({ result }: { result: { type: string; error?: string } }) => {
			isSubmitting = false;
			if (result.type === 'success') {
				invalidateAll();

				// 성공 메시지 표시
				showSuccessMessage = true;

				// 폼 초기화
				newProject.name = '';
				newProject.goal = '';
				newProject.priority = 'medium';

				// 다이얼로그 닫기
				setTimeout(() => {
					closeDialog();
				}, 3000);
			} else if (result.error) {
				formError = result.error;
			}
		};
	}
</script>

<Dialog.Root bind:open={isDialogOpen}>
	<Dialog.Trigger
		class="card border-surface-300-700 hover:bg-surface-100-900 flex h-full min-h-[250px] flex-col items-center justify-center border border-dashed p-6 transition-all duration-200"
		onclick={() => (isDialogOpen = true)}
	>
		<div class="bg-surface-100-900 mb-4 rounded-full p-4">
			<Plus size={20} />
		</div>
		<p class="font-medium">세부 프로젝트 생성</p>
	</Dialog.Trigger>
	<Dialog.Portal>
		<Dialog.Overlay class="fixed inset-0 z-50 backdrop-blur-sm" />
		<Dialog.Content
			class="card bg-surface-50-950 primary-300 fixed top-1/2 left-1/2 z-50 grid w-full max-w-lg -translate-x-1/2 -translate-y-1/2 gap-5 rounded-xl border-t-4 p-8 shadow-2xl"
		>
			<div class="flex items-center justify-between">
				<Dialog.Title class="flex items-center gap-2 text-2xl font-bold">
					<span>세부 프로젝트 생성하기</span>
				</Dialog.Title>
				<Dialog.Close class="btn-icon hover:bg-surface-300-700 h-8 w-8 transition-all duration-200">
					<X size={16} />
				</Dialog.Close>
			</div>

			{#if showSuccessMessage}
				<FormMessage type="success" message="프로젝트가 성공적으로 생성되었습니다!" />
			{/if}

			{#if formError}
				<FormMessage type="error" message={formError} />
			{/if}
			{#if form?.error && !form?.success}
				<FormMessage type="error" message={form.error} />
			{/if}

			<form
				class="grid gap-6"
				method="POST"
				action="?/createChildProject"
				use:enhance={handleEnhance}
			>
				<FormField
					id="name"
					name="name"
					label="Name"
					value={newProject.name}
					placeholder="예) 세부 프로젝트1"
					maxlength={50}
					error={nameError}
					onInput={(e) => {
						if (e.target && 'value' in e.target) {
							newProject.name = String(e.target.value);
						}
					}}
				/>

				<FormField
					id="goal"
					name="goal"
					label="Goal"
					value={newProject.goal}
					placeholder="예) 더 나은 사람이 되기 위함"
					maxlength={100}
					error={goalError}
					onInput={(e) => {
						if (e.target && 'value' in e.target) {
							newProject.goal = String(e.target.value);
						}
					}}
				/>

				<div class="mt-2 flex justify-end gap-3">
					<button
						type="button"
						class="btn hover:bg-surface-300-700 h-10 px-4 transition-all duration-200"
						onclick={closeDialog}
						disabled={isSubmitting}
					>
						취소
					</button>
					<button
						type="submit"
						class="btn hover:bg-surface-300-700 flex h-10 items-center gap-1 px-5 font-medium transition-all duration-200"
						disabled={isSubmitting}
					>
						{#if isSubmitting}
							<div
								class="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"
							></div>
							<span class="ml-2">Submitting...</span>
						{:else}
							<Plus size={16} />
							생성하기
						{/if}
					</button>
				</div>
				<p class="mt-3 border-t pt-3 text-center text-xs">
					새로운 세부 프로젝트는 생성 후 세부 프로젝트 목록에 표시됩니다.
				</p>
			</form>
		</Dialog.Content>
	</Dialog.Portal>
</Dialog.Root>
