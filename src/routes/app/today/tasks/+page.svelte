<script lang="ts">
	import { ICON_PROPS } from '$lib/components/constants';
	import { CalendarCheck2 } from 'lucide-svelte';

	let { data } = $props();
</script>

<div class="flex w-full items-center justify-between gap-3">
	<div class="flex items-center gap-3">
		<CalendarCheck2 {...ICON_PROPS.lg} />
		<span class="font-semibold">오늘 / 태스크</span>
	</div>
	<a href="/app/today/focus-sessions" class="anchor"> 집중 세션 </a>
</div>

<div class="flex w-full flex-1">
	<!-- Task tab -->
	<div class="flex w-full flex-col gap-2.5">
		<div class="flex w-full gap-2.5 rounded-sm bg-surface-100-900/80 px-2 py-3">
			<span class="text-sm font-semibold">태스크</span>
			<span class="flex-1 text-sm">{data.todayTasks.length}개</span>
		</div>
	</div>
</div>
