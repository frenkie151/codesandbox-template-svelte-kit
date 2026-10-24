<script lang="ts">
	import AutomationsView from './AutomationsView.svelte';
	import DetentionView from './DetentionView.svelte';
	import Icon from './Icon.svelte';
	import LoadsView from './LoadsView.svelte';
	import Sheet from './Sheet.svelte';
	import TodayView from './TodayView.svelte';
	import {
		H,
		automations,
		buildEmail,
		calc,
		clock,
		hm,
		initialAutos,
		needs as allNeeds,
		usd,
		type AutoKey,
		type Need
	} from '$lib/detention';

	type Tab = 'v-today' | 'v-loads' | 'v-auto';
	type SheetName = 'mail' | 'depart' | null;

	const tabs: { id: Tab; label: string; icon: 'today' | 'loads' | 'switch' }[] = [
		{ id: 'v-today', label: 'Today', icon: 'today' },
		{ id: 'v-loads', label: 'Loads', icon: 'loads' },
		{ id: 'v-auto', label: 'Automations', icon: 'switch' }
	];

	function savedTab(): Tab {
		try {
			const t = localStorage.getItem('dr-tab');
			if (tabs.some((x) => x.id === t)) return t as Tab;
		} catch {}
		return 'v-today';
	}

	// Demo load: the driver checked in a little over 4 hours ago and is still waiting.
	const arrivedAt = Date.now() - (4 * H + 5000);
	let now = $state(Date.now());
	let departedAt = $state<number | null>(null);
	let sentAt = $state<number | null>(null);
	let autos = $state({ ...initialAutos });
	let tab = $state<Tab>(savedTab());
	let pushed = $state(false);
	let backLabel = $state('Today');
	let sheet = $state<SheetName>(null);
	let mailBody = $state('');
	let needs = $state(allNeeds);
	let gone = $state(new Set<string>());
	let toast = $state({ msg: '', show: false });
	let toastTimer: ReturnType<typeof setTimeout> | undefined;
	let lastFocus: HTMLElement | null = null;

	const det = $derived(calc(arrivedAt, departedAt, now));
	const stopped = $derived(departedAt !== null);
	const waiting = $derived(needs.length - gone.size);

	$effect(() => {
		const t = setInterval(() => (now = Date.now()), 1000);
		return () => clearInterval(t);
	});

	function say(msg: string) {
		toast = { msg, show: true };
		clearTimeout(toastTimer);
		toastTimer = setTimeout(() => (toast.show = false), 2200);
	}

	function showTab(id: Tab) {
		if (id === tab) {
			document.getElementById(id)?.scrollTo({ top: 0, behavior: 'smooth' });
			return;
		}
		tab = id;
		try {
			localStorage.setItem('dr-tab', id);
		} catch {}
	}

	function openDetention(from: string) {
		backLabel = from;
		pushed = true;
	}

	function openSheet(name: Exclude<SheetName, null>) {
		lastFocus = document.activeElement as HTMLElement | null;
		sheet = name;
	}
	function closeSheet() {
		sheet = null;
		lastFocus?.focus({ preventScroll: true });
	}

	function onkeydown(e: KeyboardEvent) {
		if (e.key !== 'Escape') return;
		if (sheet) closeSheet();
		else if (pushed) pushed = false;
	}

	function resolveNeed(need: Need, msg?: string) {
		if (gone.has(need.id)) return;
		gone = new Set(gone).add(need.id);
		if (msg) say(msg);
		setTimeout(() => {
			needs = needs.filter((n) => n.id !== need.id);
			const next = new Set(gone);
			next.delete(need.id);
			gone = next;
		}, 480);
	}

	function toggleAuto(key: AutoKey) {
		autos[key] = !autos[key];
		const name = automations.find((a) => a.key === key)!.title;
		say(autos[key] ? `${name} on · acts from now` : `${name} off`);
	}

	function departOrUndo() {
		if (stopped) {
			departedAt = null;
			say('Clock running again');
		} else openSheet('depart');
	}
	function confirmDepart() {
		const t = Date.now();
		departedAt = t;
		now = t;
		closeSheet();
		say(`Truck left. ${usd(calc(arrivedAt, t, t).amount)} to bill.`);
	}

	function writeEmail() {
		mailBody = buildEmail(arrivedAt, departedAt, Date.now());
		openSheet('mail');
	}
	function copyEmail() {
		const fallback = () => {
			const ta = document.getElementById('mailBody') as HTMLTextAreaElement | null;
			ta?.focus();
			ta?.select();
			say('Selected. Press copy on your keyboard.');
		};
		if (navigator.clipboard?.writeText)
			navigator.clipboard.writeText(mailBody).then(() => say('Email copied'), fallback);
		else fallback();
	}
	function markSent() {
		sentAt = Date.now();
		closeSheet();
		say('Marked as sent to Pinecrest');
	}
</script>

<svelte:document {onkeydown} />

<div class="device" class:pushed>
	<div class="statusbar" aria-hidden="true">
		<span class="num">{clock(now).replace(/ [AP]M/, '')}</span>
		<span class="island"></span>
		<span class="sys">
			<svg width="18" height="12" viewBox="0 0 18 12" fill="currentColor"
				><rect x="0" y="8" width="3" height="4" rx="1" /><rect
					x="5"
					y="5.5"
					width="3"
					height="6.5"
					rx="1"
				/><rect x="10" y="3" width="3" height="9" rx="1" /><rect
					x="15"
					y="0"
					width="3"
					height="12"
					rx="1"
				/></svg
			>
			<svg width="26" height="12" viewBox="0 0 26 12"
				><rect
					x=".5"
					y=".5"
					width="22"
					height="11"
					rx="3.5"
					fill="none"
					stroke="currentColor"
					opacity=".4"
				/><rect x="2" y="2" width="16" height="8" rx="2" fill="currentColor" /><rect
					x="24"
					y="4"
					width="1.6"
					height="4"
					rx=".8"
					fill="currentColor"
					opacity=".4"
				/></svg
			>
		</span>
	</div>

	<TodayView
		active={tab === 'v-today'}
		{now}
		{det}
		{stopped}
		{needs}
		{gone}
		onopendetention={() => openDetention('Today')}
		onresolve={resolveNeed}
		onlumpers={() => say('3 lumper receipts on file · $570')}
		onalerts={() => {
			showTab('v-loads');
			say('4 loads with something to check');
		}}
	/>
	<LoadsView
		active={tab === 'v-loads'}
		departed={stopped}
		onopendetention={() => openDetention('Loads')}
	/>
	<AutomationsView active={tab === 'v-auto'} {autos} ontoggle={toggleAuto} />

	<DetentionView
		open={pushed}
		{backLabel}
		{det}
		{arrivedAt}
		{departedAt}
		headsUp={autos.headsup}
		{sentAt}
		onback={() => (pushed = false)}
		onemail={writeEmail}
		ondepart={departOrUndo}
	/>

	<div class="tabbar" role="tablist" aria-label="Sections">
		{#each tabs as t (t.id)}
			<button class="tab" role="tab" aria-selected={tab === t.id} onclick={() => showTab(t.id)}>
				<Icon name={t.icon} />{t.label}
				{#if t.id === 'v-today'}
					<span class="dot num" class:zero={!waiting}>{waiting}</span>
				{/if}
			</button>
		{/each}
	</div>

	<div class="scrim" class:show={sheet} role="presentation" onclick={closeSheet}></div>

	<Sheet open={sheet === 'mail'} onclose={closeSheet} labelledby="mailTitle">
		{#snippet header()}
			<button class="back" style="padding-left:8px" onclick={closeSheet}>Cancel</button>
			<h3 id="mailTitle">Detention request</h3>
			<span style="width:64px"></span>
		{/snippet}
		{#snippet footer()}
			<button class="btn ghost press" onclick={copyEmail}><Icon name="copy" />Copy</button>
			<button class="btn press" onclick={markSent}><Icon name="send" />Mark as sent</button>
		{/snippet}
		<div class="mailhead">
			<div><span>To</span><span>dana@pinecrest-logistics.example</span></div>
			<div><span>Subject</span><span>Detention on DR-2041</span></div>
		</div>
		<label for="mailBody" class="eyebrow" style="margin:4px 4px -4px"
			>Already written. Edit anything.</label
		>
		<textarea id="mailBody" spellcheck="false" bind:value={mailBody}></textarea>
	</Sheet>

	<Sheet open={sheet === 'depart'} onclose={closeSheet} labelledby="depTitle">
		{#snippet footer()}
			<button class="btn ghost press" onclick={closeSheet}>Cancel</button>
			<button class="btn press" onclick={confirmDepart}>Stop the clock</button>
		{/snippet}
		<div class="confirm-card">
			<b id="depTitle">Truck left the receiver?</b>
			<p>
				The clock stops at {clock(now)} with {hm(det.elapsed)} at the receiver. {usd(det.amount)} is ready
				to bill.
			</p>
		</div>
	</Sheet>

	<div class="toast" class:show={toast.show} role="status" aria-live="polite">
		<Icon name="check" /><span>{toast.msg}</span>
	</div>
</div>
