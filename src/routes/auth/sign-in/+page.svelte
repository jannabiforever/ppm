<script lang="ts">
	import Checkbox from '$lib/components/ui/Checkbox.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import TextInput from '$lib/components/ui/TextInput.svelte';
	import google from '$lib/assets/google.svg';

	let { form } = $props();

	let remember = $state(false);
</script>

<div class="flex h-full w-full flex-col items-center justify-center">
	<div class="flex w-[360px] flex-col gap-12">
		<div class="flex w-full flex-col gap-2.5">
			<h1 class="h1">로그인</h1>
			<span class="text-2xl">PPM으로 당신의 하루를 관리하세요</span>
		</div>
		<form method="POST" action="?/sign-in" class="flex w-full flex-col gap-12">
			<div class="flex flex-col gap-2.5">
				<TextInput
					label="이메일"
					name="email"
					placeholder="이메일을 입력하세요"
					autocomplete="email"
					type="email"
				/>
				<TextInput
					label="비밀번호"
					name="password"
					placeholder="비밀번호를 입력하세요"
					type="password"
					autocomplete="current-password"
				/>
				<div class="container flex flex-row items-center justify-between pt-2.5">
					<Checkbox name="remember" bind:checked={remember} label="이메일 기억하기" />
					<a href="/auth/find-password" class="anchor text-sm">비밀번호 찾기</a>
				</div>
			</div>
			<div class="flex flex-col gap-2.5">
				<Button type="submit" filled={true}>로그인</Button>
				<Button type="submit" filled={false} formaction="?/sign-in-google">
					<img src={google} alt="Google" width="18px" height="18px" />
					구글로 로그인
				</Button>
			</div>
		</form>

		{#if form !== null}
			<div
				class="w-full text-center text-base heading-font-weight"
				class:text-success-500={!form.error}
				class:text-error-500={form.error}
			>
				{form.error.message}
			</div>
		{/if}
	</div>
</div>
