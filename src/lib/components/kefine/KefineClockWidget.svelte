<script lang="ts">
  import { browser } from '$app/environment';
  import { onDestroy } from 'svelte';
  import { cubicOut } from 'svelte/easing';
  import Icon from '@iconify/svelte';
  import { kefineLocale, kefineLocaleText } from '$lib/constants/kefine-locale';
  import {
    formatClockReadout,
    getClockTarget,
    resolveClockTimeZone,
    type ClockReadout,
    type ClockTarget
  } from '$lib/kefine/clock-widget';

  let { active = false, query = '' }: { active?: boolean; query?: string } = $props();

  const localeText = $derived($kefineLocaleText);
  const copy = $derived(localeText.clockWidget);
  // BCP-47 tag drives 12/24-hour rendering and label language for Intl.
  const localeTag = $derived($kefineLocale === 'ru' ? 'ru-RU' : $kefineLocale === 'hy' ? 'hy-AM' : 'en-GB');

  // A trimmed query may name a place directly (the profile widget passes the raw
  // block argument such as `Tokyo`); fall back to interpreting it as a prompt
  // like `time in Tokyo` so the topbar palette keeps working too.
  const target = $derived<ClockTarget | null>(active ? resolveTarget(query) : null);
  const targetKey = $derived(target ? (target.kind === 'named' ? `named:${target.timeZone}` : 'local') : '');

  function resolveTarget(text: string): ClockTarget {
    const trimmed = text.trim();
    if (!trimmed) {
      return { kind: 'local' };
    }

    const directZone = resolveClockTimeZone(trimmed);
    if (directZone) {
      return { kind: 'named', query: trimmed, timeZone: directZone };
    }

    return getClockTarget(trimmed) ?? { kind: 'local' };
  }

  let now = $state(browser ? new Date() : new Date(0));
  let timer: ReturnType<typeof setInterval> | null = null;

  onDestroy(() => {
    if (timer) {
      clearInterval(timer);
    }
  });

  // Re-tick once per second while the widget is mounted and active.
  $effect(() => {
    if (!active || !target || !browser) {
      if (timer) {
        clearInterval(timer);
        timer = null;
      }
      return;
    }

    now = new Date();
    timer = setInterval(() => {
      now = new Date();
    }, 1000);

    return () => {
      if (timer) {
        clearInterval(timer);
        timer = null;
      }
    };
  });

  const zone = $derived(target?.kind === 'named' ? target.timeZone : null);
  const placeLabel = $derived(target?.kind === 'named' ? target.query : copy.localLabel);
  const readout = $derived<ClockReadout>(formatClockReadout(now, zone, localeTag));

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
</script>

{#if active && target}
  <kefine-clock-widget
    transition:widgetReveal
    aria-label={`${copy.title} ${placeLabel}`}
    data-testid="kefine-clock-widget"
  >
    <kefine-clock-card>
      <kefine-clock-head>
        <kefine-clock-icon aria-hidden="true">
          <Icon icon="mdi:clock-outline" aria-hidden="true" />
        </kefine-clock-icon>
        <kefine-clock-place>
          <strong>{placeLabel}</strong>
          <lefine-text>{readout.zoneLabel || copy.title}</lefine-text>
        </kefine-clock-place>
      </kefine-clock-head>

      <kefine-clock-readout aria-live="polite">
        <kefine-clock-time>
          <strong data-part="clock-time">{readout.time}</strong>
          <kefine-clock-seconds>
            <lefine-text data-part="clock-seconds">{readout.seconds}</lefine-text>
            {#if readout.period}
              <lefine-text data-part="clock-period">{readout.period}</lefine-text>
            {/if}
          </kefine-clock-seconds>
        </kefine-clock-time>
        <kefine-clock-date>
          <strong>{readout.weekday}</strong>
          <lefine-text>{readout.date}</lefine-text>
        </kefine-clock-date>
      </kefine-clock-readout>
    </kefine-clock-card>
  </kefine-clock-widget>
{/if}

<style>
  kefine-clock-widget {
    display: flex;
    flex-direction: column;
    width: min(100%, calc(100vw - 7rem));
    max-width: 64rem;
    justify-self: center;
    margin: 0.55rem auto 0.9rem;
  }

  kefine-clock-card {
    display: flex;
    flex-direction: column;
    gap: clamp(0.8rem, 1.7vw, 1rem);
    min-width: 0;
    padding: clamp(0.9rem, 1.9vw, 1.2rem);
    overflow: hidden;
    border: 1px solid var(--kef-line);
    border-radius: var(--kef-radius-sm);
    background:
      radial-gradient(circle at 14% 8%, color-mix(in oklab, #8f7bff 18%, transparent), transparent 30%),
      linear-gradient(135deg, color-mix(in oklab, #62b8ff 12%, transparent), transparent 60%),
      var(--kef-bg-soft);
  }

  kefine-clock-head {
    display: flex;
    align-items: center;
    gap: 0.72rem;
    min-width: 0;
  }

  kefine-clock-icon {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    flex: 0 0 auto;
    width: clamp(2.5rem, 7vw, 3rem);
    height: clamp(2.5rem, 7vw, 3rem);
    border-radius: 50%;
    background: color-mix(in oklab, #8f7bff 20%, var(--kef-bg-card));
    color: #a99bff;
    font-size: clamp(1.3rem, 4.2vw, 1.7rem);
    box-shadow: inset 0 0 0 1px color-mix(in oklab, var(--kef-line) 75%, transparent);
  }

  kefine-clock-icon :global(svg) {
    width: 58%;
    height: 58%;
  }

  kefine-clock-place {
    display: flex;
    flex-direction: column;
    min-width: 0;
    gap: 0.12rem;
  }

  kefine-clock-place strong {
    color: var(--lefine-text);
    font-size: clamp(0.95rem, 1.9vw, 1.05rem);
    line-height: 1.15;
    overflow-wrap: anywhere;
  }

  kefine-clock-place lefine-text {
    color: var(--lefine-text-soft);
    font-size: 0.76rem;
    line-height: 1.2;
  }

  kefine-clock-readout {
    display: grid;
    grid-template-columns: minmax(0, auto) minmax(0, 1fr);
    align-items: end;
    gap: 0.9rem;
  }

  kefine-clock-time {
    display: flex;
    align-items: baseline;
    gap: 0.4rem;
    min-width: 0;
  }

  kefine-clock-time strong {
    color: var(--lefine-text);
    font-size: clamp(2.6rem, 11vw, 4rem);
    line-height: 0.92;
    letter-spacing: 0.01em;
    font-variant-numeric: tabular-nums;
  }

  kefine-clock-seconds {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 0.1rem;
  }

  kefine-clock-seconds lefine-text {
    color: var(--lefine-text-soft);
    font-size: 0.86rem;
    font-weight: 700;
    line-height: 1;
    font-variant-numeric: tabular-nums;
  }

  kefine-clock-seconds lefine-text[data-part='clock-period'] {
    color: var(--kef-primary);
  }

  kefine-clock-date {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    min-width: 0;
    text-align: right;
    gap: 0.12rem;
  }

  kefine-clock-date strong {
    color: var(--lefine-text);
    font-size: 0.92rem;
    line-height: 1.15;
  }

  kefine-clock-date lefine-text {
    color: var(--lefine-text-soft);
    font-size: 0.78rem;
    line-height: 1.2;
  }

  @media (max-width: 680px) {
    kefine-clock-widget {
      width: 100%;
      max-width: 100%;
    }

    kefine-clock-readout {
      grid-template-columns: 1fr;
      align-items: start;
      gap: 0.5rem;
    }

    kefine-clock-date {
      align-items: flex-start;
      text-align: left;
    }
  }
</style>
