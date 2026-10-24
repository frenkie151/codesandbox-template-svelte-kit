<script lang="ts">
	import Icon from './Icon.svelte';
	import TabView from './TabView.svelte';
	import { bump } from '$lib/bump';
	import { hm, hmPad, longDate, usd, type Detention, type Need } from '$lib/detention';

	interface Props {
		active: boolean;
		now: number;
		det: Detention;
		stopped: boolean;
		needs: Need[];
		gone: Set<string>;
		onopendetention: () => void;
		onresolve: (need: Need, toast?: string) => void;
		onlumpers: () => void;
		onalerts: () => void;
	}

	let {
		active,
		now,
		det,
		stopped,
		needs,
		gone,
		onopendetention,
		onresolve,
		onlumpers,
		onalerts
	}: Props = $props();

	const money = $derived(usd(det.amount));
	const waiting = $derived(needs.length - gone.size);

	function key(e: KeyboardEvent) {
		if (e.key === 'Enter' || e.key === ' ') {
			e.preventDefault();
			onopendetention();
		}
	}
</script>

<TabView id="v-today" title="Today" {active}>
	<div class="largetitle">
		<div>
			<div class="date">{longDate(now)}</div>
			<h1>Today</h1>
		</div>
		<div class="avatar" role="img" aria-label="Northbound Freight dispatch">NF</div>
	</div>

	<button class="live press" onclick={onopendetention} aria-label="Open detention on load DR-2041">
		<div class="row1">
			<span class="pulse" class:stopped>
				{stopped ? 'Detention · truck left' : 'Detention · clock running'}
			</span>
			<Icon name="chevR" class="i chev" />
		</div>
		<div class="big">
			<span class="t num">{hmPad(det.elapsed)}</span>
			<span class="m num" use:bump={det.amount}>{money} to bill</span>
		</div>
		<div class="who">DR-2041 · Maria Ortiz at Lodi Cold Storage</div>
	</button>

	<div class="tiles">
		<button class="tile hot press" onclick={onopendetention}>
			<div class="top"><span class="ico"><Icon name="hourglass" /></span></div>
			<div><b>Detention</b><span class="sub num">{money} to bill</span></div>
		</button>
		<button class="tile amber press" onclick={onlumpers}>
			<div class="top"><span class="ico"><Icon name="receipt" /></span></div>
			<div><b>Lumpers</b><span class="sub">$570 to recover</span></div>
		</button>
		<button class="tile blue press" onclick={onalerts}>
			<div class="top"><span class="ico"><Icon name="alert" /></span></div>
			<div><b>Alerts</b><span class="sub">4 to look at</span></div>
		</button>
	</div>

	<div class="section-h">
		<h3>Needs you <span class="count num" hidden={!waiting}>{waiting}</span></h3>
		<span class="meta">{waiting ? `${waiting} waiting` : 'All clear'}</span>
	</div>
	<div class="group" class:allclear={!waiting}>
		{#each needs as n (n.id)}
			{#if n.opensDetention}
				<div
					class="item link"
					class:gone={gone.has(n.id)}
					tabindex="0"
					role="button"
					aria-label="Open detention on DR-2041"
					onclick={onopendetention}
					onkeydown={key}
				>
					<span class="badge {n.badge}"><Icon name={n.icon} /></span>
					<div class="txt">
						<div class="kind">{n.kind}</div>
						<div class="ttl">{n.title}</div>
						<div class="sub num">{hm(det.elapsed)} at receiver · {money} to bill</div>
					</div>
					<Icon name="chevR" class="i chev" />
				</div>
			{:else}
				<div class="item" class:gone={gone.has(n.id)}>
					<span class="badge {n.badge}"><Icon name={n.icon} /></span>
					<div class="txt">
						<div class="kind">{n.kind}</div>
						<div class="ttl">{n.title}</div>
						<div class="sub">{n.sub}</div>
					</div>
					{#if n.action}
						<button class="pill-btn press" onclick={() => onresolve(n, n.action?.toast)}>
							{n.action.label}
						</button>
					{/if}
					<button class="x-btn" aria-label="Dismiss" onclick={() => onresolve(n)}>
						<Icon name="x" />
					</button>
				</div>
			{/if}
		{/each}
		<div class="empty">You're all caught up.</div>
	</div>
	<p class="demo-note">Example company and loads. Numbers are demo data.</p>
</TabView>
