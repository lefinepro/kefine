<script lang="ts">
  let {
    ariaLabel = 'Loading',
    compact = false
  }: {
    ariaLabel?: string;
    compact?: boolean;
  } = $props();
</script>

<loading-placeholder data-compact={compact} aria-hidden="true">
  <loading-placeholder-doc>
    <loading-placeholder-fold></loading-placeholder-fold>
    <loading-placeholder-line></loading-placeholder-line>
    <loading-placeholder-line></loading-placeholder-line>
    <loading-placeholder-line></loading-placeholder-line>
  </loading-placeholder-doc>

  <loading-placeholder-copy>
    <loading-placeholder-bar data-size="lg"></loading-placeholder-bar>
    <loading-placeholder-bar data-size="md"></loading-placeholder-bar>
    <loading-placeholder-bar data-size="sm"></loading-placeholder-bar>
  </loading-placeholder-copy>
</loading-placeholder>

<loading-placeholder-sr>{ariaLabel}</loading-placeholder-sr>

<style>
  loading-placeholder,
  loading-placeholder-doc,
  loading-placeholder-fold,
  loading-placeholder-line,
  loading-placeholder-copy,
  loading-placeholder-bar,
  loading-placeholder-sr {
    display: block;
  }

  loading-placeholder {
    --loading-edge: color-mix(in oklab, #3a2d1d 42%, transparent);
    --loading-paper: color-mix(in oklab, #efe2bf 82%, var(--kef-bg-card));
    --loading-paper-fold: color-mix(in oklab, #dcc693 70%, var(--kef-bg-soft));
    --loading-line: color-mix(in oklab, #5d4a31 22%, transparent);
    display: grid;
    grid-template-columns: auto minmax(12rem, 1fr);
    align-items: center;
    justify-content: center;
    gap: 1.15rem;
    width: min(28rem, calc(100vw - 3rem));
    max-width: 100%;
    padding: 1.15rem 1.25rem;
    border-radius: 1.25rem;
    background: color-mix(in oklab, var(--kef-bg-card) 88%, #f8eed3 12%);
    box-shadow: 0 18px 38px color-mix(in oklab, #4d3c28 10%, transparent);
    animation: loading-placeholder-float 3.6s ease-in-out infinite;
  }

  loading-placeholder[data-compact='true'] {
    gap: 0.7rem;
    width: min(11rem, 100%);
    padding: 0;
    border-radius: 0;
    background: transparent;
    box-shadow: none;
    grid-template-columns: auto minmax(0, 1fr);
    animation-duration: 2.8s;
  }

  loading-placeholder-sr {
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

  loading-placeholder-doc {
    position: relative;
    width: 3.9rem;
    height: 5rem;
    padding: 0.92rem 0.62rem;
    border: 1px solid var(--loading-edge);
    border-radius: 0.85rem 1rem 0.85rem 0.85rem;
    background:
      linear-gradient(180deg, color-mix(in oklab, var(--loading-paper) 96%, white 4%), color-mix(in oklab, #e4d1a4 88%, var(--loading-paper)));
    box-shadow:
      inset 0 1px 0 color-mix(in oklab, white 16%, transparent),
      0 10px 20px color-mix(in oklab, #4d3c28 10%, transparent);
    animation: loading-doc-tilt 3.6s ease-in-out infinite;
  }

  loading-placeholder[data-compact='true'] loading-placeholder-doc {
    width: 2.4rem;
    height: 3rem;
    padding: 0.56rem 0.36rem;
    border-radius: 0.55rem 0.7rem 0.55rem 0.55rem;
    box-shadow:
      inset 0 1px 0 color-mix(in oklab, white 14%, transparent),
      0 6px 12px color-mix(in oklab, #4d3c28 8%, transparent);
  }

  loading-placeholder-fold {
    position: absolute;
    top: -1px;
    right: -1px;
    width: 0.88rem;
    height: 0.88rem;
    border-top: 1px solid var(--loading-edge);
    border-right: 1px solid var(--loading-edge);
    background: var(--loading-paper-fold);
    clip-path: polygon(100% 0, 0 0, 100% 100%);
  }

  loading-placeholder[data-compact='true'] loading-placeholder-fold {
    width: 0.5rem;
    height: 0.5rem;
  }

  loading-placeholder-line {
    height: 0.28rem;
    border-radius: 999px;
    background:
      linear-gradient(
        90deg,
        color-mix(in oklab, #5d4a31 14%, transparent) 0%,
        color-mix(in oklab, #f7edd2 44%, transparent) 48%,
        color-mix(in oklab, #5d4a31 14%, transparent) 100%
      );
    background-size: 220% 100%;
    animation: loading-shimmer 2.1s linear infinite;
  }

  loading-placeholder[data-compact='true'] loading-placeholder-line {
    height: 0.16rem;
  }

  loading-placeholder-line + loading-placeholder-line {
    margin-top: 0.38rem;
  }

  loading-placeholder[data-compact='true'] loading-placeholder-line + loading-placeholder-line {
    margin-top: 0.2rem;
  }

  loading-placeholder-line:nth-child(2) {
    width: 78%;
  }

  loading-placeholder-line:nth-child(3) {
    width: 100%;
  }

  loading-placeholder-line:nth-child(4) {
    width: 66%;
  }

  loading-placeholder-copy {
    display: grid;
    gap: 0.7rem;
    min-width: 0;
  }

  loading-placeholder[data-compact='true'] loading-placeholder-copy {
    gap: 0.38rem;
  }

  loading-placeholder-bar {
    height: 0.62rem;
    border-radius: 999px;
    background:
      linear-gradient(
        90deg,
        color-mix(in oklab, #5d4a31 14%, transparent) 0%,
        color-mix(in oklab, #f7edd2 40%, transparent) 48%,
        color-mix(in oklab, #5d4a31 14%, transparent) 100%
      );
    background-size: 220% 100%;
    animation: loading-shimmer 2.1s linear infinite;
  }

  loading-placeholder[data-compact='true'] loading-placeholder-bar {
    height: 0.34rem;
  }

  loading-placeholder-bar[data-size='lg'] {
    width: 100%;
  }

  loading-placeholder-bar[data-size='md'] {
    width: 72%;
  }

  loading-placeholder-bar[data-size='sm'] {
    width: 48%;
  }

  loading-placeholder-line:nth-child(3),
  loading-placeholder-bar[data-size='md'] {
    animation-delay: 0.18s;
  }

  loading-placeholder-line:nth-child(4),
  loading-placeholder-bar[data-size='sm'] {
    animation-delay: 0.34s;
  }

  @keyframes loading-shimmer {
    0% {
      background-position: 100% 50%;
    }
    100% {
      background-position: -100% 50%;
    }
  }

  @keyframes loading-placeholder-float {
    0%,
    100% {
      transform: translateY(0);
    }
    50% {
      transform: translateY(-0.3rem);
    }
  }

  @keyframes loading-doc-tilt {
    0%,
    100% {
      transform: translateY(0) rotate(0deg);
    }
    50% {
      transform: translateY(-0.14rem) rotate(-1.4deg);
    }
  }

  @media (max-width: 640px) {
    loading-placeholder:not([data-compact='true']) {
      grid-template-columns: 1fr;
      justify-items: center;
      text-align: center;
    }

    loading-placeholder:not([data-compact='true']) loading-placeholder-copy {
      width: min(14rem, 100%);
      justify-items: center;
    }

    loading-placeholder:not([data-compact='true']) loading-placeholder-bar[data-size='lg'] {
      width: 100%;
    }
  }
</style>
