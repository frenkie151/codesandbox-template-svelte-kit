<script lang="ts">
	import Icon from './Icon.svelte';
	import TabView from './TabView.svelte';
	import { filterLoads, loadStatus, usd, type LoadFilter } from '$lib/detention';

	let {
		active,
		departed,
		onopendetention
	}: { active: boolean; departed: boolean; onopendetention: () => void } = $props();

	const filters: [LoadFilter, string][] = [
		['all', 'All'],
		['active', 'Active'],
		['done', 'Delivered']
	];
	let filter = $state<LoadFilter>('all');
	const index = $derived(filters.findIndex(([f]) => f === filter));

	function key(e: KeyboardEvent) {
		if (e.key === 'Enter' || e.key === ' ') {
			e.preventDefault();
			onopendetention();
		}
	}
</script>

<TabView id="v-loads" title="Loads" {active}>
	<div class="largetitle">
		<div>
			<div class="date">This week</div>
			<h1>Loads</h1>
		</div>
	</div>
	<div class="seg" role="tablist" aria-label="Filter loads">
		<span class="thumb" style:transform="translateX({index * 100}%)"></span>
		{#each filters as [f, label] (f)}
			<button role="tab" aria-selected={f === filter} onclick={() => (filter = f)}>{label}</button>
		{/each}
	</div>
	<div class="group">
		{#each filterLoads(filter) as l (l.id)}
			{@const [cls, label] = loadStatus(l.state, departed)}
			{#snippet row()}
				<span class="badge {cls}"><Icon name="truck" /></span>
				<div class="txt">
					<div class="ttl">{l.id} · {l.lane}</div>
					<div class="sub">{l.broker}</div>
				</div>
				<div class="right">
					<span class="amt num">{usd(l.amount)}</span><span class="status {cls}">{label}</span>
				</div>
			{/snippet}
			{#if l.state === 'det'}
				<div
					class="item load-row link"
					tabindex="0"
					role="button"
					onclick={onopendetention}
					onkeydown={key}
				>
					{@render row()}
				</div>
			{:else}
				<div class="item load-row">{@render row()}</div>
			{/if}
		{/each}
	</div>
</TabView>
