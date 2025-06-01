<script lang="ts">
	import SubPageContainer from '$lib/component/SubPageContainer.svelte';

	let { children } = $props();
</script>

<SubPageContainer directTo="/notes" title="Notes">
	{@render children()}
</SubPageContainer>
