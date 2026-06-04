<script lang="ts">
  import KefineWeatherWidget from '$lib/components/kefine/KefineWeatherWidget.svelte';
  import KefineClockWidget from '$lib/components/kefine/KefineClockWidget.svelte';
  import KefineTranslatorWidget from '$lib/components/kefine/KefineTranslatorWidget.svelte';
  import KefineMusicWidget from '$lib/components/kefine/KefineMusicWidget.svelte';
  import KefineProxyConfigWidget from '$lib/components/kefine/KefineProxyConfigWidget.svelte';
  import { kefineLocaleText } from '$lib/constants/kefine-locale';
  import {
    describeProfileWidget,
    parseProfileWidgetBlocks,
    type ProfileWidgetType
  } from '$lib/profile/profile-social-org';

  let { widgetsOrg = '' }: { widgetsOrg?: string | null } = $props();

  const localeText = $derived($kefineLocaleText);

  // The org document is the source of truth: owners edit `#+begin_<widget>`
  // blocks and the profile renders each recognised block inline, in order. Each
  // block is paired with its standard, typed definition so it can be wrapped in
  // a single consistent block frame (header + body) rather than bespoke chrome.
  const widgets = $derived(
    parseProfileWidgetBlocks(widgetsOrg).map((block) => ({
      block,
      definition: describeProfileWidget(block.type)
    }))
  );

  // The weather widget detects intent from a natural prompt, so turn a bare
  // block into `weather` (local geolocation) and a `Tokyo` argument into
  // `weather Tokyo` (named). The clock widget accepts a raw place directly.
  function weatherQuery(query: string): string {
    return query.trim() ? `weather ${query.trim()}` : 'weather';
  }

  function widgetLabel(type: ProfileWidgetType): string {
    switch (type) {
      case 'clock':
        return localeText.profile.widgetClockLabel;
      case 'weather':
        return localeText.profile.widgetWeatherLabel;
      case 'translate':
        return localeText.profile.widgetTranslateLabel;
      case 'music':
        return localeText.profile.widgetMusicLabel;
      case 'proxy':
        return localeText.profile.widgetProxyLabel;
    }
  }
</script>

{#if widgets.length > 0}
  <kefine-profile-widgets data-testid="kefine-profile-widgets">
    {#each widgets as { block, definition } (block.id)}
      <kefine-widget-block data-widget-type={definition.type} data-as-type={definition.objectType}>
        <kefine-widget-block-head>
          <lefine-text data-part="widget-name">{widgetLabel(definition.type)}</lefine-text>
          <lefine-text data-part="widget-type" title={localeText.profile.widgetTypeHint}>
            {definition.objectType}
          </lefine-text>
        </kefine-widget-block-head>
        <kefine-widget-block-body>
          {#if block.type === 'clock'}
            <KefineClockWidget active query={block.query} />
          {:else if block.type === 'weather'}
            <KefineWeatherWidget active query={weatherQuery(block.query)} />
          {:else if block.type === 'translate'}
            <KefineTranslatorWidget active query={block.query} />
          {:else if block.type === 'music'}
            <KefineMusicWidget active />
          {:else if block.type === 'proxy'}
            <KefineProxyConfigWidget active />
          {/if}
        </kefine-widget-block-body>
      </kefine-widget-block>
    {/each}
  </kefine-profile-widgets>
{/if}

<style>
  kefine-profile-widgets {
    display: flex;
    flex-direction: column;
    gap: 0.6rem;
    width: 100%;
    min-width: 0;
  }

  kefine-widget-block {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    min-width: 0;
    padding: 0.75rem;
    border-radius: 0.9rem;
    border: 1px solid color-mix(in oklab, var(--kef-color-text) 9%, transparent);
    background: color-mix(in oklab, var(--kef-color-bg) 40%, var(--kef-color-bg-card));
  }

  kefine-widget-block-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.5rem;
  }

  kefine-widget-block-head [data-part='widget-name'] {
    font-size: 0.86rem;
    font-weight: 600;
    letter-spacing: 0.01em;
  }

  kefine-widget-block-head [data-part='widget-type'] {
    padding: 0.1rem 0.5rem;
    border-radius: 999px;
    border: 1px solid color-mix(in oklab, var(--kef-color-primary) 26%, transparent);
    background: color-mix(in oklab, var(--kef-color-primary) 10%, transparent);
    color: color-mix(in oklab, var(--kef-color-text) 72%, var(--kef-color-primary));
    font-size: 0.68rem;
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }

  kefine-widget-block-body {
    display: block;
    min-width: 0;
  }
</style>
