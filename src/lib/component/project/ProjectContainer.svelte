<script lang="ts">
	import { ArrowUpRight } from '@lucide/svelte';
	import PriorityChip from '$lib/component/PriorityChip.svelte';
	import ChildProjectSummaryContainer from '$lib/component/project/ChildProjectSummaryContainer.svelte';

	let {
		rootProject,
		childProjects
	}: {
		rootProject: App.RootProject;
		childProjects: App.ChildProject[];
	} = $props();

	// 테마 추출
	let theme: 'primary' | 'error' | 'warning' | 'surface' = $derived.by(() => {
		switch (rootProject.priority) {
			case 'system':
				return 'primary';
			case 'high':
				return 'error';
			case 'medium':
				return 'warning';
			case 'low':
				return 'surface';
		}
	});

	let isPriorityHigh = $derived(
		rootProject.priority === 'high' || rootProject.priority === 'system'
	);

	// 정적 클래스 맵
	type ThemeClassMapType = {
		[key in 'primary' | 'error' | 'warning' | 'surface']: {
			card: string;
			button: string;
		};
	};

	const themeClassMap: ThemeClassMapType = {
		primary: {
			card: 'variant-soft-primary border-primary-500',
			button: 'hover:bg-primary-300-700'
		},
		error: {
			card: 'variant-soft-error border-error-500',
			button: 'hover:bg-error-300-700'
		},
		warning: {
			card: 'variant-soft-warning border-warning-500',
			button: 'hover:bg-warning-300-700'
		},
		surface: {
			card: 'variant-soft-surface border-surface-500',
			button: 'hover:bg-surface-300-700'
		}
	};
</script>

<!-- 카드 본문 -->
<div
	class={`card border-l-8 shadow-lg transition-all duration-200 hover:translate-y-[-2px] hover:shadow-xl ${
		themeClassMap[theme].card
	} ${isPriorityHigh ? 'col-span-full' : ''}`}
>
	<header class="flex items-center justify-between gap-2 p-6 pb-0">
		<div class="flex items-center gap-3">
			<h4 class="h4 font-semibold">
				{rootProject.name}
			</h4>
			<span class="vr pl-3 text-end">{rootProject.goal}</span>
		</div>
		<div class="flex items-center">
			<PriorityChip priority={rootProject.priority} />
		</div>
	</header>
	{#if isPriorityHigh}
		<section class="p-6 pb-0">
			{#if childProjects.length > 0}
				<ChildProjectSummaryContainer {childProjects} />
			{:else}
				<p class="text-surface-500 text-center">세부 프로젝트가 없습니다</p>
			{/if}
		</section>
	{/if}
	<footer class="flex justify-end p-6">
		<a href="/projects/{rootProject.id}" class="btn btn-sm hover:bg-surface-300-700">
			자세히 보기
			<ArrowUpRight class="ml-1 size-4" />
		</a>
	</footer>
</div>
