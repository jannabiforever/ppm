<script lang="ts">
	import { ListTodo, CheckSquare, FileText } from '@lucide/svelte';
	import { onMount } from 'svelte';

	let { childProjects }: { childProjects: App.ChildProject[] } = $props();

	// 총 작업 수 계산
	let totalTasksCount = $derived(childProjects.reduce((sum, cp) => sum + cp.taskIds.length, 0));
	
	// 반응형 디스플레이 관련 상태
	let displayCount = $state(3);
	let windowWidth = $state(1024);
	
	// 화면 크기에 따라 표시할 항목 수 결정
	function updateDisplayCount() {
		if (windowWidth < 640) {
			displayCount = 2;
		} else if (windowWidth < 1024) {
			displayCount = 3;
		} else if (windowWidth < 1280) {
			displayCount = 4;
		} else {
			displayCount = 5;
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

<div class="bg-surface-100-800 border-surface-200-700 mt-3 rounded-md border p-4">
	<div class="mb-3 flex items-center justify-between">
		<div class="flex items-center gap-2">
			<ListTodo class="text-surface-500 size-4" />
			<span class="font-medium">세부 프로젝트 요약</span>
		</div>
		<span class="badge variant-soft-surface">
			{childProjects.length}개
		</span>
	</div>

	<!-- 작업 통계 -->
	<div class="text-surface-600-300 mb-3 flex items-center gap-3 text-sm">
		<div class="flex items-center gap-1">
			<CheckSquare class="text-surface-500 size-4" />
			<span>전체 작업: {totalTasksCount}개</span>
		</div>
	</div>

	<!-- 프로젝트 목록 (반응형) -->
	{#if childProjects.length > 0}
		<div class="mt-3">
			<div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2">
				{#each childProjects.slice(0, displayCount) as childProject, i (i)}
					<div
						class="bg-surface-50-900 border-surface-200-700 flex flex-col rounded border p-3 h-full"
					>
						<div class="truncate font-medium mb-2">{childProject.name}</div>
						<div class="badge variant-soft-surface text-xs self-start mt-auto">
							{childProject.taskIds.length}개 작업
						</div>
					</div>
				{/each}
			</div>
			{#if childProjects.length > displayCount}
				<div class="text-surface-500 mt-3 text-center text-xs">
					외 {childProjects.length - displayCount}개 더 있음
				</div>
			{/if}
		</div>
	{:else}
		<div
			class="bg-surface-50-900 border-surface-300-600 rounded-md border border-dashed py-3 text-center"
		>
			<FileText class="text-surface-500 mx-auto mb-2 size-5 opacity-50" />
			<p class="text-surface-600-300 text-sm">등록된 세부 프로젝트가 없습니다</p>
		</div>
	{/if}
</div>
