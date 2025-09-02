<script lang="ts">
	import { Hash } from 'lucide-svelte';
	import { ICON_PROPS } from '../constants';
	import { FocusSessionProjectLookupSchema } from '$lib/applications/session-project-lookup/types';
	import { formatTimeKstHHmm } from '$lib/shared/utils/datetime';

	type Props = {
		focusSession: typeof FocusSessionProjectLookupSchema.Type;
	};

	let { focusSession }: Props = $props();

	let intervalString = $derived.by(() => {
		const start = formatTimeKstHHmm(focusSession.start_at);
		const end = formatTimeKstHHmm(focusSession.end_at);
		return `${start} ~ ${end}`;
	});
</script>

<div
	class="flex h-full w-full flex-col justify-between rounded-[9px] preset-filled-primary-500 p-3"
>
	<div class="flex w-full items-center gap-1">
		<Hash {...ICON_PROPS.sm} />
		<span class="flex-1 text-sm font-medium">
			{focusSession.project?.name ?? '수집함'}
		</span>
	</div>

	<span class="text-xs text-white/90">{intervalString}</span>
</div>
