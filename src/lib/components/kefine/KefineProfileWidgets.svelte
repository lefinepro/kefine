<script lang="ts">
  import KefineWeatherWidget from '$lib/components/kefine/KefineWeatherWidget.svelte';
  import KefineClockWidget from '$lib/components/kefine/KefineClockWidget.svelte';
  import KefineTranslatorWidget from '$lib/components/kefine/KefineTranslatorWidget.svelte';
  import KefineMusicWidget from '$lib/components/kefine/KefineMusicWidget.svelte';
  import KefineProxyConfigWidget from '$lib/components/kefine/KefineProxyConfigWidget.svelte';
  import { parseProfileWidgetBlocks } from '$lib/profile/profile-social-org';

  // Widgets live directly inside the profile: the blocks the owner declares in
  // the profile's Org document render inline here, instead of being hidden behind
  // the command palette. Each block keeps its free-typed argument (the city for
  // weather/clock, the language pair for translate) so the inline widget shows
  // the same data a visitor would get from the palette.
  let {
    widgetsOrg = ''
  }: {
    widgetsOrg?: string | null;
  } = $props();

  const blocks = $derived(parseProfileWidgetBlocks(widgetsOrg ?? ''));
</script>

{#if blocks.length > 0}
  <lef-profile-widgets data-testid="profile-widgets">
    {#each blocks as block (block.id)}
      <lef-profile-widget data-widget={block.type} data-testid="profile-widget">
        {#if block.type === 'weather'}
          <KefineWeatherWidget active query={block.query} />
        {:else if block.type === 'clock'}
          <KefineClockWidget active query={block.query} />
        {:else if block.type === 'translate'}
          <KefineTranslatorWidget active query={block.query} />
        {:else if block.type === 'music'}
          <KefineMusicWidget active />
        {:else if block.type === 'proxy'}
          <KefineProxyConfigWidget active />
        {/if}
      </lef-profile-widget>
    {/each}
  </lef-profile-widgets>
{/if}

<style>
  lef-profile-widgets {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(min(18rem, 100%), 1fr));
    gap: 0.75rem;
    margin-top: 0.6rem;
  }

  lef-profile-widget {
    display: block;
    min-width: 0;
  }
</style>
