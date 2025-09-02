<script lang="ts">
	import type { TaskSchema } from '$lib/modules/tasks';
	import { Book, BookX, CircleCheck, BookCheck, type IconProps } from 'lucide-svelte';

	type Props = {
		task: typeof TaskSchema.Type;
		iconProps: IconProps;
	};

	const { task, iconProps = {} }: Props = $props();

	let isPlanned = $derived(task.planned_for !== null);
</script>

{#if isPlanned}
	<BookCheck {...iconProps} />
{:else if task.status === 'backlog'}
	<Book {...iconProps} aria-label="백로그 - 진행 대기 중" />
{:else if task.status === 'blocked'}
	<BookX {...iconProps} aria-label="블록됨 - 진행 불가능" />
{:else if task.status === 'completed'}
	<CircleCheck {...iconProps} aria-label="완료됨" />
{/if}
