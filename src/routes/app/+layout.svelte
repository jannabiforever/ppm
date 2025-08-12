<script lang="ts">
	import { FolderKanban, CalendarCheck2, CalendarDays, ScrollText, Inbox } from 'lucide-svelte';

	let { children } = $props();

	const navItems = [
		{ path: '/app/projects', label: '프로젝트', icon: FolderKanban },
		{ path: '/app/today', label: '오늘', icon: CalendarCheck2 },
		{ path: '/app/upcoming', label: '다음', icon: CalendarDays },
		{ path: '/app/protocols', label: '프로토콜', icon: ScrollText },
		{ path: '/app/inbox', label: '수집함', icon: Inbox }
	];
</script>

<main class="h-full w-full"></main>
