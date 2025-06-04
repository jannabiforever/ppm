<script lang="ts">
	import { FileText, ListTodo, CheckSquare } from '@lucide/svelte';

	let { childProject }: { childProject: App.ChildProject } = $props();
</script>

<div class="card p-4 shadow-md hover:shadow-lg transition-all duration-200 h-full min-h-[250px] flex flex-col">
	<header class="pb-3 border-b border-surface-200-700">
		<div class="flex items-center gap-3">
			<h5 class="h5 font-semibold">{childProject.name}</h5>
			<div class="vr pl-3 text-surface-600-300">{childProject.goal}</div>
		</div>
	</header>

	<section class="py-5 flex-grow">
		<div class="flex items-center justify-between mb-3">
			<div class="flex items-center gap-2">
				<ListTodo class="size-4 text-surface-500" />
				<span class="text-sm font-semibold">작업</span>
			</div>
			<span class="badge variant-soft-surface text-xs font-medium">
				{childProject.taskIds.length}개
			</span>
		</div>

		{#if childProject.taskIds.length > 0}
			<div class="space-y-2 max-h-40 overflow-y-auto pr-1">
				{#each childProject.taskIds as taskId (taskId)}
					<div class="flex items-center gap-2 p-2 rounded-md bg-surface-50-900 border border-surface-200-700">
						<CheckSquare class="size-4 text-surface-500" />
						<span class="text-sm truncate">{taskId}</span>
					</div>
				{/each}
			</div>
		{:else}
			<div class="bg-surface-50-900 rounded-md py-10 text-center border border-dashed border-surface-300-600">
				<FileText class="mx-auto mb-2 size-6 opacity-50 text-surface-500" />
				<p class="text-sm text-surface-600-300">등록된 작업이 없습니다</p>
			</div>
		{/if}
	</section>

	<footer class="pt-3 mt-auto border-t border-surface-200-700 flex justify-end items-center">
		<button class="btn btn-sm variant-soft-surface">상세보기</button>
	</footer>
</div>
