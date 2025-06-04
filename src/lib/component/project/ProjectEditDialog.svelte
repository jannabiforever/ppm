<script lang="ts">
	import { Dialog } from 'bits-ui';
	import { Pencil, X } from '@lucide/svelte';
	import PrioritySelector from '$lib/component/form/PrioritySelector.svelte';
	import FormField from '$lib/component/form/FormField.svelte';
	import FormMessage from '$lib/component/form/FormMessage.svelte';
	import { invalidateAll } from '$app/navigation';
	import { enhance } from '$app/forms';

	let { rootProject, form } = $props();
	let isDialogOpen = $state(false);

	function closeDialog() {
		isDialogOpen = false;
	}

	// New project form data with state
	let newProject = $state({
		name: rootProject.name,
		goal: rootProject.goal,
		priority: rootProject.priority
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
	<Dialog.Trigger class="btn hover:bg-surface-300-700" onclick={() => (isDialogOpen = true)}>
		<Pencil class="mr-1 size-4" /> 수정
	</Dialog.Trigger>
	<Dialog.Portal>
		<Dialog.Overlay class="fixed inset-0 z-50 backdrop-blur-sm" />
		<Dialog.Content
			class="card bg-surface-50-950 primary-300 fixed top-1/2 left-1/2 z-50 grid w-full max-w-lg -translate-x-1/2 -translate-y-1/2 gap-5 rounded-xl border-t-4 p-8 shadow-2xl"
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
				action="?/updateRootProject"
				use:enhance={handleEnhance}
			>
				<FormField
					id="name"
					name="name"
					label="Name"
					value={newProject.name}
					placeholder="예) 프로젝트1"
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

				<PrioritySelector
					value={newProject.priority}
					name="priority"
					error={priorityError}
					onChange={(value) => {
						newProject.priority = value;
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
							<span class="ml-2">Submitting...</span>
						{:else}
							수정하기
						{/if}
					</button>
				</div>
			</form>
		</Dialog.Content>
	</Dialog.Portal>
</Dialog.Root>
