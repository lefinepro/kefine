<script lang="ts">
  let {
    ariaLabel = 'Forwarding document to server'
  }: {
    ariaLabel?: string;
  } = $props();
</script>

<article class="kefine-card kefine-card--wide kefine-submitting-card" aria-busy="true" aria-label={ariaLabel}>
  <submission-scene aria-hidden="true">
    <submission-lane>
      <submission-lane-glow></submission-lane-glow>
    </submission-lane>

    <submission-doc>
      <submission-doc-aura></submission-doc-aura>
      <submission-doc-fold></submission-doc-fold>
      <submission-doc-line></submission-doc-line>
      <submission-doc-line></submission-doc-line>
      <submission-doc-line></submission-doc-line>
    </submission-doc>

    <submission-doc data-variant="2">
      <submission-doc-aura></submission-doc-aura>
      <submission-doc-fold></submission-doc-fold>
      <submission-doc-line></submission-doc-line>
      <submission-doc-line></submission-doc-line>
      <submission-doc-line></submission-doc-line>
    </submission-doc>

    <submission-doc data-variant="3">
      <submission-doc-aura></submission-doc-aura>
      <submission-doc-fold></submission-doc-fold>
      <submission-doc-line></submission-doc-line>
      <submission-doc-line></submission-doc-line>
      <submission-doc-line></submission-doc-line>
    </submission-doc>
  </submission-scene>

  <submission-sr>{ariaLabel}</submission-sr>
</article>

<style>
  .kefine-submitting-card {
    display: grid;
    place-items: center;
    width: 100%;
    min-height: min(24rem, 52vh);
    padding: clamp(1.5rem, 3vw, 2.3rem);
    background: transparent;
    border: 0;
    box-shadow: none;
    overflow: hidden;
  }

  submission-scene,
  submission-lane,
  submission-lane-glow,
  submission-doc,
  submission-doc-aura,
  submission-doc-fold,
  submission-doc-line,
  submission-sr {
    display: block;
  }

  submission-sr {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border: 0;
  }

  submission-scene {
    --submission-edge: color-mix(in oklab, #35281a 58%, transparent);
    --submission-paper: color-mix(in oklab, #ead9b0 80%, var(--kef-bg-card));
    --submission-paper-fold: color-mix(in oklab, #cfbb90 84%, var(--kef-bg-soft));
    --submission-paper-line: color-mix(in oklab, #2c2014 44%, transparent);
    --submission-lane: color-mix(in oklab, #24180d 36%, transparent);
    --submission-lane-glow: transparent;
    --submission-doc-travel-mid: clamp(13rem, 31vw, 19rem);
    --submission-doc-travel-late: clamp(21rem, 52vw, 31rem);
    --submission-doc-travel-end: clamp(27rem, 66vw, 38rem);
    position: relative;
    width: min(42rem, 100%);
    min-height: 10rem;
    padding: 0.8rem 0.4rem;
    border-radius: 1.5rem;
    border: 0;
    background: transparent;
    box-shadow: none;
    overflow: hidden;
  }

  submission-lane {
    position: absolute;
    left: 1.4rem;
    right: 1.4rem;
    top: 50%;
    height: 0.4rem;
    transform: translateY(-50%);
    border-radius: 999px;
    background:
      linear-gradient(180deg, color-mix(in oklab, #20160d 4%, transparent), color-mix(in oklab, #20160d 14%, transparent), color-mix(in oklab, #20160d 5%, transparent)),
      linear-gradient(90deg, transparent, var(--submission-lane) 12%, var(--submission-lane) 88%, transparent);
  }

  submission-lane-glow {
    position: absolute;
    inset: -0.4rem 0;
    border-radius: inherit;
    background: linear-gradient(90deg, transparent, color-mix(in oklab, #3a2b1a 5%, transparent), transparent);
    filter: blur(14px);
    opacity: 0.35;
  }

  submission-doc {
    position: absolute;
    left: 0;
    top: 50%;
    width: clamp(4.2rem, 9vw, 5rem);
    height: clamp(5.4rem, 11vw, 6.2rem);
    padding: 1.05rem 0.72rem;
    transform: translateY(-50%);
    border: 1px solid var(--submission-edge);
    border-radius: 0.9rem 1.15rem 0.9rem 0.9rem;
    background:
      repeating-linear-gradient(
        -7deg,
        color-mix(in oklab, #5b452b 4%, transparent) 0 1px,
        transparent 1px 7px
      ),
      linear-gradient(180deg, color-mix(in oklab, var(--submission-paper) 96%, white 2%), color-mix(in oklab, #dec696 90%, var(--submission-paper)));
    box-shadow:
      inset 0 1px 0 color-mix(in oklab, #f6e5bd 10%, transparent),
      0 8px 16px color-mix(in oklab, #392919 12%, transparent);
    animation: submission-doc-run 3.4s cubic-bezier(0.2, 0.72, 0.16, 1) infinite;
    z-index: 2;
  }

  submission-doc[data-variant='2'] {
    animation-delay: 1.1s;
  }

  submission-doc[data-variant='3'] {
    animation-delay: 2.2s;
  }

  submission-doc-aura {
    position: absolute;
    inset: -0.4rem;
    border-radius: 1.2rem;
    background: radial-gradient(circle, color-mix(in oklab, #2f2419 8%, transparent), transparent 72%);
    filter: blur(12px);
    opacity: 0.14;
  }

  submission-doc-fold {
    position: absolute;
    top: -1px;
    right: -1px;
    width: 1rem;
    height: 1rem;
    border-top: 1px solid var(--submission-edge);
    border-right: 1px solid var(--submission-edge);
    background: var(--submission-paper-fold);
    clip-path: polygon(100% 0, 0 0, 100% 100%);
  }

  submission-doc-line {
    height: 0.34rem;
    border-radius: 999px;
    background: var(--submission-paper-line);
  }

  submission-doc-line + submission-doc-line {
    margin-top: 0.44rem;
  }

  submission-doc-line:nth-child(2) {
    width: 76%;
  }

  submission-doc-line:nth-child(3) {
    width: 100%;
  }

  submission-doc-line:nth-child(4) {
    width: 64%;
  }

  @keyframes submission-doc-run {
    0% {
      transform: translateY(-50%) translateX(-5rem) rotate(-7deg) scale(0.9);
      opacity: 0;
    }

    12% {
      opacity: 0.95;
    }

    42% {
      transform: translateY(-50%) translateX(var(--submission-doc-travel-mid)) rotate(0deg) scale(1);
      opacity: 1;
    }

    74% {
      transform: translateY(-50%) translateX(var(--submission-doc-travel-late)) rotate(1deg) scale(0.97);
      opacity: 0.94;
    }

    92% {
      transform: translateY(-50%) translateX(var(--submission-doc-travel-end)) rotate(0deg) scale(0.86);
      opacity: 0.38;
    }

    100% {
      transform: translateY(-50%) translateX(calc(var(--submission-doc-travel-end) + 2.8rem)) rotate(0deg) scale(0.74);
      opacity: 0;
    }
  }

  @media (max-width: 720px) {
    .kefine-submitting-card {
      min-height: 18rem;
    }

    submission-scene {
      --submission-doc-travel-mid: 8.4rem;
      --submission-doc-travel-late: 13rem;
      --submission-doc-travel-end: 16rem;
      min-height: 9rem;
      width: min(100%, 22rem);
    }

    submission-lane {
      left: 0.6rem;
      right: 0.6rem;
    }
  }
</style>
