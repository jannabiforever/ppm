<script lang="ts">
	import { Dialog } from 'bits-ui';
	import { enhance } from '$app/forms';
	import ProjectContainer from '$lib/component/ProjectContainer.svelte';
	import type { PageProps } from './$types';
	import { Plus, X, Check } from '@lucide/svelte';
	import { invalidateAll } from '$app/navigation';

	let { data, form }: PageProps = $props();

	const isFocused = (i: number) => {
		return i === 0 || i === 1;
	};

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

	let isDialogOpen = $state(false);

	// 페이지 로드 시 초기화
	$effect(() => {
		if (!isDialogOpen) {
			// 다이얼로그가 닫힐 때 성공 메시지 및 폼 초기화
			showSuccessMessage = false;
			nameError = '';
			goalError = '';
			priorityError = '';
		}
	});
</script>

<div class="grid grid-cols-1 gap-6 md:grid-cols-2">
	{#each data.projects as project, i (i)}
		<ProjectContainer {project} isFocused={isFocused(i)} />
	{/each}

	<Dialog.Root open={isDialogOpen} onOpenChange={(open) => (isDialogOpen = open)}>
		<Dialog.Trigger
			class="card border-surface-300 dark:border-surface-600 hover:bg-surface-100 dark:hover:bg-surface-800 flex flex-col items-center justify-center border border-dashed p-6 transition-all duration-200"
			onclick={() => (isDialogOpen = true)}
		>
			<div class="bg-surface-100 dark:bg-surface-800 mb-3 rounded-full p-3">
				<Plus />
			</div>
			<p class="font-medium">새 프로젝트</p>
		</Dialog.Trigger>
		<Dialog.Portal>
			<Dialog.Overlay class="fixed inset-0 z-50 backdrop-blur-sm" />
			<Dialog.Content
				class="card bg-surface-50-950 primary-300 fixed top-1/2 left-1/2 z-50 grid w-full max-w-lg -translate-x-1/2 -translate-y-1/2 gap-5 rounded-xl border-t-4 p-8 shadow-2xl"
			>
				<div class="flex items-center justify-between">
					<Dialog.Title class="flex items-center gap-2 text-2xl font-bold">
						<span>새 프로젝트 생성하기</span>
					</Dialog.Title>
					<Dialog.Close
						class="btn-icon bg-primary-50-950 hover:bg-primary-600 h-8 w-8 rounded-full transition-all duration-200"
					>
						<X size={16} />
					</Dialog.Close>
				</div>

				{#if showSuccessMessage}
					<div
						class="bg-success-600/20 border-success-400 flex animate-pulse items-center gap-2 rounded-lg border p-4 backdrop-blur-sm"
					>
						<div class="bg-success-400 rounded-full p-1">
							<Check size={14} class="text-success-900" />
						</div>
						<span class="font-medium">프로젝트가 성공적으로 생성되었습니다!</span>
					</div>
				{/if}
				{#if form?.error && !form?.success}
					<div
						class="flex items-center gap-2 rounded-lg border border-red-400 bg-red-600/20 p-4 text-red-100 backdrop-blur-sm"
					>
						<div class="rounded-full bg-red-400 p-1">
							<X size={14} class="text-red-900" />
						</div>
						<span class="font-medium">{form.error}</span>
					</div>
				{/if}
				<form
					class="grid gap-6"
					method="POST"
					action="?/addNewProject"
					use:enhance={() => {
						isSubmitting = true;
						showSuccessMessage = false;

						return ({ result }) => {
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
									isDialogOpen = false;
								}, 3000);
							}
						};
					}}
				>
					<div class="grid gap-2">
						<label for="name" class="flex items-center gap-1.5 text-sm font-medium"> Name </label>
						<input
							type="text"
							id="name"
							name="name"
							class="input border-primary-400/30 focus:border-primary-300 h-11 rounded-lg border text-sm"
							bind:value={newProject.name}
							placeholder="예) 프로젝트1"
							maxlength="50"
							required
						/>
						{#if nameError}
							<p class="mt-1 flex items-center gap-1 text-xs font-medium text-red-200">
								<X size={12} class="text-red-300" />
								{nameError}
							</p>
						{/if}
					</div>

					<div class="grid gap-2">
						<label for="goal" class="flex items-center gap-1.5 text-sm font-medium"> Goal </label>
						<input
							type="text"
							id="goal"
							name="goal"
							class="input border-primary-400/30 focus:border-primary-300 h-11 rounded-lg border text-sm"
							bind:value={newProject.goal}
							placeholder="예) 더 나은 사람이 되기 위함"
							maxlength="100"
							required
						/>
						{#if goalError}
							<p class="mt-1 flex items-center gap-1 text-xs font-medium text-red-200">
								<X size={12} class="text-red-300" />
								{goalError}
							</p>
						{/if}
					</div>

					<div class="grid gap-2">
						<label for="priority" class="flex items-center gap-1.5 text-sm font-medium">
							중요도
						</label>
						<div class="grid grid-cols-3 gap-2">
							<label
								class="border-primary-400/30 hover:border-primary-400/50 flex cursor-pointer items-center gap-2 rounded-lg border p-3"
							>
								<input
									type="radio"
									name="priority"
									value="high"
									bind:group={newProject.priority}
									class="h-4 w-4 accent-red-500"
								/>
								<span class="font-medium text-red-500">High</span>
							</label>
							<label
								class="border-primary-400/30 hover:border-primary-400/50 flex cursor-pointer items-center gap-2 rounded-lg border p-3"
							>
								<input
									type="radio"
									name="priority"
									value="medium"
									bind:group={newProject.priority}
									class="h-4 w-4 accent-yellow-500"
									checked
								/>
								<span class="font-medium text-yellow-500">Medium</span>
							</label>
							<label
								class="border-primary-400/30 hover:border-primary-400/50 flex cursor-pointer items-center gap-2 rounded-lg border p-3"
							>
								<input
									type="radio"
									name="priority"
									value="low"
									bind:group={newProject.priority}
									class="h-4 w-4 accent-green-500"
								/>
								<span class="font-medium text-green-500">Low</span>
							</label>
						</div>
						{#if priorityError}
							<p class="mt-1 flex items-center gap-1 text-xs font-medium text-red-200">
								<X size={12} class="text-red-300" />
								{priorityError}
							</p>
						{/if}
					</div>

					<div class="mt-2 flex justify-end gap-3">
						<button
							type="button"
							class="btn bg-error-400-600 h-10 px-4 transition-all duration-200"
							onclick={() => (isDialogOpen = false)}
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
			</Dialog.Content>
		</Dialog.Portal>
	</Dialog.Root>
</div>
