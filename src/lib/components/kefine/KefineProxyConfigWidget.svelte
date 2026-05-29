<script lang="ts">
  import { browser } from '$app/environment';
  import Icon from '@iconify/svelte';
  import { scheduleAfter } from '$lib/utils/helpers';
  import { buildQrMatrix } from '$lib/kefine/kefine-qr';
  import type { ProxyConfigOption } from '$lib/kefine/kefine-proxy-configs';

  let {
    configs,
    title,
    subtitle,
    configsLabel,
    protocolLabel,
    scanHintLabel,
    copyLabel,
    copiedLabel,
    downloadLabel
  }: {
    configs: readonly ProxyConfigOption[];
    title: string;
    subtitle: string;
    configsLabel: string;
    protocolLabel: string;
    scanHintLabel: string;
    copyLabel: string;
    copiedLabel: string;
    downloadLabel: string;
  } = $props();

  let selectedId = $state('');
  let copiedId = $state<string | null>(null);
  let cancelCopyReset: (() => void) | null = null;

  const selectedConfig = $derived(
    configs.find((config) => config.id === selectedId) ?? configs[0] ?? null
  );

  const qr = $derived(selectedConfig ? buildQrMatrix(selectedConfig.link) : null);
  const qrViewBox = $derived(qr ? `0 0 ${qr.size} ${qr.size}` : '0 0 1 1');

  // Keep the selection valid when the config list changes.
  $effect(() => {
    if (configs.length === 0) {
      selectedId = '';
      return;
    }

    if (!configs.some((config) => config.id === selectedId)) {
      selectedId = configs[0]?.id ?? '';
    }
  });

  $effect(() => {
    return () => {
      cancelCopyReset?.();
      cancelCopyReset = null;
    };
  });

  function selectConfig(id: string) {
    selectedId = id;
  }

  async function copyLink(config: ProxyConfigOption, event: MouseEvent) {
    event.stopPropagation();
    selectedId = config.id;

    if (browser && navigator.clipboard?.writeText) {
      try {
        await navigator.clipboard.writeText(config.link);
      } catch {
        // Clipboard may be unavailable (permissions, insecure context) — ignore.
      }
    }

    copiedId = config.id;
    cancelCopyReset?.();
    cancelCopyReset = scheduleAfter(1600, () => {
      copiedId = null;
      cancelCopyReset = null;
    });
  }

  function downloadConfig(config: ProxyConfigOption, event: MouseEvent) {
    event.stopPropagation();
    selectedId = config.id;

    if (!browser) {
      return;
    }

    const blob = new Blob([config.config], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = config.fileName;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
  }
</script>

<lef-proxy-widget data-testid="kefine-proxy-widget" aria-label={title}>
  <lef-proxy-head>
    <lef-proxy-head-icon aria-hidden="true">
      <Icon icon="mdi:server-network" width="18" height="18" />
    </lef-proxy-head-icon>
    <lef-proxy-head-copy>
      <strong>{title}</strong>
      <p>{subtitle}</p>
    </lef-proxy-head-copy>
  </lef-proxy-head>

  <lef-proxy-body>
    <lef-proxy-configs role="group" aria-label={configsLabel}>
      <lefine-text data-part="section-label">{configsLabel}</lefine-text>
      {#each configs as config, index (config.id)}
        <lef-proxy-config-row
          data-selected={config.id === selectedId}
          style={`--lef-proxy-row-index: ${index};`}
        >
          <button
            type="button"
            data-part="config-select"
            data-testid={`kefine-proxy-select-${config.id}`}
            aria-pressed={config.id === selectedId}
            onclick={() => selectConfig(config.id)}
          >
            <lef-proxy-config-name>
              <strong>{config.name}</strong>
              <lefine-text>{config.location}</lefine-text>
            </lef-proxy-config-name>
            <lef-proxy-protocol aria-label={`${protocolLabel}: ${config.protocol}`}>{config.protocol}</lef-proxy-protocol>
          </button>
          <lef-proxy-config-actions>
            <button
              type="button"
              data-part="config-action"
              data-state={copiedId === config.id ? 'done' : 'idle'}
              data-testid={`kefine-proxy-copy-${config.id}`}
              title={copiedId === config.id ? copiedLabel : copyLabel}
              aria-label={copiedId === config.id ? copiedLabel : copyLabel}
              onclick={(event) => copyLink(config, event)}
            >
              <Icon icon={copiedId === config.id ? 'mdi:check' : 'mdi:content-copy'} width="16" height="16" />
            </button>
            <button
              type="button"
              data-part="config-action"
              data-testid={`kefine-proxy-download-${config.id}`}
              title={downloadLabel}
              aria-label={downloadLabel}
              onclick={(event) => downloadConfig(config, event)}
            >
              <Icon icon="mdi:download-outline" width="16" height="16" />
            </button>
          </lef-proxy-config-actions>
        </lef-proxy-config-row>
      {/each}
    </lef-proxy-configs>

    <lef-proxy-qr-card>
      {#if selectedConfig && qr}
        <lefine-text data-part="qr-name">{selectedConfig.name}</lefine-text>
        <lef-proxy-qr-frame>
          <svg
            class="kefine-proxy-qr"
            viewBox={qrViewBox}
            role="img"
            aria-label={`${scanHintLabel}: ${selectedConfig.name}`}
            data-testid="kefine-proxy-qr"
          >
            <defs>
              <linearGradient id={`proxy-qr-${selectedConfig.id}`} x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stop-color="var(--kef-primary)" />
                <stop offset="100%" stop-color="var(--kef-accent)" />
              </linearGradient>
            </defs>
            <path class="kefine-proxy-qr-data" d={qr.dataPath} fill="currentColor" />
            <path d={qr.finderPath} fill={`url(#proxy-qr-${selectedConfig.id})`} />
          </svg>
        </lef-proxy-qr-frame>
        <lefine-text data-part="qr-hint">{scanHintLabel}</lefine-text>
        <lef-proxy-qr-link title={selectedConfig.link}>{selectedConfig.link}</lef-proxy-qr-link>
      {/if}
    </lef-proxy-qr-card>
  </lef-proxy-body>
</lef-proxy-widget>

<style>
  lef-proxy-widget {
    display: grid;
    gap: 0.85rem;
    width: 100%;
    padding: 0.95rem 1rem 1.05rem;
    border-radius: var(--kef-radius-ui);
    border: var(--kef-border-width-soft) solid var(--kef-line);
    background: color-mix(in oklab, var(--kef-bg-card) 92%, var(--kef-bg-soft) 8%);
    box-shadow:
      inset 0 1px 0 color-mix(in oklab, white 16%, transparent),
      0 10px 26px color-mix(in oklab, var(--lefine-text) 6%, transparent);
  }

  lef-proxy-head {
    display: grid;
    grid-template-columns: auto minmax(0, 1fr);
    align-items: center;
    gap: 0.65rem;
  }

  lef-proxy-head-icon {
    display: grid;
    place-items: center;
    width: 2.15rem;
    height: 2.15rem;
    border-radius: var(--kef-radius-md);
    color: var(--kef-on-primary);
    background:
      linear-gradient(150deg, var(--kef-primary), color-mix(in oklab, var(--kef-accent) 60%, var(--kef-primary)));
  }

  lef-proxy-head-copy {
    display: grid;
    gap: 0.1rem;
    min-width: 0;
  }

  lef-proxy-head-copy strong {
    font-size: 1rem;
    letter-spacing: -0.01em;
    color: var(--lefine-text);
  }

  lef-proxy-head-copy p {
    margin: 0;
    font-size: 0.8rem;
    color: var(--lefine-text-soft);
  }

  lef-proxy-body {
    display: grid;
    grid-template-columns: minmax(0, 1.35fr) minmax(0, 1fr);
    gap: 0.85rem;
    align-items: stretch;
  }

  lef-proxy-configs {
    display: grid;
    align-content: start;
    gap: 0.4rem;
  }

  [data-part='section-label'] {
    font-size: 0.72rem;
    font-weight: 660;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    color: var(--lefine-text-soft);
  }

  lef-proxy-config-row {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    align-items: stretch;
    gap: 0.3rem;
    padding: 0.3rem;
    border-radius: var(--kef-radius-md);
    border: var(--kef-border-width-soft) solid var(--kef-line-soft);
    background: color-mix(in oklab, var(--kef-bg-card) 96%, var(--kef-bg));
    transition:
      border-color var(--kef-motion-fast) var(--kef-ease-soft),
      background-color var(--kef-motion-fast) var(--kef-ease-soft),
      transform var(--kef-motion-fast) var(--kef-ease-soft);
    animation: proxy-row-rise var(--kef-motion-base) var(--kef-ease-soft) backwards;
    animation-delay: calc(var(--lef-proxy-row-index, 0) * 70ms + 80ms);
  }

  lef-proxy-config-row[data-selected='true'] {
    border-color: var(--kef-line-primary);
    background: color-mix(in oklab, var(--kef-primary) 10%, var(--kef-bg-card));
  }

  lef-proxy-config-row [data-part='config-select'] {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    align-items: center;
    gap: 0.5rem;
    width: 100%;
    padding: 0.4rem 0.5rem;
    border: 0;
    border-radius: calc(var(--kef-radius-md) - 0.08rem);
    background: transparent;
    color: inherit;
    text-align: left;
    cursor: pointer;
  }

  lef-proxy-config-name {
    display: grid;
    gap: 0.05rem;
    min-width: 0;
  }

  lef-proxy-config-name strong {
    font-size: 0.9rem;
    color: var(--lefine-text);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  lef-proxy-config-name lefine-text {
    font-size: 0.74rem;
    color: var(--lefine-text-soft);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  lef-proxy-protocol {
    flex: 0 0 auto;
    padding: 0.15rem 0.45rem;
    border-radius: 999px;
    font-size: 0.68rem;
    font-weight: 640;
    letter-spacing: 0.02em;
    color: var(--kef-primary);
    background: color-mix(in oklab, var(--kef-primary) 14%, transparent);
    white-space: nowrap;
  }

  lef-proxy-config-actions {
    display: inline-flex;
    align-items: center;
    gap: 0.2rem;
  }

  lef-proxy-config-row [data-part='config-action'] {
    display: inline-grid;
    place-items: center;
    width: 2rem;
    height: 2rem;
    border-radius: var(--kef-radius-sm);
    border: var(--kef-border-width-soft) solid transparent;
    background: transparent;
    color: var(--lefine-text-soft);
    cursor: pointer;
    transition:
      color var(--kef-motion-fast) var(--kef-ease-soft),
      border-color var(--kef-motion-fast) var(--kef-ease-soft),
      background-color var(--kef-motion-fast) var(--kef-ease-soft);
  }

  lef-proxy-config-row [data-part='config-action']:hover {
    color: var(--kef-primary);
    border-color: var(--kef-line-primary);
    background: color-mix(in oklab, var(--kef-primary) 8%, transparent);
  }

  lef-proxy-config-row [data-part='config-action'][data-state='done'] {
    color: var(--kef-success);
    border-color: var(--kef-line-success);
  }

  lef-proxy-qr-card {
    display: grid;
    grid-template-rows: auto 1fr auto auto;
    justify-items: center;
    gap: 0.4rem;
    padding: 0.8rem 0.85rem 0.7rem;
    border-radius: var(--kef-radius-md);
    border: var(--kef-border-width-soft) solid var(--kef-line-soft);
    background: color-mix(in oklab, var(--kef-bg-soft) 60%, var(--kef-bg-card));
    animation: proxy-qr-rise var(--kef-motion-base) var(--kef-ease-soft) backwards;
    animation-delay: 140ms;
  }

  [data-part='qr-name'] {
    font-size: 0.82rem;
    font-weight: 640;
    color: var(--lefine-text);
  }

  lef-proxy-qr-frame {
    display: grid;
    place-items: center;
    width: 100%;
    padding: 0.45rem;
  }

  .kefine-proxy-qr {
    width: min(100%, 11rem);
    height: auto;
    color: var(--lefine-text);
    overflow: visible;
  }

  .kefine-proxy-qr-data {
    transition: fill var(--kef-motion-fast) var(--kef-ease-soft);
  }

  [data-part='qr-hint'] {
    font-size: 0.74rem;
    color: var(--lefine-text-soft);
  }

  lef-proxy-qr-link {
    display: block;
    max-width: 100%;
    font-size: 0.68rem;
    color: var(--lefine-text-soft);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    opacity: 0.85;
  }

  @keyframes proxy-row-rise {
    from {
      opacity: 0;
      transform: translateY(6px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  @keyframes proxy-qr-rise {
    from {
      opacity: 0;
      transform: scale(0.96);
    }
    to {
      opacity: 1;
      transform: scale(1);
    }
  }

  @media (max-width: 640px) {
    lef-proxy-body {
      grid-template-columns: minmax(0, 1fr);
    }
  }

  @media (prefers-reduced-motion: reduce) {
    lef-proxy-config-row,
    lef-proxy-qr-card {
      animation: none;
    }
  }
</style>
