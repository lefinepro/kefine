<script lang="ts">
  import KefineWeatherWidget from '$lib/components/kefine/KefineWeatherWidget.svelte';
  import KefineClockWidget from '$lib/components/kefine/KefineClockWidget.svelte';
  import { parseProfileWidgetBlocks } from '$lib/profile/profile-social-org';

  let { widgetsOrg = '' }: { widgetsOrg?: string | null } = $props();

  // The org document is the source of truth: owners edit `#+begin_<widget>`
  // blocks and the profile renders each recognised block inline, in order.
  const blocks = $derived(parseProfileWidgetBlocks(widgetsOrg));

  // The weather widget detects intent from a natural prompt, so turn a bare
  // block into `weather` (local geolocation) and a `Tokyo` argument into
  // `weather Tokyo` (named). The clock widget accepts a raw place directly.
  function weatherQuery(query: string): string {
    return query.trim() ? `weather ${query.trim()}` : 'weather';
  }
</script>

{#if blocks.length > 0}
  <kefine-profile-widgets data-testid="kefine-profile-widgets">
    {#each blocks as block (block.id)}
      {#if block.type === 'clock'}
        <KefineClockWidget active query={block.query} />
      {:else if block.type === 'weather'}
        <KefineWeatherWidget active query={weatherQuery(block.query)} />
      {/if}
    {/each}
  </kefine-profile-widgets>
{/if}

<style>
  kefine-profile-widgets {
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
    width: 100%;
    min-width: 0;
  }
</style>
