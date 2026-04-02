<script lang="ts">
  import type { VpnDeliveryGuide } from './kefine-workflow';

  let {
    guide
  }: {
    guide: VpnDeliveryGuide;
  } = $props();
</script>

<lefine-box class="kefine-vpn-guide__steps">
  {#each guide.steps as step}
    <article class="kefine-vpn-guide__card" data-step={step.id}>
      <h3>{step.title}</h3>
      <p>{step.summary}</p>

      {#if step.apps}
        <lefine-box class="kefine-vpn-guide__apps">
          {#each step.apps as app}
            <a class="kefine-vpn-guide__pill kefine-vpn-guide__pill--link" href={app.href} target="_blank" rel="noreferrer">
              {app.label}
            </a>
          {/each}
        </lefine-box>
      {/if}

      {#if step.exampleVlessLink}
        <pre class="kefine-vpn-guide__code"><code>{step.exampleVlessLink}</code></pre>
      {/if}

      {#if step.linuxClient}
        <ol class="kefine-vpn-guide__list">
          {#each step.linuxClient as item}
            <li>{item}</li>
          {/each}
        </ol>
      {/if}

      {#if step.otherClientsNote}
        <small class="kefine-vpn-guide__note">{step.otherClientsNote}</small>
      {/if}
    </article>
  {/each}
</lefine-box>
