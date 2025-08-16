<script lang="ts">
	import type { TaskStatus } from '$lib/modules';
	import {
		Book,
		BookCheck,
		BookLock,
		BookMarked,
		BookOpenText,
		type IconProps
	} from 'lucide-svelte';

	interface Props {
		status: TaskStatus;
		iconProps?: IconProps;
	}

	let { status, iconProps }: Props = $props();
</script>

{#if status === 'backlog'}
	<Book {...iconProps} />
{:else if status === 'blocked'}
	<BookLock {...iconProps} />
{:else if status === 'completed'}
	<BookMarked {...iconProps} />
{:else if status === 'in_session'}
	<BookOpenText {...iconProps} />
{:else if status === 'planned'}
	<BookCheck {...iconProps} />
{/if}
