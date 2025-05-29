<script>
	import { Clock8, Clock10, Clock1, Clock3, Clock5 } from '@lucide/svelte';

	let curTime = $state(new Date());
	const dayMap = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

	const timeIntervals = [
		[8, 10],
		[10, 12],
		[13, 15],
		[15, 17],
		[17, 20]
	];

	// Variable to control which container is highlighted (1-5)
	let highlighted = $derived.by(() => {
		let curHour = curTime.getHours();

		// -1 if none, else 0 ~ 4
		let index = timeIntervals.findIndex(([start, end]) => start <= curHour && curHour < end);

		// 0 if none, else 1 ~ 5
		return index + 1;
	});

	// update the time every 10 seconds
	setInterval(() => {
		curTime = new Date();
	}, 10000);
</script>

<div class="mx-auto w-full max-w-6xl p-6">
	<div class="flex items-baseline justify-between">
		<h2 class="h2 relative mb-6">Dashboard</h2>
		<div class="card">
			<p>{curTime.toLocaleDateString()} {dayMap.at(curTime.getDay()) ?? 'Unknown'}</p>
		</div>
	</div>

	<div class="grid grid-cols-1 gap-6 md:grid-cols-2">
		<div
			class="card {highlighted === 1
				? 'variant-filled-primary'
				: 'variant-soft-primary'} flex flex-col rounded-xl border p-6 shadow-md {highlighted === 1
				? 'border-primary-400 dark:border-primary-600 border-2'
				: 'border-primary-300 dark:border-primary-800'} transition-all duration-500 hover:translate-y-[-5px] hover:shadow-xl {highlighted ===
			1
				? 'ring-primary-500/30 ring-4'
				: ''}"
		>
			<div class="mb-4 flex items-center justify-between">
				<div class="flex items-center">
					<div
						class="bg-primary-500/30 dark:bg-primary-500/20 border-primary-400 dark:border-primary-700 mr-3 rounded-lg border p-3 transition-transform duration-500 hover:scale-110"
					>
						<Clock8 class="text-primary-700 dark:text-primary-300 h-6 w-6" />
					</div>
					<h3 class="text-lg font-semibold">1st Chunk</h3>
				</div>
				{#if highlighted === 1}
					<button type="button" class="chip preset-tonal-primary text-sm">Current</button>
				{/if}
			</div>
			<p class="mb-4 text-sm opacity-75">
				Lorem ipsum dolor sit amet consectetur adipisicing elit. Est aspernatur assumenda similique
				distinctio, maxime atque non ab! Deserunt, id doloremque quibusdam veritatis dolorum placeat
				ipsa fugit doloribus officiis minima magni!
			</p>
			<div class="mt-auto text-right">
				<button class="btn btn-sm variant-filled transition-transform hover:scale-105">
					View Details
				</button>
			</div>
		</div>

		<div
			class="card {highlighted === 2
				? 'variant-filled-secondary'
				: 'variant-soft-secondary'} flex flex-col rounded-xl border p-6 shadow-md {highlighted === 2
				? 'border-secondary-400 dark:border-secondary-600 border-2'
				: 'border-secondary-300 dark:border-secondary-800'} transition-all duration-500 hover:translate-y-[-5px] hover:shadow-xl {highlighted ===
			2
				? 'ring-secondary-500/30 ring-4'
				: ''}"
		>
			<div class="mb-4 flex items-center justify-between">
				<div class="flex items-center">
					<div
						class="bg-secondary-500/30 dark:bg-secondary-500/20 border-secondary-400 dark:border-secondary-700 mr-3 rounded-lg border p-3 transition-transform duration-500 hover:scale-110"
					>
						<Clock10 class="text-secondary-700 dark:text-secondary-300 h-6 w-6" />
					</div>
					<h3 class="text-lg font-semibold">2nd Chunk</h3>
				</div>
				{#if highlighted === 2}
					<button type="button" class="chip preset-tonal-secondary text-sm">Current</button>
				{/if}
			</div>
			<p class="mb-4 text-sm opacity-75">
				Lorem ipsum dolor sit amet consectetur adipisicing elit. Tempora corporis vel rerum itaque
				possimus quo ducimus, deleniti sed dolore odio tenetur, aperiam reiciendis voluptatum
				consectetur, ipsam eveniet voluptatem deserunt. Provident.
			</p>
			<div class="mt-auto text-right">
				<button class="btn btn-sm variant-filled-secondary transition-transform hover:scale-105">
					View Details
				</button>
			</div>
		</div>

		<div
			class="card {highlighted === 3
				? 'variant-filled-tertiary'
				: 'variant-soft-tertiary'} flex flex-col rounded-xl border p-6 shadow-md {highlighted === 3
				? 'border-tertiary-400 dark:border-tertiary-600 border-2'
				: 'border-tertiary-300 dark:border-tertiary-800'} transition-all duration-500 hover:translate-y-[-5px] hover:shadow-xl {highlighted ===
			3
				? 'ring-tertiary-500/30 ring-4'
				: ''}"
		>
			<div class="mb-4 flex items-center justify-between">
				<div class="flex items-center">
					<div
						class="bg-tertiary-500/30 dark:bg-tertiary-500/20 border-tertiary-400 dark:border-tertiary-700 mr-3 rounded-lg border p-3 transition-transform duration-500 hover:scale-110"
					>
						<Clock1 class="text-tertiary-700 dark:text-tertiary-300 h-6 w-6" />
					</div>
					<h3 class="text-lg font-semibold">3rd Chunk</h3>
				</div>
				{#if highlighted === 3}
					<button type="button" class="chip preset-tonal-tertiary text-sm">Current</button>
				{/if}
			</div>
			<p class="mb-4 text-sm opacity-75">
				Lorem ipsum dolor sit amet consectetur adipisicing elit. Harum odio eum autem magni
				repellendus odit fugiat, nemo illo ex eos dolorum dignissimos adipisci? Tenetur quos quidem
				dignissimos, neque eum eveniet?
			</p>
			<div class="mt-auto text-right">
				<button class="btn btn-sm variant-filled-tertiary transition-transform hover:scale-105">
					View Details
				</button>
			</div>
		</div>

		<div
			class="card {highlighted === 4
				? 'variant-filled-success'
				: 'variant-soft-success'} flex flex-col rounded-xl border p-6 shadow-md {highlighted === 4
				? 'border-success-400 dark:border-success-600 border-2'
				: 'border-success-300 dark:border-success-800'} transition-all duration-500 hover:translate-y-[-5px] hover:shadow-xl {highlighted ===
			4
				? 'ring-success-500/30 ring-4'
				: ''}"
		>
			<div class="mb-4 flex items-center justify-between">
				<div class="flex items-center">
					<div
						class="bg-success-500/30 dark:bg-success-500/20 border-success-400 dark:border-success-700 mr-3 rounded-lg border p-3 transition-transform duration-500 hover:scale-110"
					>
						<Clock3 class="text-success-700 dark:text-success-300 h-6 w-6" />
					</div>
					<h3 class="text-lg font-semibold">4th Chunk</h3>
				</div>
				{#if highlighted === 4}
					<button type="button" class="chip preset-tonal-success text-sm">Current</button>
				{/if}
			</div>
			<p class="mb-4 text-sm opacity-75">
				Lorem ipsum dolor, sit amet consectetur adipisicing elit. Nobis, quod error sint autem
				aliquid culpa deserunt, sequi eum impedit, iste commodi id ratione tenetur saepe quis optio
				perferendis non ad!
			</p>
			<div class="mt-auto text-right">
				<button class="btn btn-sm variant-filled transition-transform hover:scale-105">
					View Details
				</button>
			</div>
		</div>
		<div
			class="card {highlighted === 5
				? 'variant-filled'
				: 'variant-soft'} col-span-2 flex flex-col rounded-xl border p-6 shadow-md {highlighted ===
			5
				? 'border-surface-400 dark:border-surface-600 border-2'
				: 'border-surface-300 dark:border-surface-700'} transition-all duration-500 hover:translate-y-[-5px] hover:shadow-xl {highlighted ===
			5
				? 'ring-surface-500/30 ring-4'
				: ''}"
		>
			<div class="mb-4 flex items-center justify-between">
				<div class="flex items-center">
					<div
						class="bg-surface-500/30 dark:bg-surface-500/20 border-surface-400 dark:border-surface-700 mr-3 rounded-lg border p-3 transition-transform duration-500 hover:scale-110"
					>
						<Clock5 class="text-surface-700 dark:text-surface-300 h-6 w-6" />
					</div>
					<h3 class="text-lg font-semibold">Managing Hours</h3>
				</div>
				{#if highlighted === 5}
					<button type="button" class="chip preset-filled-surface-500 text-sm">Current</button>
				{/if}
			</div>
			<p class="mb-4 text-sm opacity-75">
				Lorem ipsum dolor, sit amet consectetur adipisicing elit. Nobis, quod error sint autem
				aliquid culpa deserunt, sequi eum impedit, iste commodi id ratione tenetur saepe quis optio
				perferendis non ad!
			</p>
			<div class="mt-auto text-right">
				<button class="btn btn-sm variant-ghost-success transition-transform hover:scale-105">
					View Details
				</button>
			</div>
		</div>
	</div>
</div>
