<script lang="ts">
	import { ListTodo, CheckSquare, FileText } from '@lucide/svelte';
	import { onMount } from 'svelte';

	let {
		childProjects,
		tasksMap = {}
	}: {
		childProjects: App.ChildProject[];
		tasksMap?: Record<string, App.Task>;
	} = $props();

	// 반응형 디스플레이 관련 상태
	let displayCount = $state(3);
	let windowWidth = $state(1024);

	// 화면 크기에 따라 표시할 항목 수 결정
	function updateDisplayCount() {
		if (windowWidth < 640) {
			displayCount = 2;
		} else if (windowWidth < 1024) {
			displayCount = 3;
		}
	}

	// 창 크기 변경 감지
	onMount(() => {
		windowWidth = window.innerWidth;
		updateDisplayCount();

		const handleResize = () => {
			windowWidth = window.innerWidth;
			updateDisplayCount();
		};

		window.addEventListener('resize', handleResize);
		return () => window.removeEventListener('resize', handleResize);
	});
</script>

<div class="bg-surface-100-800 rounded-md">
	<!-- 프로젝트 목록 (반응형) -->
	{#if childProjects.length > 0}
		<div class="mt-3">
			<div class="grid grid-cols-1 gap-2 sm:grid-cols-2 md:grid-cols-3">
				{#each childProjects.slice(0, displayCount) as childProject, i (i)}
					<div
						class="bg-surface-50-900 border-surface-200-700 flex h-full flex-col rounded border p-3"
					>
						<div class="mb-2 flex items-center justify-between gap-2 font-medium">
							<div class="flex items-center gap-2">
								<ListTodo size={16} />
								{childProject.name}
							</div>
							<div class="badge variant-soft-surface mt-auto self-start text-xs">
								작업: {childProject.taskIds.length}개
							</div>
						</div>

						<!-- 최대 3개 작업 표시 -->
						{#if childProject.taskIds.length > 0}
							<div class="mt-2 space-y-1.5">
								{#each childProject.taskIds.slice(0, 3) as taskId (taskId)}
									{#if tasksMap[taskId]}
										<div class="bg-surface-100-800 flex items-center gap-2 rounded-sm text-sm">
											<CheckSquare
												class={`size-4 ${tasksMap[taskId].isDone ? 'text-primary-500' : 'text-surface-500'}`}
											/>
											<span class="truncate">{tasksMap[taskId].description}</span>
										</div>
									{:else}
										<div class="bg-surface-100-800 flex items-center gap-2 rounded-sm text-sm">
											<CheckSquare class="text-surface-500 size-4" />
											<span class="truncate">{taskId}</span>
										</div>
									{/if}
								{/each}

								{#if childProject.taskIds.length > 3}
									<div class="text-surface-500 mt-1.5 text-center text-xs">
										외 {childProject.taskIds.length - 3}개
									</div>
								{/if}
							</div>
						{:else}
							<div
								class="bg-surface-100-800 border-surface-300-600 mt-2 rounded-sm border border-dashed p-3 text-center"
							>
								<FileText class="text-surface-500 mx-auto mb-1 size-5 opacity-50" />
								<p class="text-surface-600-300 text-sm">등록된 작업이 없습니다</p>
							</div>
						{/if}
					</div>
				{/each}
			</div>
			{#if childProjects.length > displayCount}
				<div class="text-surface-500 mt-3 text-center text-xs">
					외 {childProjects.length - displayCount}개
				</div>
			{/if}
		</div>
	{:else}
		<p class="text-surface-500 text-center">세부 프로젝트가 없습니다</p>
	{/if}
</div>
