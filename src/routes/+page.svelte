<script>
	import FifthChunk from '$lib/component/FifthChunk.svelte';
	import FirstChunk from '$lib/component/FirstChunk.svelte';
	import FourthChunk from '$lib/component/FourthChunk.svelte';
	import SecondChunk from '$lib/component/SecondChunk.svelte';
	import SubPageContainer from '$lib/component/SubPageContainer.svelte';
	import ThirdChunk from '$lib/component/ThirdChunk.svelte';

	let curTime = $state(new Date());

	const timeIntervals = [
		[8, 10],
		[10, 12],
		[13, 15],
		[15, 17],
		[17, 20]
	];

	// Variable to control which container is highlighted (1-5)
	let highlightedChunkIndex = $derived.by(() => {
		let curHour = curTime.getHours();

		// -1 if none, else 0 ~ 4
		return timeIntervals.findIndex(([start, end]) => start <= curHour && curHour < end);
	});

	// update the time every 10 seconds
	setInterval(() => {
		curTime = new Date();
	}, 10000);
</script>

<SubPageContainer title="Dashboard">
	<div class="grid grid-cols-1 gap-6 md:grid-cols-2">
		<FirstChunk isHighlighted={highlightedChunkIndex === 0}>
			Lorem ipsum dolor sit amet consectetur, adipisicing elit. Similique voluptatem architecto
			dolor blanditiis odit sit voluptatibus, earum, laborum cumque accusamus quibusdam voluptas.
			Similique non quaerat velit reiciendis eveniet expedita sapiente.
		</FirstChunk>

		<SecondChunk isHighlighted={highlightedChunkIndex === 1}>
			Lorem ipsum dolor sit amet consectetur, adipisicing elit. Similique voluptatem architecto
			dolor blanditiis odit sit voluptatibus, earum, laborum cumque accusamus quibusdam voluptas.
			Similique non quaerat velit reiciendis eveniet expedita sapiente.
		</SecondChunk>

		<ThirdChunk isHighlighted={highlightedChunkIndex === 2}>
			Lorem ipsum dolor sit amet consectetur, adipisicing elit. Similique voluptatem architecto
			dolor blanditiis odit sit voluptatibus, earum, laborum cumque accusamus quibusdam voluptas.
			Similique non quaerat velit reiciendis eveniet expedita sapiente.
		</ThirdChunk>

		<FourthChunk isHighlighted={highlightedChunkIndex === 3}>
			Lorem ipsum dolor sit amet consectetur, adipisicing elit. Similique voluptatem architecto
			dolor blanditiis odit sit voluptatibus, earum, laborum cumque accusamus quibusdam voluptas.
			Similique non quaerat velit reiciendis eveniet expedita sapiente.
		</FourthChunk>

		<FifthChunk isHighlighted={highlightedChunkIndex === 4}>
			Lorem ipsum dolor sit amet consectetur, adipisicing elit. Similique voluptatem architecto
			dolor blanditiis odit sit voluptatibus, earum, laborum cumque accusamus quibusdam voluptas.
			Similique non quaerat velit reiciendis eveniet expedita sapiente.
		</FifthChunk>
	</div>
</SubPageContainer>
