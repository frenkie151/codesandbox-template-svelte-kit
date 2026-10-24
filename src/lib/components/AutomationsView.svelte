<script lang="ts">
	import Icon from './Icon.svelte';
	import TabView from './TabView.svelte';
	import Toggle from './Toggle.svelte';
	import { automations, type AutoKey } from '$lib/detention';

	let {
		active,
		autos,
		ontoggle
	}: { active: boolean; autos: Record<AutoKey, boolean>; ontoggle: (key: AutoKey) => void } =
		$props();
	let open = $state<AutoKey | null>(null);
</script>

<TabView id="v-auto" title="Automations" {active}>
	<div class="largetitle">
		<div>
			<div class="date">Sent for you</div>
			<h1>Automations</h1>
		</div>
	</div>

	<div class="feature">
		<div class="row">
			<span class="badge b-amber"><Icon name="hourglass" /></span>
			<b>Detention heads-up</b>
			<Toggle on={autos.headsup} label="Detention heads-up" onchange={() => ontoggle('headsup')} />
		</div>
		<p>
			Tells the broker before their notice deadline, or the moment detention starts when no advance
			notice is required.
		</p>
	</div>

	<div class="section-h"><h3>All automations</h3></div>
	<div class="group">
		{#each automations as a (a.key)}
			<div class="item auto-row">
				<span class="badge b-amber"><Icon name={a.icon} /></span>
				<div class="txt">
					<div class="ttl">
						{a.title}
						<button
							class="info"
							aria-expanded={open === a.key}
							aria-controls="ex-{a.key}"
							aria-label="About {a.title}"
							onclick={() => (open = open === a.key ? null : a.key)}
						>
							<Icon name="info" />
						</button>
					</div>
				</div>
				<Toggle on={autos[a.key]} label={a.title} onchange={() => ontoggle(a.key)} />
				<div class="explain" class:open={open === a.key} id="ex-{a.key}"><div>{a.detail}</div></div>
			</div>
		{/each}
	</div>
	<p class="footnote">Each switch acts only from the moment you turn it on.</p>
</TabView>
