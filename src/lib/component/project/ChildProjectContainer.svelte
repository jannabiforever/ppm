<script lang="ts">
	import { FileText, ListTodo, CheckSquare, Plus } from '@lucide/svelte';
	import TaskItem from '$lib/component/task/TaskItem.svelte';

	let {
		childProject,
		action,
		tasksMap = {}
	}: {
		childProject: App.ChildProject;
		action: string;
		tasksMap?: Record<string, App.Task>;
	} = $props();

	let mode = $state<'view' | 'edit'>('view');

	const toggleToView = () => {
		mode = 'view';
	};

	const toggleToEdit = () => {
		mode = 'edit';
	};
</script>

<div
	class="card flex h-full min-h-[250px] flex-col p-4 shadow-md transition-all duration-200 hover:shadow-lg"
>
	<header class="border-surface-200-700 border-b pb-3">
		<div class="flex items-center gap-3">
			<h5 class="h5 font-semibold">{childProject.name}</h5>
			<div class="vr text-surface-600-300 pl-3">{childProject.goal}</div>
		</div>
	</header>

	<section class="flex-grow py-5">
		<div class="mb-3 flex items-center justify-between">
			<div class="flex items-center gap-2">
				<ListTodo class="text-surface-500 size-4" />
				<span class="text-sm font-semibold">작업</span>
			</div>
			<span class="badge variant-soft-surface text-xs font-medium">
				{childProject.taskIds.length}개
			</span>
		</div>

		{#if childProject.taskIds.length > 0}
			<div class="max-h-40 space-y-2 overflow-y-auto pr-1">
				{#each childProject.taskIds as taskId (taskId)}
					{#if tasksMap[taskId]}
						<TaskItem task={tasksMap[taskId]} />
					{:else}
						<div
							class="bg-surface-50-900 border-surface-200-700 flex items-center gap-2 rounded-md border p-2"
						>
							<CheckSquare class="text-surface-500 size-4" />
							<span class="truncate text-sm">{taskId}</span>
						</div>
					{/if}
				{/each}
			</div>
		{:else}
			<div
				class="bg-surface-50-900 border-surface-300-600 rounded-md border border-dashed py-10 text-center"
			>
				<FileText class="text-surface-500 mx-auto mb-2 size-6 opacity-50" />
				<p class="text-surface-600-300 text-sm">등록된 작업이 없습니다</p>
			</div>
		{/if}
	</section>

	<footer
		class="border-surface-200-700 mt-auto flex h-12 items-center justify-between border-t pt-3"
	>
		{#if mode === 'edit'}
			<form {action} method="POST" class="flex w-full gap-2">
				<div class="input-group flex w-full">
					<input class="input-ghost" type="hidden" name="childProjectId" value={childProject.id} />
					<input
						class="ig-input placeholder:text-xs"
						type="text"
						name="description"
						placeholder="작업 설명"
					/>
					<button class="ig-btn btn-sm preset-filled-surface-500" type="submit">생성</button>
					<button
						class="ig-btn btn-sm preset-filled-error-500"
						type="button"
						onclick={toggleToView}
					>
						취소
					</button>
				</div>
			</form>
		{:else}
			<button
				class="btn btn-sm hover:bg-surface-300-700 flex items-center gap-2 pt-1 pb-1 transition-all duration-200"
				onclick={toggleToEdit}
			>
				<Plus size={16} class="text-surface-500" />
				작업 추가
			</button>
		{/if}
	</footer>
</div>
