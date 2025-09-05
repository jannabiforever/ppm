<script lang="ts">
	import NavHeader from '$lib/components/nav/NavHeader.svelte';
	import {
		FolderKanban,
		CalendarCheck2,
		CalendarDays,
		ScrollText,
		Inbox,
		Hash
	} from 'lucide-svelte';
	import type { LayoutProps } from './$types';
	import NavLink from '$lib/components/nav/NavLink.svelte';
	import NavItemSeparator from '$lib/components/nav/NavItemSeparator.svelte';
	import { ICON_PROPS } from '$lib/components/constants';
	import CurrentFocusSessionTimer from '$lib/components/nav/currentFocusSessionTimer.svelte';
	import { Option } from 'effect';

	let { children, data }: LayoutProps = $props();
</script>

<div class="flex h-full w-full flex-row">
	<!-- Navigation -->
	<aside
		class="fixed flex h-full w-[220px] flex-col gap-4.5 rounded-r-sm border border-surface-200-800 p-2.5"
	>
		<NavHeader
			userProfile={{
				user: data.user,
				profile: data.profile
			}}
		/>

		<!-- Links -->
		<div class="flex w-full flex-col">
			<NavLink href="/app/today" label="오늘" selected={false}>
				<CalendarCheck2 {...ICON_PROPS.md} />
			</NavLink>
			<NavLink href="/app/upcoming" label="다음" selected={false}>
				<CalendarDays {...ICON_PROPS.md} />
			</NavLink>
			<NavItemSeparator />
			<NavLink href="/app/inbox" label="수집함" selected={false}>
				<Inbox {...ICON_PROPS.md} />
			</NavLink>
			<NavLink href="/app/projects" label="프로젝트" selected={false}>
				<FolderKanban {...ICON_PROPS.md} />
			</NavLink>
			{#each data.activeProjects as project (project.id)}
				<NavLink
					href={`/app/projects/${project.id}`}
					label={project.name}
					selected={false}
					indented
				>
					<Hash {...ICON_PROPS.md} />
				</NavLink>
			{/each}
			<NavItemSeparator />
			<NavLink href="/app/protocols" label="프로토콜" selected={false}>
				<ScrollText {...ICON_PROPS.md} />
			</NavLink>
		</div>

		<!-- Session Timer -->
		{#if Option.isSome(data.currentFocusSessionInfo)}
			{@const fs = data.currentFocusSessionInfo.value}
			<div class="flex w-full flex-1 items-center justify-center">
				<CurrentFocusSessionTimer
					focusSessionWithAssignedTasks={fs}
					project={data.activeProjects.find((project) => project.id === fs.project_id) ?? null}
				/>
			</div>
		{/if}
	</aside>
	<main class="ml-[220px] flex w-full flex-1 justify-center p-5">
		<!-- TODO: 적당한 반응형 고려한 레이아웃 -->
		<div class="flex w-1/3 min-w-[640px] flex-col gap-5">
			{@render children?.()}
		</div>
	</main>
</div>
