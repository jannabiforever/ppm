<script lang="ts">
	import SubPageContainer from '$lib/component/SubPageContainer.svelte';

	let { children } = $props();
</script>

<SubPageContainer directTo="/projects" title="Projects">
	{@render children()}
</SubPageContainer>
