<script lang="ts">
	import SubPageContainer from '$lib/component/SubPageContainer.svelte';

	let { children } = $props();
</script>

<SubPageContainer directTo="/weeks" title="Weeks">
	{@render children()}
</SubPageContainer>
