<script>
	import { ICON_PROPS } from '$lib/components/constants';
	import Timeline from '$lib/components/timeline/Timeline.svelte';
	import { CalendarCheck2 } from 'lucide-svelte';

	let { data } = $props();
</script>

<div class="flex w-full gap-3">
	<CalendarCheck2 {...ICON_PROPS.lg} />
	<span class="font-semibold">오늘 </span>
</div>

<div class="flex w-full flex-1 gap-15">
	<!-- 태스크 탭 -->
	<div class="flex w-full flex-col gap-2.5">
		<div class="flex w-full gap-2.5 rounded-sm bg-surface-100-900/80 px-2 py-3">
			<span class="font-semibold">태스크</span>
			<span class="flex-1">{data.todayTasks?.length}개</span>
		</div>
	</div>

	<!-- 집중 세션 탭 -->
	<div class="flex w-full flex-col gap-2.5">
		<div class="flex w-full gap-2.5 rounded-sm bg-surface-100-900/80 px-2 py-3">
			<span class="font-semibold">집중 세션</span>
			<span class="flex-1">{data.todaySessions?.length}개</span>
		</div>
		<Timeline focusSessions={[]} />
	</div>
</div>
