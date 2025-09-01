<script lang="ts">
	import { Hash } from 'lucide-svelte';
	import { DateTime } from 'effect';
	import { ICON_PROPS } from '../constants';
	import { FocusSessionProjectLookupSchema } from '$lib/applications/session-project-lookup/types';

	type Props = {
		focusSession: typeof FocusSessionProjectLookupSchema.Type;
	};

	let { focusSession }: Props = $props();

	const toKstHHmm = (utc: DateTime.Utc): string =>
		DateTime.formatIntl(
			utc,
			new Intl.DateTimeFormat('ko-KR', {
				timeZone: 'Asia/Seoul',
				hour: '2-digit',
				minute: '2-digit',
				hour12: false
			})
		);

	let intervalString = $derived.by(() => {
		const start = toKstHHmm(focusSession.start_at);
		const end = toKstHHmm(focusSession.end_at);
		return `${start} ~ ${end}`;
	});
</script>

<div class="flex h-full flex-col justify-between rounded-[9px] preset-filled-primary-500 p-3">
	<div class="flex w-full items-start gap-1">
		<Hash {...ICON_PROPS.sm} />
		<span class="flex-1 text-sm font-medium">
			{focusSession.project?.name ?? '수집함'}
		</span>
	</div>

	<span class="text-xs text-white/90">{intervalString}</span>
</div>
