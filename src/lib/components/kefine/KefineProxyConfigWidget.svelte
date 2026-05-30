<script lang="ts">
  import { browser } from '$app/environment';
  import { cubicOut } from 'svelte/easing';
  import { kefineLocaleText } from '$lib/constants/kefine-locale';
  import { createQrMatrix, qrMatrixToSvgPath } from '$lib/kefine/qr-code';
  import {
    PROXY_PROTOCOLS,
    PROXY_REGIONS,
    buildProxyProfile,
    type ProxyProtocol,
    type ProxyRegion
  } from '$lib/kefine/proxy-config';

  let { active = false }: { active?: boolean } = $props();

  const localeText = $derived($kefineLocaleText);
  const copy = $derived(localeText.proxyWidget);

  let selectedRegion = $state<ProxyRegion>(PROXY_REGIONS[0]);
  let selectedProtocol = $state<ProxyProtocol>(PROXY_PROTOCOLS[0]);
  let copiedKey = $state<'link' | 'config' | null>(null);
  let copyResetTimer: ReturnType<typeof setTimeout> | null = null;

  const profile = $derived(buildProxyProfile(selectedRegion, selectedProtocol));

  // QR encodes the share link. The matrix is rendered as an SVG path coloured
  // with `currentColor`, which inherits the theme text token — so the code is a
  // warm Lefine tone on the card background (no white panel) and flips to a light
  // tone on dark themes automatically.
  const qr = $derived.by(() => {
    try {
      return createQrMatrix(profile.link, { errorCorrectionLevel: 'medium' });
    } catch {
      return null;
    }
  });
  const qrPath = $derived(qr ? qrMatrixToSvgPath(qr) : '');
  const qrViewBox = $derived(qr ? `-2 -2 ${qr.size + 4} ${qr.size + 4}` : '0 0 1 1');

  /** Smooth curtain-drop entrance, matching the task-row animation language. */
  function widgetReveal(_node: HTMLElement, { duration = 460 }: { duration?: number } = {}) {
    return {
      duration,
      easing: cubicOut,
      css: (t: number) => {
        const eased = cubicOut(t);
        const y = -18 * (1 - eased);
        const scale = 0.965 + 0.035 * eased;
        return `opacity:${Math.min(1, t * 1.2)}; transform:translateY(${y}px) scale(${scale.toFixed(4)}); transform-origin: top center;`;
      }
    };
  }

  function selectRegion(region: ProxyRegion) {
    selectedRegion = region;
  }

  function selectProtocol(protocol: ProxyProtocol) {
    selectedProtocol = protocol;
  }

  function flagCopied(key: 'link' | 'config') {
    copiedKey = key;
    if (copyResetTimer) {
      clearTimeout(copyResetTimer);
    }
    copyResetTimer = setTimeout(() => {
      copiedKey = null;
    }, 1600);
  }

  async function copyText(value: string, key: 'link' | 'config') {
    if (!browser) {
      return;
    }
    try {
      await navigator.clipboard.writeText(value);
      flagCopied(key);
    } catch {
      // Clipboard can be blocked (permissions / insecure context); fail quietly.
    }
  }

  function downloadConfig() {
    if (!browser) {
      return;
    }
    const blob = new Blob([profile.config], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = profile.fileName;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
  }
</script>

{#if active}
  <kefine-proxy-widget transition:widgetReveal aria-label={copy.title} data-testid="kefine-proxy-widget">
    <kefine-proxy-head>
      <kefine-proxy-badge>
        <kefine-proxy-pulse aria-hidden="true"></kefine-proxy-pulse>
        <lefine-text>{copy.badge}</lefine-text>
      </kefine-proxy-badge>
      <kefine-proxy-titles>
        <strong>{copy.title}</strong>
        <p>{copy.subtitle}</p>
      </kefine-proxy-titles>
    </kefine-proxy-head>

    <kefine-proxy-controls>
      <kefine-proxy-control-group role="group" aria-label={copy.regionLabel}>
        <kefine-proxy-control-label>{copy.regionLabel}</kefine-proxy-control-label>
        <kefine-proxy-options>
          {#each PROXY_REGIONS as region (region.id)}
            <button
              type="button"
              data-part="region-option"
              data-active={region.id === selectedRegion.id}
              aria-pressed={region.id === selectedRegion.id}
              onclick={() => selectRegion(region)}
            >
              <kefine-proxy-flag aria-hidden="true">{region.flag}</kefine-proxy-flag>
              <kefine-proxy-region-name>{region.city}</kefine-proxy-region-name>
              <kefine-proxy-ping>{copy.pingLabel} {region.pingMs}ms</kefine-proxy-ping>
            </button>
          {/each}
        </kefine-proxy-options>
      </kefine-proxy-control-group>

      <kefine-proxy-control-group role="group" aria-label={copy.protocolLabel}>
        <kefine-proxy-control-label>{copy.protocolLabel}</kefine-proxy-control-label>
        <kefine-proxy-segments>
          {#each PROXY_PROTOCOLS as protocol (protocol.id)}
            <button
              type="button"
              data-part="protocol-option"
              data-active={protocol.id === selectedProtocol.id}
              aria-pressed={protocol.id === selectedProtocol.id}
              onclick={() => selectProtocol(protocol)}
            >
              {protocol.label}
            </button>
          {/each}
        </kefine-proxy-segments>
      </kefine-proxy-control-group>
    </kefine-proxy-controls>

    <kefine-proxy-body>
      <kefine-proxy-qr-panel>
        <kefine-proxy-qr-frame>
          {#if qr}
            <svg viewBox={qrViewBox} role="img" aria-label={copy.qrTitle} preserveAspectRatio="xMidYMid meet">
              <path d={qrPath} fill="currentColor" shape-rendering="crispEdges"></path>
            </svg>
          {/if}
          <kefine-proxy-qr-glow aria-hidden="true"></kefine-proxy-qr-glow>
        </kefine-proxy-qr-frame>
        <kefine-proxy-qr-caption>
          <strong>{copy.qrTitle}</strong>
          <lefine-text>{copy.qrHint}</lefine-text>
        </kefine-proxy-qr-caption>
      </kefine-proxy-qr-panel>

      <kefine-proxy-details>
        <kefine-proxy-field>
          <kefine-proxy-field-head>
            <kefine-proxy-control-label>{copy.linkLabel}</kefine-proxy-control-label>
            <button type="button" data-part="copy-btn" data-copied={copiedKey === 'link'} onclick={() => copyText(profile.link, 'link')}>
              {copiedKey === 'link' ? copy.copied : copy.copyLink}
            </button>
          </kefine-proxy-field-head>
          <kefine-proxy-link-value>{profile.link}</kefine-proxy-link-value>
        </kefine-proxy-field>

        <kefine-proxy-field>
          <kefine-proxy-field-head>
            <kefine-proxy-control-label>{copy.configLabel}</kefine-proxy-control-label>
            <kefine-proxy-field-actions>
              <button type="button" data-part="copy-btn" data-copied={copiedKey === 'config'} onclick={() => copyText(profile.config, 'config')}>
                {copiedKey === 'config' ? copy.copied : copy.copyConfig}
              </button>
              <button type="button" data-part="download-btn" onclick={downloadConfig}>
                {copy.download}
              </button>
            </kefine-proxy-field-actions>
          </kefine-proxy-field-head>
          <kefine-proxy-config-value><code>{profile.config}</code></kefine-proxy-config-value>
          <kefine-proxy-file-name>{profile.fileName}</kefine-proxy-file-name>
        </kefine-proxy-field>
      </kefine-proxy-details>
    </kefine-proxy-body>
  </kefine-proxy-widget>
{/if}

<style>
  kefine-proxy-widget {
    display: flex;
    flex-direction: column;
    gap: var(--kef-space-3, 1.35rem);
    margin: 0.4rem 0 1.1rem;
    padding: clamp(1rem, 2.4vw, 1.45rem);
    background:
      radial-gradient(120% 140% at 0% 0%, color-mix(in oklab, var(--kef-accent) 12%, transparent), transparent 60%),
      var(--kef-bg-card);
    border: 1px solid var(--kef-line);
    border-radius: var(--kef-radius-lg, 1rem);
    box-shadow: 0 18px 40px -32px color-mix(in oklab, var(--lefine-text) 60%, transparent);
  }

  kefine-proxy-head {
    display: flex;
    flex-direction: column;
    gap: 0.55rem;
  }

  kefine-proxy-badge {
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;
    align-self: flex-start;
    padding: 0.28rem 0.6rem;
    border-radius: 999px;
    background: color-mix(in oklab, var(--kef-accent) 16%, transparent);
    color: var(--kef-accent);
    font-size: 0.7rem;
    font-weight: 700;
    letter-spacing: 0.06em;
    text-transform: uppercase;
  }

  kefine-proxy-pulse {
    display: block;
    width: 7px;
    height: 7px;
    border-radius: 50%;
    background: var(--kef-accent);
    box-shadow: 0 0 0 0 color-mix(in oklab, var(--kef-accent) 70%, transparent);
    animation: kefine-proxy-pulse 1.8s ease-out infinite;
  }

  @keyframes kefine-proxy-pulse {
    0% {
      box-shadow: 0 0 0 0 color-mix(in oklab, var(--kef-accent) 65%, transparent);
    }
    70% {
      box-shadow: 0 0 0 7px transparent;
    }
    100% {
      box-shadow: 0 0 0 0 transparent;
    }
  }

  kefine-proxy-titles {
    display: flex;
    flex-direction: column;
    gap: 0.2rem;
  }

  kefine-proxy-titles strong {
    font-size: 1.05rem;
    font-weight: 700;
    color: var(--lefine-text);
  }

  kefine-proxy-titles p {
    margin: 0;
    font-size: 0.82rem;
    line-height: 1.45;
    color: var(--lefine-text-soft);
  }

  kefine-proxy-controls {
    display: flex;
    flex-wrap: wrap;
    gap: var(--kef-space-3, 1.35rem);
  }

  kefine-proxy-control-group {
    display: flex;
    flex-direction: column;
    gap: 0.45rem;
    flex: 1 1 16rem;
    min-width: 0;
  }

  kefine-proxy-control-label {
    display: block;
    font-size: 0.68rem;
    font-weight: 700;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    color: var(--lefine-text-soft);
  }

  kefine-proxy-options {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
  }

  kefine-proxy-options button {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 0.15rem;
    padding: 0.55rem 0.7rem;
    border: 1px solid var(--kef-line);
    border-radius: var(--kef-radius-ui, 0.72rem);
    background: var(--kef-bg-soft);
    color: var(--lefine-text);
    cursor: pointer;
    transition: border-color 0.18s ease, background 0.18s ease, transform 0.18s ease;
  }

  kefine-proxy-options button:hover {
    transform: translateY(-1px);
    border-color: color-mix(in oklab, var(--kef-accent) 45%, var(--kef-line));
  }

  kefine-proxy-options button[data-active='true'] {
    border-color: var(--kef-accent);
    background: color-mix(in oklab, var(--kef-accent) 14%, var(--kef-bg-soft));
    box-shadow: inset 0 0 0 1px color-mix(in oklab, var(--kef-accent) 40%, transparent);
  }

  kefine-proxy-flag {
    display: block;
    font-size: 1.05rem;
    line-height: 1;
  }

  kefine-proxy-region-name {
    display: block;
    font-size: 0.84rem;
    font-weight: 600;
  }

  kefine-proxy-ping {
    display: block;
    font-size: 0.68rem;
    color: var(--lefine-text-soft);
  }

  kefine-proxy-segments {
    display: inline-flex;
    padding: 0.25rem;
    gap: 0.2rem;
    border: 1px solid var(--kef-line);
    border-radius: 999px;
    background: var(--kef-bg-soft);
    align-self: flex-start;
    flex-wrap: wrap;
  }

  kefine-proxy-segments button {
    padding: 0.4rem 0.85rem;
    border: none;
    border-radius: 999px;
    background: transparent;
    color: var(--lefine-text-soft);
    font-size: 0.8rem;
    font-weight: 600;
    cursor: pointer;
    transition: background 0.18s ease, color 0.18s ease;
  }

  kefine-proxy-segments button[data-active='true'] {
    background: var(--kef-accent);
    color: var(--kef-on-primary, #fff);
  }

  kefine-proxy-body {
    display: flex;
    flex-wrap: wrap;
    gap: var(--kef-space-3, 1.35rem);
    align-items: stretch;
  }

  kefine-proxy-qr-panel {
    display: flex;
    flex-direction: column;
    gap: 0.55rem;
    flex: 0 0 auto;
    align-items: center;
    text-align: center;
  }

  kefine-proxy-qr-frame {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0.85rem;
    border-radius: var(--kef-radius-lg, 1rem);
    border: 1px solid var(--kef-line);
    background:
      linear-gradient(135deg, color-mix(in oklab, var(--kef-accent) 10%, transparent), transparent 70%),
      var(--kef-bg-soft);
    color: var(--lefine-text);
  }

  kefine-proxy-qr-frame svg {
    position: relative;
    z-index: 1;
    width: clamp(8.5rem, 32vw, 10.5rem);
    height: auto;
    aspect-ratio: 1 / 1;
  }

  kefine-proxy-qr-glow {
    position: absolute;
    inset: 18%;
    border-radius: 50%;
    background: radial-gradient(circle, color-mix(in oklab, var(--kef-accent) 22%, transparent), transparent 70%);
    filter: blur(14px);
    z-index: 0;
    pointer-events: none;
  }

  kefine-proxy-qr-caption {
    display: flex;
    flex-direction: column;
    gap: 0.1rem;
  }

  kefine-proxy-qr-caption strong {
    font-size: 0.82rem;
    font-weight: 700;
    color: var(--lefine-text);
  }

  kefine-proxy-qr-caption lefine-text {
    display: block;
    font-size: 0.72rem;
    color: var(--lefine-text-soft);
    max-width: 12rem;
  }

  kefine-proxy-details {
    display: flex;
    flex-direction: column;
    gap: var(--kef-space-2, 1rem);
    flex: 1 1 18rem;
    min-width: 0;
  }

  kefine-proxy-field {
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
  }

  kefine-proxy-field-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.5rem;
    flex-wrap: wrap;
  }

  kefine-proxy-field-actions {
    display: inline-flex;
    gap: 0.4rem;
    flex-wrap: wrap;
  }

  kefine-proxy-field-head button {
    padding: 0.32rem 0.7rem;
    border: 1px solid var(--kef-line);
    border-radius: var(--kef-radius-ui, 0.72rem);
    background: var(--kef-bg-card);
    color: var(--lefine-text);
    font-size: 0.74rem;
    font-weight: 600;
    cursor: pointer;
    transition: border-color 0.18s ease, color 0.18s ease, background 0.18s ease;
  }

  kefine-proxy-field-head button:hover {
    border-color: color-mix(in oklab, var(--kef-accent) 55%, var(--kef-line));
    color: var(--kef-accent);
  }

  kefine-proxy-field-head button[data-copied='true'] {
    border-color: var(--kef-accent);
    color: var(--kef-accent);
    background: color-mix(in oklab, var(--kef-accent) 12%, var(--kef-bg-card));
  }

  kefine-proxy-field-head button[data-part='download-btn'] {
    background: color-mix(in oklab, var(--kef-accent) 14%, var(--kef-bg-card));
    border-color: color-mix(in oklab, var(--kef-accent) 38%, var(--kef-line));
    color: var(--kef-accent);
  }

  kefine-proxy-link-value {
    display: block;
    padding: 0.6rem 0.7rem;
    border: 1px solid var(--kef-line);
    border-radius: var(--kef-radius-md, 0.45rem);
    background: var(--kef-bg-soft);
    color: var(--lefine-text);
    font-family: 'Fira Mono', ui-monospace, monospace;
    font-size: 0.72rem;
    line-height: 1.4;
    word-break: break-all;
  }

  kefine-proxy-config-value {
    display: block;
    max-height: 11rem;
    overflow: auto;
    padding: 0.6rem 0.7rem;
    border: 1px solid var(--kef-line);
    border-radius: var(--kef-radius-md, 0.45rem);
    background: var(--kef-bg-soft);
  }

  kefine-proxy-config-value code {
    display: block;
    white-space: pre;
    font-family: 'Fira Mono', ui-monospace, monospace;
    font-size: 0.72rem;
    line-height: 1.5;
    color: var(--lefine-text);
  }

  kefine-proxy-file-name {
    display: block;
    font-size: 0.68rem;
    color: var(--lefine-text-soft);
    font-family: 'Fira Mono', ui-monospace, monospace;
  }

  @media (max-width: 560px) {
    kefine-proxy-body {
      flex-direction: column;
    }

    kefine-proxy-qr-panel {
      align-self: center;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    kefine-proxy-pulse {
      animation: none;
    }
  }
</style>
