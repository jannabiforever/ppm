<script lang="ts">
	import { Duration, DateTime } from 'effect';
	import { ICON_PROPS } from '../constants';
	import { CalendarCheck2 } from 'lucide-svelte';
	import { currentKSTMidnight } from '$lib/stores/time';
	import { onMount } from 'svelte';

	type Props = {
		date: DateTime.Utc;
	};

	let { date }: Props = $props();

	const distanceDuration = DateTime.distanceDuration($currentKSTMidnight, date);
	onMount(() => {
		console.log('mounted distance', distanceDuration);
	});
	const formattedDate = DateTime.formatIntl(
		date,
		new Intl.DateTimeFormat('ko-KR', {
			timeZone: 'Asia/Seoul',
			month: 'numeric',
			day: 'numeric'
		})
	);
</script>

{#if Duration.greaterThan(distanceDuration, Duration.zero)}{:else if Duration.greaterThan(distanceDuration, Duration.days(1))}
	<div class="flex items-center gap-1 text-xs text-primary-500">
		<CalendarCheck2 {...ICON_PROPS.xs} />
		오늘
	</div>
{:else if Duration.greaterThan(distanceDuration, Duration.days(2))}
	<div class="flex items-center gap-1 text-xs text-secondary-500">
		<CalendarCheck2 {...ICON_PROPS.xs} />
		내일
	</div>
{:else if Duration.greaterThan(distanceDuration, Duration.days(7))}
	<div class="flex items-center gap-1 text-xs text-tertiary-500">
		<CalendarCheck2 {...ICON_PROPS.xs} />
		{Duration.toDays(distanceDuration)}일 후
	</div>
{:else}
	<div class="flex items-center gap-1 text-xs text-surface-800-200">
		<CalendarCheck2 {...ICON_PROPS.xs} />
		{formattedDate}
	</div>
{/if}
