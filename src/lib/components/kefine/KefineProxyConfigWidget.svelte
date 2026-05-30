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
  let copiedRegionId = $state<string | null>(null);
  let copyResetTimer: ReturnType<typeof setTimeout> | null = null;

  // The right-hand QR card always mirrors the row highlighted in the left list.
  const selectedProfile = $derived(buildProxyProfile(selectedRegion, selectedProtocol));

  // QR encodes the selected share link. The matrix is rendered as an SVG path
  // coloured with `currentColor`, which inherits the theme text token — so the
  // code is a warm Lefine tone on the card background (never a white panel) and
  // flips to a light tone on dark themes automatically.
  const qr = $derived.by(() => {
    try {
      return createQrMatrix(selectedProfile.link, { errorCorrectionLevel: 'medium' });
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

  function flagCopied(regionId: string) {
    copiedRegionId = regionId;
    if (copyResetTimer) {
      clearTimeout(copyResetTimer);
    }
    copyResetTimer = setTimeout(() => {
      copiedRegionId = null;
    }, 1600);
  }

  async function copyLink(region: ProxyRegion) {
    if (!browser) {
      return;
    }
    const profile = buildProxyProfile(region, selectedProtocol);
    selectRegion(region);
    try {
      await navigator.clipboard.writeText(profile.link);
      flagCopied(region.id);
    } catch {
      // Clipboard can be blocked (permissions / insecure context); fail quietly.
    }
  }

  function downloadConfig(region: ProxyRegion) {
    if (!browser) {
      return;
    }
    const profile = buildProxyProfile(region, selectedProtocol);
    selectRegion(region);
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

    <kefine-proxy-grid>
      <!-- Left card: switchable list of proxy servers, each with copy + download -->
      <kefine-proxy-list-card>
        <kefine-proxy-card-head>
          <kefine-proxy-control-label>{copy.serversLabel}</kefine-proxy-control-label>
          <kefine-proxy-segments role="group" aria-label={copy.protocolLabel}>
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
        </kefine-proxy-card-head>

        <kefine-proxy-list role="listbox" aria-label={copy.serversLabel}>
          {#each PROXY_REGIONS as region (region.id)}
            <kefine-proxy-row data-active={region.id === selectedRegion.id}>
              <button
                type="button"
                data-part="region-option"
                role="option"
                aria-selected={region.id === selectedRegion.id}
                onclick={() => selectRegion(region)}
              >
                <kefine-proxy-flag aria-hidden="true">{region.flag}</kefine-proxy-flag>
                <kefine-proxy-row-text>
                  <kefine-proxy-region-name>{region.city}</kefine-proxy-region-name>
                  <kefine-proxy-ping>{copy.pingLabel} {region.pingMs}ms</kefine-proxy-ping>
                </kefine-proxy-row-text>
              </button>
              <kefine-proxy-row-actions>
                <button
                  type="button"
                  data-part="copy-btn"
                  data-copied={copiedRegionId === region.id}
                  aria-label={copy.copyLinkAria(region.city)}
                  title={copy.copyLink}
                  onclick={() => copyLink(region)}
                >
                  {#if copiedRegionId === region.id}
                    <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                      <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                    <lefine-text>{copy.copied}</lefine-text>
                  {:else}
                    <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                      <path d="M10 13a5 5 0 0 0 7.07 0l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path>
                      <path d="M14 11a5 5 0 0 0-7.07 0l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>
                    </svg>
                    <lefine-text>{copy.copyLink}</lefine-text>
                  {/if}
                </button>
                <button
                  type="button"
                  data-part="download-btn"
                  aria-label={copy.downloadAria(region.city)}
                  title={copy.download}
                  onclick={() => downloadConfig(region)}
                >
                  <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                    <polyline points="7 10 12 15 17 10"></polyline>
                    <line x1="12" y1="15" x2="12" y2="3"></line>
                  </svg>
                  <lefine-text>{copy.downloadShort}</lefine-text>
                </button>
              </kefine-proxy-row-actions>
            </kefine-proxy-row>
          {/each}
        </kefine-proxy-list>
      </kefine-proxy-list-card>

      <!-- Right card: theme-adaptive QR for the selected server + its link -->
      <kefine-proxy-qr-card>
        <kefine-proxy-qr-title>
          <kefine-proxy-flag aria-hidden="true">{selectedRegion.flag}</kefine-proxy-flag>
          <strong>{selectedRegion.city}</strong>
          <kefine-proxy-proto-tag>{selectedProtocol.label}</kefine-proxy-proto-tag>
        </kefine-proxy-qr-title>

        <kefine-proxy-qr-frame>
          {#if qr}
            <svg viewBox={qrViewBox} role="img" aria-label={copy.qrTitle} preserveAspectRatio="xMidYMid meet">
              <path d={qrPath} fill="currentColor" shape-rendering="crispEdges"></path>
            </svg>
          {/if}
          <kefine-proxy-qr-glow aria-hidden="true"></kefine-proxy-qr-glow>
        </kefine-proxy-qr-frame>

        <kefine-proxy-qr-hint>{copy.qrHint}</kefine-proxy-qr-hint>

        <kefine-proxy-link-value>{selectedProfile.link}</kefine-proxy-link-value>
      </kefine-proxy-qr-card>
    </kefine-proxy-grid>
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

  /* Two-column layout: server list on the left, QR card on the right. */
  kefine-proxy-grid {
    display: grid;
    grid-template-columns: minmax(0, 1.15fr) minmax(0, 0.85fr);
    gap: var(--kef-space-3, 1.35rem);
    align-items: stretch;
  }

  kefine-proxy-list-card,
  kefine-proxy-qr-card {
    display: flex;
    flex-direction: column;
    gap: 0.85rem;
    padding: clamp(0.85rem, 1.8vw, 1.15rem);
    border: 1px solid var(--kef-line);
    border-radius: var(--kef-radius-lg, 1rem);
    background:
      linear-gradient(135deg, color-mix(in oklab, var(--kef-accent) 6%, transparent), transparent 60%),
      var(--kef-bg-soft);
    min-width: 0;
  }

  kefine-proxy-card-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.6rem;
    flex-wrap: wrap;
  }

  kefine-proxy-control-label {
    display: block;
    font-size: 0.68rem;
    font-weight: 700;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    color: var(--lefine-text-soft);
  }

  kefine-proxy-segments {
    display: inline-flex;
    padding: 0.22rem;
    gap: 0.18rem;
    border: 1px solid var(--kef-line);
    border-radius: 999px;
    background: var(--kef-bg-card);
    flex-wrap: wrap;
  }

  kefine-proxy-segments button {
    padding: 0.32rem 0.7rem;
    border: none;
    border-radius: 999px;
    background: transparent;
    color: var(--lefine-text-soft);
    font-size: 0.74rem;
    font-weight: 600;
    cursor: pointer;
    transition: background 0.18s ease, color 0.18s ease;
  }

  kefine-proxy-segments button[data-active='true'] {
    background: var(--kef-accent);
    color: var(--kef-on-primary, #fff);
  }

  kefine-proxy-list {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  kefine-proxy-row {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.4rem 0.45rem 0.4rem 0.55rem;
    border: 1px solid var(--kef-line);
    border-radius: var(--kef-radius-ui, 0.72rem);
    background: var(--kef-bg-card);
    transition: border-color 0.18s ease, background 0.18s ease, box-shadow 0.18s ease;
  }

  kefine-proxy-row[data-active='true'] {
    border-color: var(--kef-accent);
    background: color-mix(in oklab, var(--kef-accent) 12%, var(--kef-bg-card));
    box-shadow: inset 0 0 0 1px color-mix(in oklab, var(--kef-accent) 35%, transparent);
  }

  kefine-proxy-row > button[data-part='region-option'] {
    display: flex;
    align-items: center;
    gap: 0.6rem;
    flex: 1 1 auto;
    min-width: 0;
    padding: 0.2rem 0.1rem;
    border: none;
    background: transparent;
    color: var(--lefine-text);
    text-align: left;
    cursor: pointer;
  }

  kefine-proxy-flag {
    display: block;
    font-size: 1.1rem;
    line-height: 1;
    flex: 0 0 auto;
  }

  kefine-proxy-row-text {
    display: flex;
    flex-direction: column;
    gap: 0.1rem;
    min-width: 0;
  }

  kefine-proxy-region-name {
    display: block;
    font-size: 0.86rem;
    font-weight: 600;
    color: var(--lefine-text);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  kefine-proxy-ping {
    display: block;
    font-size: 0.68rem;
    color: var(--lefine-text-soft);
  }

  kefine-proxy-row-actions {
    display: inline-flex;
    gap: 0.3rem;
    flex: 0 0 auto;
  }

  kefine-proxy-row-actions button {
    display: inline-flex;
    align-items: center;
    gap: 0.28rem;
    padding: 0.34rem 0.5rem;
    border: 1px solid var(--kef-line);
    border-radius: var(--kef-radius-md, 0.45rem);
    background: var(--kef-bg-soft);
    color: var(--lefine-text);
    font-size: 0.7rem;
    font-weight: 600;
    cursor: pointer;
    transition: border-color 0.18s ease, color 0.18s ease, background 0.18s ease;
  }

  kefine-proxy-row-actions button lefine-text {
    line-height: 1;
  }

  kefine-proxy-row-actions button:hover {
    border-color: color-mix(in oklab, var(--kef-accent) 55%, var(--kef-line));
    color: var(--kef-accent);
  }

  kefine-proxy-row-actions button[data-copied='true'] {
    border-color: var(--kef-accent);
    color: var(--kef-accent);
    background: color-mix(in oklab, var(--kef-accent) 14%, var(--kef-bg-soft));
  }

  kefine-proxy-row-actions button[data-part='download-btn'] {
    background: color-mix(in oklab, var(--kef-accent) 12%, var(--kef-bg-soft));
    border-color: color-mix(in oklab, var(--kef-accent) 34%, var(--kef-line));
    color: var(--kef-accent);
  }

  /* Right QR card */
  kefine-proxy-qr-card {
    align-items: center;
    text-align: center;
    justify-content: flex-start;
  }

  kefine-proxy-qr-title {
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;
  }

  kefine-proxy-qr-title strong {
    font-size: 0.92rem;
    font-weight: 700;
    color: var(--lefine-text);
  }

  kefine-proxy-proto-tag {
    display: inline-block;
    padding: 0.12rem 0.45rem;
    border-radius: 999px;
    background: color-mix(in oklab, var(--kef-accent) 16%, transparent);
    color: var(--kef-accent);
    font-size: 0.64rem;
    font-weight: 700;
    letter-spacing: 0.04em;
    text-transform: uppercase;
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
      var(--kef-bg-card);
    color: var(--lefine-text);
  }

  kefine-proxy-qr-frame svg {
    position: relative;
    z-index: 1;
    width: clamp(8.5rem, 22vw, 11rem);
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

  kefine-proxy-qr-hint {
    display: block;
    font-size: 0.72rem;
    color: var(--lefine-text-soft);
    max-width: 14rem;
  }

  kefine-proxy-link-value {
    display: block;
    width: 100%;
    margin-top: auto;
    padding: 0.55rem 0.65rem;
    border: 1px solid var(--kef-line);
    border-radius: var(--kef-radius-md, 0.45rem);
    background: var(--kef-bg-card);
    color: var(--lefine-text-soft);
    font-family: 'Fira Mono', ui-monospace, monospace;
    font-size: 0.68rem;
    line-height: 1.4;
    text-align: left;
    word-break: break-all;
    max-height: 4.6rem;
    overflow: auto;
  }

  @media (max-width: 640px) {
    kefine-proxy-grid {
      grid-template-columns: 1fr;
    }

    kefine-proxy-row {
      flex-wrap: wrap;
    }

    kefine-proxy-row-actions {
      width: 100%;
      justify-content: flex-end;
    }
  }

  @media (max-width: 420px) {
    kefine-proxy-row-actions button lefine-text {
      display: none;
    }

    kefine-proxy-row-actions button {
      padding: 0.4rem;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    kefine-proxy-pulse {
      animation: none;
    }
  }
</style>
