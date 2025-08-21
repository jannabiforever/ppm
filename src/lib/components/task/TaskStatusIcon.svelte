<script lang="ts">
	import type { TaskStatus } from '$lib/modules/tasks';
	import { Book, BookX, CircleCheck, BookCheck, BookOpenText, type IconProps } from 'lucide-svelte';

	interface Props {
		status: TaskStatus;
		isPlanned?: boolean;
		isInSession?: boolean;
		iconProps?: IconProps;
	}

	const { status, isPlanned = false, isInSession = false, iconProps = {} }: Props = $props();
</script>

{#if isInSession}
	<BookOpenText {...iconProps} />
{:else if isPlanned}
	<BookCheck {...iconProps} />
{:else if status === 'backlog'}
	<Book {...iconProps} />
{:else if status === 'blocked'}
	<BookX {...iconProps} />
{:else if status === 'completed'}
	<CircleCheck {...iconProps} />
{/if}
