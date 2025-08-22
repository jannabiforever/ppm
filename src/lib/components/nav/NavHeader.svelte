<script lang="ts">
	import icon from '$lib/assets/favicon.svg';
	import type { UserProfile } from '$lib/modules/user_profile';
	import DarkModeHandler from './DarkModeHandler.svelte';

	interface Props {
		userProfile: UserProfile;
	}

	let { userProfile: userAndProfile }: Props = $props();
</script>

<div class="flex w-full items-center justify-between">
	<div class="m-2.5 flex items-center gap-2.5">
		<img src={icon} alt="User Avatar" height="24" width="24" />
		<span class="text-sm font-medium">{userAndProfile.profile.name}</span>
	</div>
	<DarkModeHandler />
</div>
