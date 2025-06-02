<script lang="ts">
	import { enhance } from '$app/forms';
	import { invalidateAll } from '$app/navigation';
	import { Plus } from '@lucide/svelte';
	import FormField from '$lib/component/form/FormField.svelte';
	import FormMessage from '$lib/component/form/FormMessage.svelte';
	import PrioritySelector from '$lib/component/form/PrioritySelector.svelte';

	let {
		onClose,
		form
	}: {
		onClose: () => void;
		form?: { error?: string; success?: boolean };
	} = $props();

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
					onClose();
				}, 3000);
			} else if (result.error) {
				formError = result.error;
			}
		};
	}
</script>

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
	action="?/addNewProject"
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
			class="btn bg-error-400-600 h-10 px-4 transition-all duration-200"
			onclick={onClose}
			disabled={isSubmitting}
		>
			취소
		</button>
		<button
			type="submit"
			class="btn bg-primary-50-950 hover:bg-primary-200-800 flex h-10 items-center gap-1 px-5 font-medium transition-all duration-200"
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
		새로운 프로젝트는 생성 후 프로젝트 목록에 표시됩니다.
	</p>
</form>