<script lang="ts">
	import Icon from './Icon.svelte';
	import { bump } from '$lib/bump';
	import {
		FREE,
		H,
		STEP,
		STEP_USD,
		clock,
		countdown,
		hm,
		hmPad,
		secs,
		usd,
		type Detention
	} from '$lib/detention';

	interface Props {
		open: boolean;
		backLabel: string;
		det: Detention;
		arrivedAt: number;
		departedAt: number | null;
		headsUp: boolean;
		sentAt: number | null;
		onback: () => void;
		onemail: () => void;
		ondepart: () => void;
	}

	let {
		open,
		backLabel,
		det,
		arrivedAt,
		departedAt,
		headsUp,
		sentAt,
		onback,
		onemail,
		ondepart
	}: Props = $props();

	const RING = 56.55;
	const stopped = $derived(departedAt !== null);
	const free = $derived(det.elapsed ? Math.min(det.elapsed, FREE) / det.elapsed : 1);
	let view: HTMLElement;
	let backBtn: HTMLButtonElement;

	// Let the timeline grow from zero each time the screen slides in.
	let grown = $state(false);
	$effect(() => {
		if (!open) {
			grown = false;
			return;
		}
		view.scrollTo(0, 0);
		let r2 = 0;
		const r1 = requestAnimationFrame(() => (r2 = requestAnimationFrame(() => (grown = true))));
		const t = setTimeout(() => backBtn.focus({ preventScroll: true }), 450);
		return () => {
			cancelAnimationFrame(r1);
			cancelAnimationFrame(r2);
			clearTimeout(t);
		};
	});

	// Swipe from the left edge to go back, like iOS.
	let swipe: { x0: number; dx: number; w: number } | null = null;
	const underlay = () => document.querySelector<HTMLElement>('.tabview.active');
	const device = () => view.closest<HTMLElement>('.device');

	function down(e: PointerEvent) {
		const r = view.getBoundingClientRect();
		if (!open || e.pointerType === 'mouse' || e.clientX - r.left > 28) return;
		swipe = { x0: e.clientX, dx: 0, w: r.width };
		view.classList.add('dragging');
		device()?.classList.add('dragging');
		view.setPointerCapture(e.pointerId);
	}
	function move(e: PointerEvent) {
		if (!swipe) return;
		swipe.dx = Math.max(0, e.clientX - swipe.x0);
		view.style.transform = `translateX(${swipe.dx}px)`;
		const u = underlay();
		if (u) u.style.transform = `translateX(${-28 + (swipe.dx / swipe.w) * 28}%)`;
	}
	function up() {
		const s = swipe;
		if (!s) return;
		swipe = null;
		view.classList.remove('dragging');
		device()?.classList.remove('dragging');
		view.style.transform = '';
		const u = underlay();
		if (u) u.style.transform = '';
		if (s.dx > s.w * 0.33) onback();
	}
</script>

<section
	bind:this={view}
	class="view push"
	aria-label="Detention on DR-2041"
	aria-hidden={!open}
	inert={!open}
	onpointerdown={down}
	onpointermove={move}
	onpointerup={up}
	onpointercancel={up}
>
	<div class="pushbar">
		<button class="back" bind:this={backBtn} onclick={onback}
			><Icon name="chevL" />{backLabel}</button
		>
		<h2>Detention</h2>
	</div>
	<div class="dcontent">
		<div class="hero" class:stopped>
			<span class="pulse" class:stopped>
				{departedAt !== null ? `Truck left · ${clock(departedAt)}` : 'Elapsed · and counting'}
			</span>
			<div class="clock num">
				<span>{hmPad(det.elapsed)}</span><small>{secs(det.elapsed)}</small>
			</div>
			<div class="accrue num">
				<strong use:bump={det.amount}>{usd(det.amount)}</strong>{stopped
					? ' to bill · clock stopped'
					: ' accruing · after 2 hrs free'}
			</div>
			<div class="timeline">
				<div class="track">
					<span class="free" style:width={grown ? `${(free * 100).toFixed(2)}%` : '0'}></span>
					<span class="bill" style:width={grown ? `${((1 - free) * 100).toFixed(2)}%` : '0'}></span>
				</div>
				<div class="marks num">
					<div><b>{clock(arrivedAt)}</b>Arrived</div>
					<div><b>{clock(arrivedAt + FREE)}</b>Free time up</div>
					<div>
						<b>{departedAt !== null ? clock(departedAt) : 'now'}</b>{stopped
							? 'Departed'
							: hm(det.elapsed)}
					</div>
				</div>
			</div>
		</div>

		{#if headsUp}
			<div class="notice b-green">
				<Icon name="bell" /><span
					>Broker heads-up sent at {clock(arrivedAt + H)}, before the notice deadline.</span
				>
			</div>
		{:else}
			<div class="notice b-amber">
				<Icon name="bell" /><span
					>Heads-up automation is off. Turn it on in Automations to notify brokers for you.</span
				>
			</div>
		{/if}

		<div class="chips">
			<div class="chip">
				<span class="avatar">MO</span>
				<div>
					<div class="k">Driver</div>
					<div class="v">Maria Ortiz</div>
				</div>
			</div>
			<div class="chip">
				<span class="avatar pin"><Icon name="pin" style="width:18px;height:18px" /></span>
				<div>
					<div class="k">Receiver</div>
					<div class="v">Lodi Cold Storage</div>
				</div>
			</div>
		</div>

		<div class="figured">
			<h4>How it was figured</h4>
			<p>
				Receiver detention on DR-2041. Two free hours from the rate con, then $75 an hour, billed in
				15-minute steps.
			</p>
			<div class="kv"><span>Time at receiver</span><span class="num">{hm(det.elapsed)}</span></div>
			<div class="kv"><span>Free time</span><span class="num">2h 0m</span></div>
			<div class="kv">
				<span>Billable</span><span class="num">{hm(det.billable)} · {det.steps} steps</span>
			</div>
			<div class="kv">
				<span>Rate</span><span class="num">$75 / hr · {usd(STEP_USD, true)} a step</span>
			</div>
			<div class="kv" hidden={stopped}>
				<span>Next step</span>
				<span class="ring num">
					<svg viewBox="0 0 24 24" aria-hidden="true">
						<circle class="bgc" cx="12" cy="12" r="9" />
						<circle
							class="fgc"
							cx="12"
							cy="12"
							r="9"
							stroke-dasharray={RING}
							stroke-dashoffset={(RING * (det.toNext / STEP)).toFixed(2)}
						/>
					</svg>
					<span>+{usd(STEP_USD, true)} in {countdown(det.toNext)}</span>
				</span>
			</div>
			<div class="kv total">
				<span>To bill</span><span class="num">{usd(det.amount, true)}</span>
			</div>
		</div>

		<div class="figured">
			<h4>Broker</h4>
			<div class="kv"><span>Pinecrest Logistics</span><span>Dana Whitfield</span></div>
			<div class="kv"><span>Rate con</span><span class="num">$2,100 line haul</span></div>
			<div class="kv">
				<span>Request</span><span style:color={sentAt ? 'var(--ok)' : null}
					>{sentAt ? `Sent ${clock(sentAt)}` : 'Not sent yet'}</span
				>
			</div>
		</div>
	</div>
	<div class="actions">
		<button class="btn secondary press" onclick={ondepart}
			><Icon name="flag" /><span>{stopped ? 'Undo' : 'Truck left'}</span></button
		>
		<button class="btn press" onclick={onemail}><Icon name="mail" />Write email</button>
	</div>
</section>
