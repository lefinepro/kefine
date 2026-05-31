<script lang="ts">
  import Icon from '@iconify/svelte';
  import { cubicOut } from 'svelte/easing';
  import { kefineLocaleText } from '$lib/constants/kefine-locale';
  import {
    DEFAULT_TRANSLATION_LANGUAGES,
    extractTranslationLanguages,
    type TranslationLanguageId
  } from '$lib/kefine/translation-intent';

  let { active = false, query = '' }: { active?: boolean; query?: string } = $props();

  const localeText = $derived($kefineLocaleText);
  const copy = $derived(localeText.translatorWidget);
  const requestedLanguages = $derived(extractTranslationLanguages(query));

  let selectedSource = $state<TranslationLanguageId>(DEFAULT_TRANSLATION_LANGUAGES.source);
  let selectedTarget = $state<TranslationLanguageId>(DEFAULT_TRANSLATION_LANGUAGES.target);
  let lastRequestKey = $state('');
  let sourceText = $state('');

  const translationPreview = $derived(buildTranslationPreview(sourceText, selectedSource, selectedTarget));

  $effect(() => {
    const requestKey = `${query.trim()}::${requestedLanguages.source}->${requestedLanguages.target}`;
    if (requestKey === lastRequestKey) return;
    selectedSource = requestedLanguages.source;
    selectedTarget = requestedLanguages.target;
    lastRequestKey = requestKey;
  });

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

  function languageName(id: TranslationLanguageId): string {
    return copy.languages[id] ?? id;
  }

  function clearSource() {
    sourceText = '';
  }

  function swapLanguages() {
    const nextSource = selectedTarget;
    selectedTarget = selectedSource === 'auto' ? DEFAULT_TRANSLATION_LANGUAGES.source : selectedSource;
    selectedSource = nextSource;
    if (translationPreview) {
      sourceText = translationPreview;
    }
  }

  function normalizeText(value: string): string {
    return value.toLocaleLowerCase().trim().replace(/[.!?]+$/g, '');
  }

  function buildTranslationPreview(
    value: string,
    source: TranslationLanguageId,
    target: TranslationLanguageId
  ): string {
    const normalized = normalizeText(value);
    if (!normalized) return '';

    const examples: Record<string, string> = {
      'english:russian:hello': 'здравствуйте',
      'english:russian:hello world': 'здравствуй, мир',
      'russian:english:привет': 'hello',
      'russian:english:здравствуйте': 'hello',
      'chinese:english:你好': 'hello',
      'english:chinese:hello': '你好',
      'english:spanish:hello': 'hola',
      'spanish:english:hola': 'hello',
      'english:armenian:hello': 'բարեւ',
      'armenian:english:բարեւ': 'hello'
    };

    return examples[`${source}:${target}:${normalized}`] ?? '';
  }
</script>

{#if active}
  <kefine-translator-widget
    transition:widgetReveal
    aria-label={copy.title}
    data-testid="kefine-translator-widget"
  >
    <kefine-translator-card>
      <kefine-translate-grid>
        <kefine-translate-pane data-part="translator-source-pane">
          <kefine-translate-pane-head>
            <strong data-part="translator-source-language">{languageName(selectedSource)}</strong>
            <button
              type="button"
              data-part="translator-clear"
              aria-label={copy.clearSourceAria}
              title={copy.clearSourceAria}
              onclick={clearSource}
            >
              <Icon icon="lucide:x" aria-hidden="true" />
            </button>
          </kefine-translate-pane-head>

          <textarea
            bind:value={sourceText}
            data-part="translator-source-input"
            aria-label={copy.sourceAria}
            placeholder={copy.sourcePlaceholder}
            rows="3"
          ></textarea>

          <kefine-translate-actions>
            <button type="button" aria-label={copy.listenSourceAria} title={copy.listenSourceAria}>
              <Icon icon="lucide:volume-2" aria-hidden="true" />
            </button>
            <button type="button" aria-label={copy.voiceInputAria} title={copy.voiceInputAria}>
              <Icon icon="lucide:mic" aria-hidden="true" />
            </button>
            <button type="button" aria-label={copy.copySourceAria} title={copy.copySourceAria}>
              <Icon icon="lucide:copy" aria-hidden="true" />
            </button>
            <button type="button" data-part="translator-fast">
              {copy.quickTranslate}
            </button>
          </kefine-translate-actions>
        </kefine-translate-pane>

        <button
          type="button"
          data-part="translator-swap"
          aria-label={copy.swapAria}
          title={copy.swapAria}
          onclick={swapLanguages}
        >
          <Icon icon="lucide:repeat-2" aria-hidden="true" />
        </button>

        <kefine-translate-pane data-part="translator-target-pane">
          <kefine-translate-pane-head>
            <strong data-part="translator-target-language">{languageName(selectedTarget)}</strong>
            <button type="button" aria-label={copy.copyTargetAria} title={copy.copyTargetAria}>
              <Icon icon="lucide:copy" aria-hidden="true" />
            </button>
          </kefine-translate-pane-head>

          <textarea
            value={translationPreview}
            data-part="translator-target-output"
            aria-label={copy.targetAria}
            placeholder={copy.targetPlaceholder}
            readonly
            rows="3"
          ></textarea>

          <kefine-translate-actions data-align="end">
            <button type="button" aria-label={copy.listenTargetAria} title={copy.listenTargetAria}>
              <Icon icon="lucide:volume-2" aria-hidden="true" />
            </button>
            <kefine-translate-spacer aria-hidden="true"></kefine-translate-spacer>
            <button type="button" aria-label={copy.saveAria} title={copy.saveAria}>
              <Icon icon="lucide:bookmark" aria-hidden="true" />
            </button>
            <button type="button" aria-label={copy.shareAria} title={copy.shareAria}>
              <Icon icon="lucide:share-2" aria-hidden="true" />
            </button>
            <button type="button" aria-label={copy.likeAria} title={copy.likeAria}>
              <Icon icon="lucide:thumbs-up" aria-hidden="true" />
            </button>
            <button type="button" aria-label={copy.dislikeAria} title={copy.dislikeAria}>
              <Icon icon="lucide:thumbs-down" aria-hidden="true" />
            </button>
          </kefine-translate-actions>
        </kefine-translate-pane>
      </kefine-translate-grid>
    </kefine-translator-card>
  </kefine-translator-widget>
{/if}

<style>
  kefine-translator-widget {
    --translator-text: color-mix(in oklab, var(--lefine-text) 94%, #ffffff 6%);
    --translator-muted: color-mix(in oklab, var(--lefine-text-soft) 88%, var(--lefine-text) 12%);
    --translator-pane: color-mix(in oklab, var(--kef-bg-card) 90%, #0f0a08 10%);

    display: flex;
    flex-direction: column;
    margin: 0.55rem 0 0.9rem;
  }

  kefine-translator-card {
    position: relative;
    display: block;
    min-width: 0;
    padding: clamp(0.42rem, 1vw, 0.52rem);
    border: 1px solid var(--kef-line);
    border-radius: var(--kef-radius-sm);
    background:
      linear-gradient(135deg, color-mix(in oklab, #ff7a1a 7%, transparent), transparent 58%),
      var(--kef-bg-soft);
    overflow: hidden;
  }

  kefine-translate-grid {
    position: relative;
    display: grid;
    grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
    gap: 0.28rem;
    min-width: 0;
  }

  kefine-translate-pane {
    display: grid;
    grid-template-rows: auto minmax(5.6rem, auto) auto;
    min-width: 0;
    min-height: clamp(8.2rem, 22vw, 9.4rem);
    border: 1px solid color-mix(in oklab, var(--kef-line) 72%, transparent);
    border-radius: var(--kef-radius-xs, 0.35rem);
    background: var(--translator-pane);
    overflow: hidden;
  }

  kefine-translate-pane-head {
    display: flex;
    align-items: center;
    justify-content: center;
    min-width: 0;
    min-height: 1.62rem;
    padding: 0.22rem 0.54rem;
    border-bottom: 1px solid color-mix(in oklab, var(--kef-line) 64%, transparent);
    color: var(--translator-muted);
  }

  kefine-translate-pane-head strong {
    min-width: 0;
    color: var(--translator-muted);
    font-size: 0.62rem;
    font-weight: 800;
    line-height: 1.1;
    text-align: center;
    text-transform: uppercase;
    overflow-wrap: anywhere;
  }

  kefine-translate-pane-head button {
    position: absolute;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 1.6rem;
    height: 1.6rem;
    border: none;
    border-radius: var(--kef-radius-xs, 0.35rem);
    background: transparent;
    color: var(--translator-muted);
    cursor: pointer;
    transition: color 0.16s ease, background 0.16s ease;
  }

  kefine-translate-pane[data-part='translator-source-pane'] kefine-translate-pane-head button {
    right: calc(50% + 0.48rem);
  }

  kefine-translate-pane[data-part='translator-target-pane'] kefine-translate-pane-head button {
    right: 0.48rem;
  }

  kefine-translate-pane-head button:hover,
  kefine-translate-actions button:hover,
  button[data-part='translator-swap']:hover {
    background: color-mix(in oklab, var(--kef-primary) 12%, transparent);
    color: var(--translator-text);
  }

  kefine-translate-pane-head :global(svg) {
    width: 0.92rem;
    height: 0.92rem;
  }

  textarea[data-part='translator-source-input'],
  textarea[data-part='translator-target-output'] {
    width: 100%;
    min-width: 0;
    min-height: 5.65rem;
    resize: none;
    border: 0;
    outline: none;
    padding: clamp(0.68rem, 1.7vw, 0.86rem);
    background: transparent;
    color: var(--translator-text);
    font: inherit;
    font-size: clamp(0.92rem, 2vw, 1.08rem);
    font-weight: 650;
    line-height: 1.35;
    letter-spacing: 0;
    caret-color: var(--kef-primary);
  }

  textarea[data-part='translator-target-output'] {
    -webkit-text-fill-color: var(--translator-text);
    cursor: default;
    opacity: 1;
  }

  textarea[data-part='translator-source-input']::placeholder,
  textarea[data-part='translator-target-output']::placeholder {
    color: color-mix(in oklab, var(--translator-muted) 82%, transparent);
    font-weight: 650;
    opacity: 1;
  }

  kefine-translate-actions {
    display: grid;
    grid-template-columns: repeat(3, 1.5rem) minmax(5.2rem, auto);
    align-items: center;
    gap: 0.16rem;
    min-height: 2rem;
    padding: 0.24rem 0.45rem 0.45rem;
  }

  kefine-translate-actions[data-align='end'] {
    grid-template-columns: repeat(6, 1.5rem);
    justify-content: end;
  }

  kefine-translate-actions button,
  button[data-part='translator-swap'] {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 0;
    height: 1.5rem;
    border: none;
    border-radius: var(--kef-radius-xs, 0.35rem);
    background: transparent;
    color: var(--translator-muted);
    cursor: pointer;
    transition: background 0.16s ease, color 0.16s ease, transform 0.16s ease;
  }

  kefine-translate-actions button :global(svg),
  button[data-part='translator-swap'] :global(svg) {
    width: 0.9rem;
    height: 0.9rem;
  }

  button[data-part='translator-fast'] {
    justify-self: start;
    width: auto;
    max-width: 8.5rem;
    padding: 0 0.58rem;
    border-radius: 999px;
    background: #ff7a1a;
    color: #fff;
    font-size: 0.62rem;
    font-weight: 800;
    white-space: nowrap;
  }

  button[data-part='translator-fast']:hover {
    background: color-mix(in oklab, #ff7a1a 86%, #ffffff);
    color: #fff;
    transform: translateY(-1px);
  }

  button[data-part='translator-swap'] {
    position: absolute;
    z-index: 2;
    top: 0.52rem;
    left: 50%;
    width: 1.62rem;
    height: 1.62rem;
    border-radius: 50%;
    background: color-mix(in oklab, var(--kef-bg-card) 82%, #2e2933 18%);
    box-shadow:
      0 0 0 1px color-mix(in oklab, var(--kef-line) 70%, transparent),
      0 0.45rem 1rem color-mix(in oklab, #000 20%, transparent);
    transform: translateX(-50%);
  }

  button[data-part='translator-swap']:hover {
    transform: translateX(-50%) translateY(-1px);
  }

  @media (max-width: 680px) {
    kefine-translate-grid {
      grid-template-columns: 1fr;
      gap: 0.42rem;
    }

    button[data-part='translator-swap'] {
      top: calc(50% - 0.81rem);
      left: auto;
      right: 0.62rem;
      transform: none;
    }

    button[data-part='translator-swap']:hover {
      transform: translateY(-1px);
    }

    kefine-translate-pane[data-part='translator-source-pane'] kefine-translate-pane-head button,
    kefine-translate-pane[data-part='translator-target-pane'] kefine-translate-pane-head button {
      right: 0.48rem;
    }
  }

  @media (max-width: 420px) {
    kefine-translator-card {
      padding: 0.36rem;
    }

    kefine-translate-actions {
      grid-template-columns: repeat(3, 1.45rem) minmax(4.8rem, auto);
      padding-inline: 0.34rem;
    }

    kefine-translate-actions[data-align='end'] {
      grid-template-columns: repeat(6, 1.42rem);
    }

    button[data-part='translator-fast'] {
      max-width: 6.2rem;
      padding-inline: 0.44rem;
      font-size: 0.58rem;
    }
  }
</style>
