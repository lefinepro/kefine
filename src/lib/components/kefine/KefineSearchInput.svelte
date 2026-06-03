<script lang="ts">
  import { tick } from 'svelte';
  import KefineTopbarIcon from '$lib/components/kefine/KefineTopbarIcon.svelte';
  import type { KefineTopbarIconName } from '$lib/components/kefine/KefineTopbarIcon.svelte';

  let {
    value = '',
    label = 'Search',
    placeholder = 'Search lepos, pages, actions...',
    inputTestId = 'kefine-search-input',
    rowTestId = 'kefine-search-input-row',
    shortcutLabel = '',
    backLabel = 'Back',
    variant = 'panel',
    icon = 'search',
    iconSize = 21,
    showShortcut = true,
    showBack = false,
    focusRequest = 0,
    onInput,
    onKeydown,
    onBack
  }: {
    value?: string;
    label?: string;
    placeholder?: string;
    inputTestId?: string;
    rowTestId?: string;
    shortcutLabel?: string;
    backLabel?: string;
    variant?: 'panel' | 'page';
    icon?: KefineTopbarIconName;
    iconSize?: number;
    showShortcut?: boolean;
    showBack?: boolean;
    focusRequest?: number;
    onInput?: (value: string) => void;
    onKeydown?: (event: KeyboardEvent) => void;
    onBack?: () => void | Promise<void>;
  } = $props();

  let inputElement = $state<HTMLInputElement | null>(null);

  $effect(() => {
    const request = focusRequest;
    if (!request) {
      return;
    }

    void tick().then(() => {
      inputElement?.focus();
      inputElement?.setSelectionRange(value.length, value.length);
    });
  });

  function handleInput(event: Event) {
    onInput?.((event.currentTarget as HTMLInputElement).value);
  }
</script>

<kefine-search-input-row data-variant={variant} data-testid={rowTestId || null}>
  {#if showBack}
    <button
      type="button"
      data-part="search-widget-back"
      data-testid="kefine-topbar-search-widget-back"
      aria-label={backLabel}
      title={backLabel}
      onclick={() => void onBack?.()}
    >
      <KefineTopbarIcon name="open" size={18} />
    </button>
  {:else}
    <kefine-search-input-icon aria-hidden="true">
      <KefineTopbarIcon name={icon} size={iconSize} />
    </kefine-search-input-icon>
  {/if}
  <input
    bind:this={inputElement}
    value={value}
    data-testid={inputTestId}
    aria-label={label}
    placeholder={placeholder}
    autocomplete="off"
    spellcheck="false"
    oninput={handleInput}
    onkeydown={(event) => onKeydown?.(event)}
  />
  {#if showShortcut && shortcutLabel}
    <lefine-kbd>{shortcutLabel}</lefine-kbd>
  {/if}
</kefine-search-input-row>

<style>
  kefine-search-input-row {
    display: grid;
    grid-template-columns: auto minmax(0, 1fr) auto;
    align-items: center;
    gap: 0.75rem;
    width: 100%;
    box-sizing: border-box;
    color: color-mix(in oklab, var(--lefine-text) 84%, transparent);
  }

  kefine-search-input-row[data-variant='panel'] {
    min-height: 4.45rem;
    padding: 0.78rem 1rem;
    border-bottom: var(--kef-border-width-soft) solid color-mix(in oklab, var(--kef-border) 46%, transparent);
  }

  kefine-search-input-row[data-variant='page'] {
    min-height: 4.5rem;
    padding: 0.82rem 1rem;
    border: var(--kef-border-width-soft) solid color-mix(in oklab, var(--kef-border) 68%, transparent);
    border-radius: 0.38rem;
    background: color-mix(in oklab, var(--kef-bg-card) 94%, var(--kef-bg));
    box-shadow: 0 10px 22px color-mix(in oklab, #544536 6%, transparent);
  }

  kefine-search-input-icon {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    color: color-mix(in oklab, currentColor 82%, transparent);
  }

  input {
    appearance: none;
    min-width: 0;
    width: 100%;
    border: 0;
    border-radius: 0;
    outline: 0;
    background: transparent;
    box-shadow: none;
    color: var(--lefine-text);
    font: inherit;
    font-size: 1.15rem;
    font-weight: 640;
    line-height: 1.2;
    letter-spacing: 0;
    padding: 0;
  }

  input:focus {
    box-shadow: none;
  }

  input::placeholder {
    color: color-mix(in oklab, var(--lefine-text-soft) 62%, transparent);
  }

  lefine-kbd {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 2.28rem;
    min-height: 1.46rem;
    padding: 0 0.42rem;
    border: var(--kef-border-width-soft) solid color-mix(in oklab, currentColor 18%, transparent);
    border-radius: var(--kef-radius-sm);
    background: color-mix(in oklab, var(--kef-bg-soft) 72%, transparent);
    color: color-mix(in oklab, currentColor 72%, transparent);
    font-size: 0.72rem;
    font-weight: 680;
    line-height: 1;
    letter-spacing: 0;
    white-space: nowrap;
  }

  button[data-part='search-widget-back'] {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 2.2rem;
    height: 2.2rem;
    padding: 0;
    border: var(--kef-border-width-soft) solid color-mix(in oklab, var(--kef-border) 52%, transparent);
    border-radius: var(--kef-radius-md);
    background: color-mix(in oklab, var(--kef-bg-soft) 72%, transparent);
    color: color-mix(in oklab, var(--lefine-text) 82%, transparent);
    cursor: pointer;
    transition:
      background-color var(--kef-motion-fast) var(--kef-ease-soft),
      border-color var(--kef-motion-fast) var(--kef-ease-soft),
      color var(--kef-motion-fast) var(--kef-ease-soft);
  }

  button[data-part='search-widget-back']:hover {
    border-color: color-mix(in oklab, var(--kef-primary) 30%, var(--kef-line));
    color: color-mix(in oklab, var(--kef-primary) 92%, #4f3d30);
  }

  @media (max-width: 760px) {
    kefine-search-input-row {
      gap: 0.58rem;
    }

    kefine-search-input-row[data-variant='panel'] {
      min-height: 4rem;
      padding: 0.68rem 0.78rem;
    }

    kefine-search-input-row[data-variant='page'] {
      min-height: 4rem;
      padding: 0.68rem 0.78rem;
    }

    input {
      font-size: 1rem;
    }
  }
</style>
