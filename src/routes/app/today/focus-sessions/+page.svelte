<script lang="ts">
	import { ICON_PROPS } from '$lib/components/constants';
	import Timeline from '$lib/components/timeline/Timeline.svelte';
	import { CalendarCheck2 } from 'lucide-svelte';

	let { data } = $props();
</script>

<div class="flex w-full items-center justify-between">
	<div class="flex gap-3">
		<CalendarCheck2 {...ICON_PROPS.lg} />
		<span class="font-semibold">오늘 / 집중 세션</span>
	</div>

	<a href="/app/today/tasks" class="anchor"> 태스크 </a>
</div>

<div class="flex w-full flex-1">
	<!-- Focus Session tab -->
	<div class="flex w-full flex-col gap-2.5">
		<div class="flex w-full gap-2.5 rounded-sm bg-surface-100-900/80 px-2 py-3">
			<span class="text-sm font-semibold">집중 세션</span>
			<span class="flex-1 text-sm">{data.todayFocusSessionProjectLookups.length}개</span>
		</div>

		<!-- Timeline -->
		<Timeline focusSessionProjectLookups={data.todayFocusSessionProjectLookups} />
	</div>
</div>
