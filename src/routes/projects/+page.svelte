<script lang="ts">
	import { Calendar, Clock, Activity, Layers, ArrowUpRight, LayoutDashboard } from '@lucide/svelte';

	let curTime = $state(new Date());
	const dayMap = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

	// Format time with leading zeros
	const formatTime = (date: Date): string => {
		const hours = date.getHours().toString().padStart(2, '0');
		const minutes = date.getMinutes().toString().padStart(2, '0');
		return `${hours}:${minutes}`;
	};
</script>

<div class="mx-auto w-full max-w-6xl p-6">
	<div class="mb-8 flex flex-col items-center justify-between gap-4 sm:flex-row sm:items-baseline">
		<div class="flex items-center gap-3">
			<div class="bg-primary-500/10 dark:bg-primary-500/20 rounded-xl p-3">
				<LayoutDashboard />
			</div>
			<h2 class="h2 font-bold">Project Flow</h2>
		</div>
		<div class="card variant-soft-surface flex items-center gap-3 p-3 shadow-md">
			<Calendar class="text-primary-500 size-5" />
			<p class="font-medium">
				{curTime.toLocaleDateString()}
				<span class="text-primary-500 font-semibold"
					>{dayMap.at(curTime.getDay()) ?? 'Unknown'}</span
				>
			</p>
			<div class="bg-surface-300 dark:bg-surface-700 mx-1 h-5 w-px"></div>
			<Clock class="text-primary-500 size-5" />
			<p class="font-medium">{formatTime(curTime)}</p>
		</div>
	</div>

	<div class="grid grid-cols-1 gap-6 md:grid-cols-3">
		<div
			class="card variant-soft-primary border-primary-500 border-l-4 shadow-lg transition-all duration-200 hover:translate-y-[-2px] hover:shadow-xl md:col-span-3"
		>
			<div class="p-6">
				<div class="mb-4 flex items-center justify-between">
					<div class="flex items-center gap-3">
						<Activity class="text-primary-500 size-5" />
						<h3 class="h3 font-semibold">System</h3>
					</div>
					<span class="badge variant-filled-primary">Active</span>
				</div>
				<p class="text-surface-700 dark:text-surface-300 mb-4">
					Monitor and manage your system resources and configuration.
				</p>
				<div class="flex justify-end">
					<button class="btn btn-sm variant-ghost-primary">
						View Details
						<ArrowUpRight class="ml-1 size-4" />
					</button>
				</div>
			</div>
		</div>

		<div
			class="card variant-soft-error border-error-500 border-l-4 shadow-lg transition-all duration-200 hover:translate-y-[-2px] hover:shadow-xl md:col-span-3"
		>
			<div class="p-6">
				<div class="mb-4 flex items-center justify-between">
					<div class="flex items-center gap-3">
						<Layers class="text-error-500 size-5" />
						<h3 class="h3 font-semibold">Main Project</h3>
					</div>
					<span class="badge variant-filled-error">Priority</span>
				</div>
				<p class="text-surface-700 dark:text-surface-300 mb-4">
					Your primary project with critical tasks and milestones.
				</p>
				<div class="flex justify-end">
					<button class="btn btn-sm variant-ghost-error"
						>View Details <ArrowUpRight class="ml-1 size-4" /></button
					>
				</div>
			</div>
		</div>

		<div
			class="card variant-soft-surface border-surface-500 border-l-4 shadow-lg transition-all duration-200 hover:translate-y-[-2px] hover:shadow-xl"
		>
			<div class="p-6">
				<div class="mb-4 flex items-center justify-between">
					<div class="flex items-center gap-3">
						<Layers class="text-surface-700 dark:text-surface-400 size-4" />
						<h3 class="font-semibold">Sub Project 1</h3>
					</div>
					<span class="badge variant-soft">In Progress</span>
				</div>
				<p class="text-surface-700 dark:text-surface-400 text-sm">
					Supporting project with related tasks.
				</p>
				<div class="mt-4 flex justify-end">
					<button class="btn btn-sm variant-ghost">View <ArrowUpRight class="ml-1 size-3" /></button
					>
				</div>
			</div>
		</div>

		<div
			class="card variant-soft-surface border-surface-500 border-l-4 shadow-lg transition-all duration-200 hover:translate-y-[-2px] hover:shadow-xl"
		>
			<div class="p-6">
				<div class="mb-4 flex items-center justify-between">
					<div class="flex items-center gap-3">
						<Layers class="text-surface-700 dark:text-surface-400 size-4" />
						<h3 class="font-semibold">Sub Project 2</h3>
					</div>
					<span class="badge variant-soft">Planned</span>
				</div>
				<p class="text-surface-700 dark:text-surface-400 text-sm">
					Additional project in planning phase.
				</p>
				<div class="mt-4 flex justify-end">
					<button class="btn btn-sm variant-ghost">View <ArrowUpRight class="ml-1 size-3" /></button
					>
				</div>
			</div>
		</div>

		<div
			class="card variant-ghost-surface border-surface-300 dark:border-surface-600 hover:bg-surface-100 dark:hover:bg-surface-800 flex flex-col items-center justify-center border border-dashed p-6 transition-all duration-200"
		>
			<div class="bg-surface-100 dark:bg-surface-800 mb-3 rounded-full p-3">
				<svg
					xmlns="http://www.w3.org/2000/svg"
					width="24"
					height="24"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="2"
					stroke-linecap="round"
					stroke-linejoin="round"
					class="text-surface-700 dark:text-surface-300"
					><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"
					></line></svg
				>
			</div>
			<p class="text-surface-700 dark:text-surface-300 font-medium">Add New Project</p>
		</div>
	</div>
</div>
