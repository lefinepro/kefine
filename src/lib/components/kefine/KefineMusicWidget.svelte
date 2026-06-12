<script lang="ts">
  import { browser } from '$app/environment';
  import { cubicOut } from 'svelte/easing';
  import { kefineLocaleText } from '$lib/constants/kefine-locale';
  import {
    EXTRACTED_TRACK,
    buildCover,
    buildWaveform,
    formatTime,
    randomCoverSeed
  } from '$lib/kefine/widgets/music-track';

  let { active = false }: { active?: boolean } = $props();

  const localeText = $derived($kefineLocaleText);
  const copy = $derived(localeText.musicWidget);

  // Deterministic seed for SSR + first client render; reshuffled on demand so the
  // generated cover background looks random while staying hydration-safe.
  let coverSeed = $state(EXTRACTED_TRACK.id);
  const cover = $derived(buildCover(coverSeed));
  const waveform = $derived(buildWaveform(EXTRACTED_TRACK.id, 44));

  let audioEl = $state<HTMLAudioElement | null>(null);
  let isPlaying = $state(false);
  let currentTime = $state(0);
  let duration = $state(0);

  const progress = $derived(duration > 0 ? currentTime / duration : 0);
  const elapsedLabel = $derived(formatTime(currentTime));
  const durationLabel = $derived(duration > 0 ? formatTime(duration) : EXTRACTED_TRACK.durationLabel);

  /** Smooth curtain-drop entrance, matching the proxy widget / task-row language. */
  function widgetReveal(_node: HTMLElement, { duration: dur = 460 }: { duration?: number } = {}) {
    return {
      duration: dur,
      easing: cubicOut,
      css: (t: number) => {
        const eased = cubicOut(t);
        const y = -18 * (1 - eased);
        const scale = 0.965 + 0.035 * eased;
        return `opacity:${Math.min(1, t * 1.2)}; transform:translateY(${y}px) scale(${scale.toFixed(4)}); transform-origin: top center;`;
      }
    };
  }

  function togglePlay() {
    if (!audioEl) {
      return;
    }
    if (audioEl.paused) {
      void audioEl.play().catch(() => {
        // Autoplay / gesture restrictions can reject play(); fail quietly.
      });
    } else {
      audioEl.pause();
    }
  }

  function shuffleCover() {
    coverSeed = browser ? randomCoverSeed() : coverSeed;
  }

  function seekToBar(index: number) {
    if (!audioEl || !duration) {
      return;
    }
    const fraction = (index + 0.5) / waveform.length;
    audioEl.currentTime = Math.min(duration, Math.max(0, fraction * duration));
  }

  function handleLoadedMetadata() {
    duration = audioEl?.duration ?? 0;
  }

  function handleTimeUpdate() {
    currentTime = audioEl?.currentTime ?? 0;
  }
</script>

{#if active}
  <kefine-music-widget transition:widgetReveal aria-label={copy.title} data-testid="kefine-music-widget">
    <kefine-music-player>
      <button
        type="button"
        data-part="play-btn"
        aria-label={isPlaying ? copy.pauseAria : copy.playAria}
        aria-pressed={isPlaying}
        onclick={togglePlay}
        style={`--music-accent:${cover.accent};`}
      >
        {#if isPlaying}
          <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" aria-hidden="true">
            <rect x="6" y="5" width="4" height="14" rx="1"></rect>
            <rect x="14" y="5" width="4" height="14" rx="1"></rect>
          </svg>
        {:else}
          <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" aria-hidden="true">
            <path d="M8 5.14v13.72a1 1 0 0 0 1.54.84l10.79-6.86a1 1 0 0 0 0-1.68L9.54 4.3A1 1 0 0 0 8 5.14z"></path>
          </svg>
        {/if}
      </button>

      <kefine-music-body>
        <kefine-music-head>
          <kefine-music-titles>
            <kefine-music-title>{copy.trackTitle}</kefine-music-title>
            <kefine-music-artist>{copy.trackArtist}</kefine-music-artist>
          </kefine-music-titles>
          <kefine-music-time data-part="time-tag">{elapsedLabel} / {durationLabel}</kefine-music-time>
        </kefine-music-head>

        <kefine-music-wave role="slider"
          aria-label={copy.seekAria}
          aria-valuemin="0"
          aria-valuemax="100"
          aria-valuenow={Math.round(progress * 100)}
          tabindex="0"
        >
          {#each waveform as height, index (index)}
            <button
              type="button"
              data-part="wave-bar"
              data-played={index / waveform.length <= progress}
              style={`height:${Math.round(height * 100)}%;`}
              aria-label={copy.seekAria}
              onclick={() => seekToBar(index)}
            ></button>
          {/each}
        </kefine-music-wave>
      </kefine-music-body>

      <kefine-music-cover style={`background:${cover.background};`}>
        <button
          type="button"
          data-part="shuffle-btn"
          aria-label={copy.shuffleAria}
          title={copy.shuffle}
          onclick={shuffleCover}
        >
          <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <polyline points="16 3 21 3 21 8"></polyline>
            <line x1="4" y1="20" x2="21" y2="3"></line>
            <polyline points="21 16 21 21 16 21"></polyline>
            <line x1="15" y1="15" x2="21" y2="21"></line>
            <line x1="4" y1="4" x2="9" y2="9"></line>
          </svg>
        </button>
        <kefine-music-cover-note aria-hidden="true">♪</kefine-music-cover-note>
      </kefine-music-cover>

      <!-- svelte-ignore a11y_media_has_caption -->
      <audio
        bind:this={audioEl}
        src={EXTRACTED_TRACK.source}
        preload="metadata"
        onloadedmetadata={handleLoadedMetadata}
        ontimeupdate={handleTimeUpdate}
        onplay={() => (isPlaying = true)}
        onpause={() => (isPlaying = false)}
        onended={() => (isPlaying = false)}
      ></audio>
    </kefine-music-player>

    <kefine-music-foot>
      <lefine-text data-part="music-caption">{copy.caption}</lefine-text>
      <a
        data-part="download-link"
        href={EXTRACTED_TRACK.source}
        download
        aria-label={copy.downloadAria}
      >
        <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
          <polyline points="7 10 12 15 17 10"></polyline>
          <line x1="12" y1="15" x2="12" y2="3"></line>
        </svg>
        <lefine-text>{copy.download}</lefine-text>
      </a>
    </kefine-music-foot>
  </kefine-music-widget>
{/if}

<style>
  /* Lightweight inline block sitting directly under the task input. */
  kefine-music-widget {
    display: flex;
    flex-direction: column;
    gap: 0.55rem;
    margin: 0.55rem 0 0.9rem;
  }

  kefine-music-player {
    display: flex;
    align-items: stretch;
    gap: clamp(0.6rem, 1.6vw, 1rem);
    padding: clamp(0.7rem, 1.6vw, 0.95rem);
    border: 1px solid var(--kef-line);
    border-radius: var(--kef-radius-sm);
    background:
      linear-gradient(135deg, color-mix(in oklab, var(--kef-primary) 6%, transparent), transparent 60%),
      var(--kef-bg-soft);
    min-width: 0;
  }

  /* Circular play / pause control with a generated-accent glow. */
  button[data-part='play-btn'] {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    flex: 0 0 auto;
    align-self: center;
    width: clamp(2.6rem, 6vw, 3.1rem);
    height: clamp(2.6rem, 6vw, 3.1rem);
    border: none;
    border-radius: 50%;
    background: var(--kef-primary);
    color: var(--kef-on-primary, #fff);
    cursor: pointer;
    box-shadow: 0 0 0 0 color-mix(in oklab, var(--music-accent, var(--kef-primary)) 40%, transparent);
    transition: transform 0.18s ease, box-shadow 0.22s ease, background 0.18s ease;
  }

  button[data-part='play-btn']:hover {
    transform: scale(1.05);
    box-shadow: 0 0 0 6px color-mix(in oklab, var(--music-accent, var(--kef-primary)) 22%, transparent);
  }

  button[data-part='play-btn'][aria-pressed='true'] {
    background: var(--kef-primary-700, var(--kef-primary));
  }

  kefine-music-body {
    display: flex;
    flex-direction: column;
    justify-content: center;
    gap: 0.5rem;
    flex: 1 1 auto;
    min-width: 0;
  }

  kefine-music-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.6rem;
  }

  kefine-music-titles {
    display: flex;
    flex-direction: column;
    gap: 0.08rem;
    min-width: 0;
  }

  kefine-music-title {
    display: block;
    font-size: 0.86rem;
    font-weight: 700;
    color: var(--lefine-text);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  kefine-music-artist {
    display: block;
    font-size: 0.68rem;
    color: var(--lefine-text-soft);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  kefine-music-time {
    display: inline-flex;
    align-items: center;
    flex: 0 0 auto;
    padding: 0.16rem 0.5rem;
    border-radius: 999px;
    background: color-mix(in oklab, var(--kef-accent) 16%, transparent);
    color: var(--kef-accent);
    font-size: 0.66rem;
    font-weight: 700;
    font-variant-numeric: tabular-nums;
    letter-spacing: 0.02em;
  }

  /* Telegram-style vertical bar waveform that doubles as a seek control. */
  kefine-music-wave {
    display: flex;
    align-items: center;
    gap: 2px;
    height: 2.4rem;
    min-width: 0;
    outline-offset: 3px;
  }

  button[data-part='wave-bar'] {
    flex: 1 1 0;
    min-width: 0;
    padding: 0;
    border: none;
    border-radius: 999px;
    background: color-mix(in oklab, var(--kef-primary) 28%, transparent);
    cursor: pointer;
    transition: background 0.16s ease, transform 0.16s ease;
  }

  button[data-part='wave-bar']:hover {
    transform: scaleY(1.08);
  }

  button[data-part='wave-bar'][data-played='true'] {
    background: var(--kef-accent);
  }

  /* Right-hand cover with a randomly generated background. */
  kefine-music-cover {
    position: relative;
    flex: 0 0 auto;
    width: clamp(3.4rem, 9vw, 4.6rem);
    align-self: stretch;
    border-radius: var(--kef-radius-sm);
    border: 1px solid color-mix(in oklab, #000 18%, transparent);
    overflow: hidden;
    box-shadow: inset 0 0 0 1px color-mix(in oklab, #fff 12%, transparent);
  }

  kefine-music-cover-note {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.5rem;
    color: color-mix(in oklab, #fff 80%, transparent);
    text-shadow: 0 1px 3px rgba(0, 0, 0, 0.4);
    pointer-events: none;
  }

  button[data-part='shuffle-btn'] {
    position: absolute;
    top: 0.3rem;
    right: 0.3rem;
    z-index: 1;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 1.55rem;
    height: 1.55rem;
    padding: 0;
    border: none;
    border-radius: 50%;
    background: color-mix(in oklab, #000 42%, transparent);
    color: #fff;
    cursor: pointer;
    opacity: 0.85;
    transition: opacity 0.16s ease, transform 0.16s ease, background 0.16s ease;
  }

  button[data-part='shuffle-btn']:hover {
    opacity: 1;
    transform: rotate(-15deg);
    background: color-mix(in oklab, #000 60%, transparent);
  }

  kefine-music-foot {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.6rem;
    flex-wrap: wrap;
    padding: 0 0.15rem;
  }

  lefine-text[data-part='music-caption'] {
    display: block;
    font-size: 0.7rem;
    color: var(--lefine-text-soft);
  }

  a[data-part='download-link'] {
    display: inline-flex;
    align-items: center;
    gap: 0.3rem;
    color: var(--kef-accent);
    font-size: 0.7rem;
    font-weight: 600;
    text-decoration: none;
    padding: 0.2rem 0.45rem;
    border-radius: var(--kef-radius-sm);
    transition: background 0.16s ease, color 0.16s ease;
  }

  a[data-part='download-link'] lefine-text {
    line-height: 1;
  }

  a[data-part='download-link']:hover {
    color: color-mix(in oklab, var(--kef-accent) 80%, #2c3a2e);
    background: color-mix(in oklab, var(--kef-accent) 12%, transparent);
  }

  @media (max-width: 520px) {
    kefine-music-time {
      display: none;
    }

    kefine-music-cover {
      width: 3rem;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    button[data-part='play-btn'],
    button[data-part='wave-bar'],
    button[data-part='shuffle-btn'] {
      transition: none;
    }
  }
</style>
