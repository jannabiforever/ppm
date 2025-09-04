<script lang="ts">
	import { DatePicker } from 'bits-ui';
	import { Calendar, ChevronLeft, ChevronRight } from 'lucide-svelte';
	import { ICON_PROPS } from '../constants';
	import { DateTime } from 'effect';
	import { type CalendarDate } from '@internationalized/date';

	type Props = {
		label: string;
		utc: DateTime.Utc | null;
	};

	let { label, utc = $bindable(null) }: Props = $props();

	let dateValue = $state<CalendarDate | undefined>(undefined);
	$effect(() => {
		if (dateValue !== undefined) {
			utc = DateTime.unsafeMake(dateValue.toDate('Asia/Seoul'));
		}
	});
</script>

<DatePicker.Root weekdayFormat="short" fixedWeeks={true} bind:value={dateValue}>
	<div class="flex w-full max-w-[232px] flex-col gap-1.5">
		<DatePicker.Label class="block text-sm font-medium select-none">{label}</DatePicker.Label>
		<DatePicker.Input
			class="flex w-full max-w-[232px] items-center rounded-sm border border-surface-200-800 bg-surface-50-950 px-2 py-3 text-sm tracking-[0.01em] select-none"
		>
			{#snippet children({ segments })}
				{#each segments as { part, value }, i (part + i)}
					<div class="inline-block select-none">
						{#if part === 'literal'}
							<DatePicker.Segment {part} class="p-1 text-surface-500">
								{value}
							</DatePicker.Segment>
						{:else}
							<DatePicker.Segment
								{part}
								class="rounded-sm p-1 hover:bg-surface-100-900 focus:bg-surface-500 focus:text-surface-contrast-500 focus-visible:ring-0! focus-visible:ring-offset-0! aria-[valuetext=Empty]:text-surface-300-700"
							>
								{value}
							</DatePicker.Segment>
						{/if}
					</div>
				{/each}
				<DatePicker.Trigger
					class="ml-auto inline-flex size-8 items-center justify-center rounded-sm text-surface-500 transition-all hover:bg-surface-100-900"
				>
					<Calendar {...ICON_PROPS.sm} />
				</DatePicker.Trigger>
			{/snippet}
		</DatePicker.Input>
		<DatePicker.Content sideOffset={6} class="z-50">
			<DatePicker.Calendar
				class="shadow-popover rounded-[9px] border border-surface-200-800 bg-surface-50-950 p-[22px]"
			>
				{#snippet children({ months, weekdays })}
					<DatePicker.Header class="flex items-center justify-between">
						<DatePicker.PrevButton
							class="inline-flex size-10 items-center justify-center rounded-[9px] bg-surface-50-950 transition-all hover:bg-surface-500 active:scale-[0.98]"
						>
							<ChevronLeft class="size-6" />
						</DatePicker.PrevButton>
						<DatePicker.Heading class="text-lg font-medium" />
						<DatePicker.NextButton
							class="inline-flex size-10 items-center justify-center rounded-[9px] bg-surface-50-950 transition-all hover:bg-surface-500 active:scale-[0.98]"
						>
							<ChevronRight class="size-6" />
						</DatePicker.NextButton>
					</DatePicker.Header>
					<div class="flex flex-col space-y-4 pt-4 sm:flex-row sm:space-y-0 sm:space-x-4">
						{#each months as month (month.value)}
							<DatePicker.Grid class="w-full border-collapse space-y-1 select-none">
								<DatePicker.GridHead>
									<DatePicker.GridRow class="mb-1 flex w-full justify-between">
										{#each weekdays as day (day)}
											<DatePicker.HeadCell class="w-10 rounded-md text-xs text-surface-500">
												<div>{day.slice(0, 2)}</div>
											</DatePicker.HeadCell>
										{/each}
									</DatePicker.GridRow>
								</DatePicker.GridHead>
								<DatePicker.GridBody>
									{#each month.weeks as weekDates (weekDates)}
										<DatePicker.GridRow class="flex w-full">
											{#each weekDates as date (date)}
												<DatePicker.Cell
													{date}
													month={month.value}
													class="relative size-10 p-0! text-center text-sm"
												>
													<DatePicker.Day
														class="relative inline-flex size-10 items-center justify-center rounded-[9px] border border-transparent bg-transparent p-0 text-sm font-normal whitespace-nowrap text-surface-500 transition-all hover:border-surface-500 data-disabled:pointer-events-none data-disabled:text-surface-500/30 data-outside-month:pointer-events-none data-selected:bg-surface-100-900 data-selected:font-semibold data-unavailable:text-surface-500 data-unavailable:line-through"
													>
														<div
															class="absolute top-[5px] hidden size-1 rounded-full bg-surface-50-950 transition-all group-data-selected:bg-surface-100-900 group-data-today:block"
														></div>
														{date.day}
													</DatePicker.Day>
												</DatePicker.Cell>
											{/each}
										</DatePicker.GridRow>
									{/each}
								</DatePicker.GridBody>
							</DatePicker.Grid>
						{/each}
					</div>
				{/snippet}
			</DatePicker.Calendar>
		</DatePicker.Content>
	</div>
</DatePicker.Root>
