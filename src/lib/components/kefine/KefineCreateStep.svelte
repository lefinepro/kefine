<script lang="ts">
  import { browser } from '$app/environment';
  import { goto } from '$app/navigation';
  import type { DraftOrder, OrderView, TemplatePresentation } from './kefine-workflow';
  import { scheduleAfter } from '$lib/utils/helpers';
  import KefineOrderListItem from '$lib/components/kefine/KefineOrderListItem.svelte';
  import KefineProxyConfigWidget from '$lib/components/kefine/KefineProxyConfigWidget.svelte';
  import KefineMusicWidget from '$lib/components/kefine/KefineMusicWidget.svelte';
  import KefineWeatherWidget from '$lib/components/kefine/KefineWeatherWidget.svelte';
  import KefineTranslatorWidget from '$lib/components/kefine/KefineTranslatorWidget.svelte';
  import KefineSearchInput from '$lib/components/kefine/KefineSearchInput.svelte';
  import SolutionMetricsMini from '$lib/components/kefine/SolutionMetricsMini.svelte';
  import { detectProxyServerIntent } from '$lib/kefine/proxy-intent';
  import {
    findInstantAnswers,
    faviconUrl,
    type InstantAnswer,
    type InstantAnswersData
  } from '$lib/kefine/instant-answers';
  import { createQrMatrix, qrMatrixToSvgPath } from '$lib/kefine/qr-code';
  import { detectMusicExtractIntent } from '$lib/kefine/music-intent';
  import { detectWeatherIntent } from '$lib/kefine/weather-intent';
  import { detectTranslationIntent } from '$lib/kefine/translation-intent';
  import { defaultMetrics } from '$lib/kefine/solutions-data';
  import { cubicOut } from 'svelte/easing';
  import { onMount, tick } from 'svelte';
  const PLACEHOLDER_TYPE_DELAY_MS = 58;
  const PLACEHOLDER_DELETE_DELAY_MS = 34;
  const PLACEHOLDER_PAUSE_MS = 1150;
  const PLACEHOLDER_NEXT_DELAY_MS = 250;

  type SearchPageMode = 'anonymous' | 'saved';

  /** Curtain-drop / oversized → shrink entrance for task rows */
  function taskDropIn(
    node: HTMLElement,
    { delay = 0, duration = 420 }: { delay?: number; duration?: number } = {}
  ) {
    return {
      delay,
      duration,
      easing: cubicOut,
      css: (t: number) => {
        // Starts slightly larger + above, then settles to normal size
        const scale = 1.085 - 0.085 * t; // ~1.085 → 1.0
        const y = -14 * (1 - t);         // drops from -14px
        const opacity = Math.min(1, t * 1.15);
        return `opacity:${opacity}; transform:translateY(${y}px) scale(${scale.toFixed(4)});`;
      }
    };
  }

  let listEntranceDone = $state(false);

  onMount(() => {
    // Give enough time for the full staggered curtain animation even on long lists
    const maxDelay = 78 * 25 + 600;
    setTimeout(() => {
      listEntranceDone = true;
    }, maxDelay);
  });

  let {
    draft,
    template,
    serviceSetup = null,
    pinnedServices,
    pinnedServicesTitle,
    pinnedServicesSubtitle,
    titleFontSize,
    title,
    afe,
    placeholder,
    placeholderVariants,
    executeAria,
    backgroundExecuteAria,
    solverSearchActive = false,
    solverSearchText = '',
    solverSearchLabel,
    solverSearchCompletedLabel = 'Completed',
    solverLabel,
    matchedOrders,
    isSearching,
    matchedTasksLabel,
    recentTasksLabel,
    addFileLabel,
    addExecutionEstimateLabel,
    addTagLabel = '+ tag',
    tagPlaceholderLabel = 'tag',
    instantAnswersLabel = 'Quick answers',
    instantAnswerGoHint = 'Go',
    instantPinLabel = 'Pin to prompt',
    instantUnpinLabel = 'Unpin',
    instantPinnedLabel = 'Pinned to prompt',
    instantMenuLabel = 'More actions',
    instantQrLabel = 'Download QR code',
    instantAgentLabel = 'View site with agent',
    instantAddProjectLabel = 'Add to project',
    instantQrDownloadLabel = 'Download',
    removeTagLabel = (tag: string) => `Remove ${tag} tag`,
    fileCountLabel,
    composerHints,
    openTaskLabel,
    relatedItemsLabel,
    searchResultsOnly = false,
    searchFocusRequest = 0,
    searchResultsEmptyLabel = 'No matching results',
    searchCreateTaskHint = (query: string) =>
      query
        ? `Press Enter to create a task for “${query}” and start executing it`
        : 'Press Enter to create a task and start executing it',
    searchMode = null,
    createServiceLabel = 'Transform to service',
    serviceVariablesLabel = 'Service variables',
    stopTaskLabel = 'Stop repo',
    deleteTaskLabel,
    onSubmit,
    onSearchSubmit,
    onQueueTask,
    onAttachFiles,
    onRemoveFile,
    onDeleteOrder,
    onStopOrder,
    onOpenOrder,
    onCreateServiceFromOrder,
    onDescriptionChange,
    onTemplateVariableChange,
    onTagsChange,
    executionEstimateLabel,
    onExecutionEstimateChange,
    onOpenSolution,
    recentOrders = []
  }: {
    draft: DraftOrder;
    template: TemplatePresentation | null;
    serviceSetup?: {
      title: string;
      subtitle: string;
    } | null;
    pinnedServices: Array<{
      id: string;
      href: string;
      imageDataUrl?: string;
      title: string;
      description: string;
      authorHandle: string;
    }>;
    pinnedServicesTitle: string;
    pinnedServicesSubtitle: string;
    titleFontSize: number;
    title: string;
    afe: {
      title: string;
      labels: {
        input: string;
        intake: string;
        route: string;
        result: string;
        delivery: string;
      };
      cards: Array<{
        title: string;
        detail: string;
      }>;
    };
    placeholder: string;
    placeholderVariants: readonly string[];
    executeAria: string;
    backgroundExecuteAria: string;
    solverSearchActive?: boolean;
    solverSearchText?: string;
    solverSearchLabel: string;
    solverSearchCompletedLabel?: string;
    solverLabel: string;
    matchedOrders: OrderView[];
    recentOrders?: OrderView[];
    isSearching: boolean;
    matchedTasksLabel: string;
    recentTasksLabel: string;
    addFileLabel: string;
    addExecutionEstimateLabel: string;
    addTagLabel?: string;
    tagPlaceholderLabel?: string;
    instantAnswersLabel?: string;
    instantAnswerGoHint?: string;
    instantPinLabel?: string;
    instantUnpinLabel?: string;
    instantPinnedLabel?: string;
    instantMenuLabel?: string;
    instantQrLabel?: string;
    instantAgentLabel?: string;
    instantAddProjectLabel?: string;
    instantQrDownloadLabel?: string;
    removeTagLabel?: (tag: string) => string;
    fileCountLabel: (count: number) => string;
    composerHints: string;
    openTaskLabel: string;
    relatedItemsLabel: string;
    searchResultsOnly?: boolean;
    searchFocusRequest?: number;
    searchResultsEmptyLabel?: string;
    searchCreateTaskHint?: (query: string) => string;
    searchMode?: SearchPageMode | null;
    createServiceLabel?: string;
    serviceVariablesLabel?: string;
    stopTaskLabel?: string;
    deleteTaskLabel: string;
    onSubmit: () => void;
    onSearchSubmit?: () => void;
    onQueueTask: () => Promise<void> | void;
    onAttachFiles: (files: File[]) => void;
    onRemoveFile: (index: number) => void;
    onDeleteOrder: (order: OrderView, event: Event) => void;
    onStopOrder?: (order: OrderView, event: Event) => void;
    onOpenOrder: (order: OrderView) => void;
    onCreateServiceFromOrder?: (order: OrderView, event: Event) => void;
    onDescriptionChange?: (value: string) => void;
    onTemplateVariableChange?: (key: string, value: string) => void;
    onTagsChange?: (tags: string[]) => void;
    executionEstimateLabel: string;
    onExecutionEstimateChange?: (value: string) => void;
    onOpenSolution?: (solutionId: string) => void;
  } = $props();

  const showTaskComposer = $derived(!searchMode && !searchResultsOnly);
  const showSearchPageInput = $derived(searchMode === 'anonymous');
  const showHomeContent = $derived(!searchMode && !searchResultsOnly);
  const showTaskHistory = $derived(!searchMode && !searchResultsOnly);

  // Show the proxy configuration widget as soon as the draft reads like a proxy
  // request — no submit required (e.g. typing "Нужен прокси сервер").
  const proxyIntentActive = $derived(detectProxyServerIntent(draft.description));

  // Weather instant answer, matching the proxy/music intent widgets: render the
  // forecast card while the prompt is still being composed.
  const weatherIntentActive = $derived(detectWeatherIntent(draft.description));

  // Translation instant answer: render an empty translator surface for generic
  // "Translate/Перевод" prompts and preselect languages when the pair is named.
  const translationIntentActive = $derived(detectTranslationIntent(draft.description));

  // Instant answers: a frontend-only autocomplete of known websites loaded from
  // /instant-answers.json. As the user types, matching sites are surfaced as
  // direct links (e.g. "sound cloud" -> https://soundcloud.com/).
  let instantSites = $state<InstantAnswer[]>([]);
  let instantHighlight = $state(-1);
  let instantDismissed = $state(false);
  // URLs whose favicon failed to load — fall back to the emoji icon for those.
  let failedFavicons = $state<Set<string>>(new Set());
  // Which row's "⋯" actions menu is currently open (by site url), if any.
  let instantMenuOpen = $state<string | null>(null);
  // Site whose QR-code card is currently shown, if any.
  let qrSite = $state<InstantAnswer | null>(null);

  const PINNED_INSTANT_KEY = 'kefine-pinned-instant-answers';
  // URLs the user pinned to the prompt; their favicons stay attached to the
  // search box (the "connecting prompt") so they remain handy across searches.
  let pinnedUrls = $state<string[]>([]);

  onMount(() => {
    if (!browser) return;
    fetch('/instant-answers.json')
      .then((response) => (response.ok ? response.json() : null))
      .then((data: InstantAnswersData | null) => {
        if (data && Array.isArray(data.sites)) {
          instantSites = data.sites;
        }
      })
      .catch(() => {
        // Autocomplete is a progressive enhancement; ignore load failures.
      });

    try {
      const raw = localStorage.getItem(PINNED_INSTANT_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          pinnedUrls = parsed.filter((url): url is string => typeof url === 'string');
        }
      }
    } catch {
      // Pinning is a progressive enhancement; ignore storage failures.
    }
  });

  const instantAnswers = $derived.by(() => {
    if (instantDismissed) return [];
    return findInstantAnswers(draft.description, instantSites);
  });
  const instantAnswersOpen = $derived(instantAnswers.length > 0);

  // Sites the user pinned to the prompt, rendered as favicon chips attached to
  // the search box so they stay connected to the prompt across searches.
  const pinnedAnswers = $derived(
    pinnedUrls
      .map((url) => instantSites.find((site) => site.url === url))
      .filter((site): site is InstantAnswer => Boolean(site))
  );

  function isPinned(url: string): boolean {
    return pinnedUrls.includes(url);
  }

  function togglePin(url: string) {
    const next = pinnedUrls.includes(url)
      ? pinnedUrls.filter((entry) => entry !== url)
      : [...pinnedUrls, url];
    pinnedUrls = next;
    if (browser) {
      try {
        localStorage.setItem(PINNED_INSTANT_KEY, JSON.stringify(next));
      } catch {
        // Ignore storage failures (private mode, quota, etc.).
      }
    }
  }

  function markFaviconFailed(url: string) {
    if (failedFavicons.has(url)) return;
    failedFavicons = new Set(failedFavicons).add(url);
  }

  function toggleInstantMenu(url: string) {
    instantMenuOpen = instantMenuOpen === url ? null : url;
  }

  function openQrCard(site: InstantAnswer) {
    qrSite = site;
    instantMenuOpen = null;
  }

  function viewWithAgent(site: InstantAnswer) {
    instantMenuOpen = null;
    if (browser) {
      window.open(site.url, '_blank', 'noopener,noreferrer');
    }
  }

  function addToProject(site: InstantAnswer) {
    instantMenuOpen = null;
    const current = draft.description.trim();
    const next = current ? `${current}\n${site.url}` : site.url;
    onDescriptionChange?.(next);
  }

  // Render the QR code for the open card locally (no external request) using the
  // dependency-free generator already shipped for the proxy widget.
  const qrMatrix = $derived.by(() => {
    if (!qrSite) return null;
    try {
      return createQrMatrix(qrSite.url, { errorCorrectionLevel: 'medium' });
    } catch {
      return null;
    }
  });
  const qrPath = $derived(qrMatrix ? qrMatrixToSvgPath(qrMatrix) : '');
  const qrViewBox = $derived(qrMatrix ? `-2 -2 ${qrMatrix.size + 4} ${qrMatrix.size + 4}` : '0 0 1 1');

  function downloadQr() {
    if (!browser || !qrSite || !qrMatrix) return;
    const dimension = qrMatrix.size + 4;
    const svg =
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="-2 -2 ${dimension} ${dimension}" width="320" height="320">` +
      `<rect x="-2" y="-2" width="${dimension}" height="${dimension}" fill="#ffffff"/>` +
      `<path d="${qrPath}" fill="#000000"/></svg>`;
    const blob = new Blob([svg], { type: 'image/svg+xml' });
    const objectUrl = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = objectUrl;
    anchor.download = `${qrSite.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')}-qr.svg`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(objectUrl);
  }

  $effect(() => {
    // Reset the highlight whenever the visible suggestion set changes.
    void draft.description;
    instantHighlight = -1;
  });

  $effect(() => {
    // Re-enable suggestions once the user starts typing again after dismissing.
    if (draft.description.trim() === '') {
      instantDismissed = false;
    }
  });

  function openInstantAnswer(site: InstantAnswer) {
    if (browser) {
      window.open(site.url, '_blank', 'noopener,noreferrer');
    }
    instantDismissed = true;
    instantHighlight = -1;
    instantMenuOpen = null;
  }

  $effect(() => {
    if (!browser || (!instantMenuOpen && !qrSite)) {
      return;
    }

    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target as HTMLElement | null;
      if (target?.closest('[data-part="instant-actions"], [data-part="qr-card"]')) {
        return;
      }
      instantMenuOpen = null;
      qrSite = null;
    };

    const handleKeydown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        instantMenuOpen = null;
        qrSite = null;
      }
    };

    globalThis.addEventListener('pointerdown', handlePointerDown);
    globalThis.addEventListener('keydown', handleKeydown);
    return () => {
      globalThis.removeEventListener('pointerdown', handlePointerDown);
      globalThis.removeEventListener('keydown', handleKeydown);
    };
  });
  // Show the music player widget as soon as the draft reads like an
  // "extract music/audio from video" request — no submit required
  // (e.g. typing "Извлечь музыку из видео").
  const musicIntentActive = $derived(detectMusicExtractIntent(draft.description));

  let animatedPlaceholder = $state('');
  let placeholderVisible = $state(false);
  let placeholderFocused = $state(false);
  let inputMetaOpen = $state(false);
  let searchRevealed = $state(false);
  let articleRef = $state<HTMLElement | null>(null);
  let executionEditorOpen = $state(false);
  let tagEditorOpen = $state(false);
  let tagInputValue = $state('');
  let taskTextarea = $state<HTMLTextAreaElement | null>(null);
  let tagInput = $state<HTMLInputElement | null>(null);
  let fileInput = $state<HTMLInputElement | null>(null);
  let filePreviews = $state<Map<number, string>>(new Map());
  let queuePopoverOpen = $state(false);
  let queuePressTriggered = $state(false);
  let cancelPlaceholderTick: (() => void) | null = null;
  let cancelQueuePress: (() => void) | null = null;
  let placeholderVariantIndex = $state(0);
  let placeholderCharIndex = $state(0);
  let placeholderDeleting = $state(false);
  let taskCompleted = $state(false);
  let isFlying = $state(false);
  let initialized = $state(false);

  $effect(() => {
    const request = searchFocusRequest;
    if (!browser || !request || !showTaskComposer) {
      return;
    }

    void tick().then(() => {
      inputMetaOpen = true;
      searchRevealed = true;
      placeholderFocused = true;
      stopPlaceholderAnimation({ hide: true });
      taskTextarea?.focus();
      taskTextarea?.setSelectionRange(draft.description.length, draft.description.length);
    });
  });

  function handleSearchPageInput(value: string) {
    if (onDescriptionChange) {
      onDescriptionChange(value);
      return;
    }

    draft.description = value;
  }

  function handleSearchPageKeydown(event: KeyboardEvent) {
    if (event.key !== 'Enter' || event.isComposing) {
      return;
    }

    if (!draft.description.trim()) {
      return;
    }

    event.preventDefault();
    (onSearchSubmit ?? onSubmit)();
  }

  function orderScore(query: string, order: OrderView): number {
    const q = query.trim().toLowerCase();
    if (!q) return 0;
    const title = (order.title ?? '').toLowerCase();
    if (title === q) return 100;
    if (title.startsWith(q)) return 50;
    if (title.includes(q)) return 25;
    if ((order.solver ?? '').toLowerCase().includes(q)) return 10;
    if ((order.id ?? '').toLowerCase().includes(q)) return 5;
    return 0;
  }

  let sortedMatchedOrders = $derived(
    draft.description.trim()
      ? [...matchedOrders].sort(
          (a, b) => orderScore(draft.description, b) - orderScore(draft.description, a)
        )
      : matchedOrders
  );

  import { solutionsStore } from '$lib/kefine/solutions-store';
  import { get } from 'svelte/store';

  const COMPLETED_SEARCHES_KEY = 'kefine-completed-solver-searches';

  function getCompletedSearches(): Set<string> {
    if (!browser) return new Set();
    try {
      const raw = localStorage.getItem(COMPLETED_SEARCHES_KEY);
      return raw ? new Set(JSON.parse(raw)) : new Set();
    } catch {
      return new Set();
    }
  }

  function markSearchCompleted(text: string) {
    if (!browser) return;
    const set = getCompletedSearches();
    set.add(text.trim().toLowerCase());
    localStorage.setItem(COMPLETED_SEARCHES_KEY, JSON.stringify([...set]));
  }

  function isSearchCompleted(text: string): boolean {
    return getCompletedSearches().has(text.trim().toLowerCase());
  }

  interface Solution {
    id: string;
    solver: string;
    title: string;
    description: string;
    diffs: Array<{ file: string; added: number; removed: number }>;
    codeLines: Array<{ text: string; type: 'added' | 'removed' | 'unchanged' }>;
    fileCodeLines?: Record<string, Array<{ text: string; type: 'added' | 'removed' | 'unchanged' }>>;
  }

  const defaultSolutions: Solution[] = [
    {
      id: '1',
      solver: 'Basic Rust Dev',
      title: 'Simple Hello World without comments',
      description: 'Minimal implementation with just the basics',
      diffs: [
        { file: 'src/main.rs', added: 3, removed: 0 }
      ],
      codeLines: [
        { text: 'fn main() {', type: 'added' },
        { text: '    println!("Hello, world!");', type: 'added' },
        { text: '}', type: 'added' }
      ]
    },
    {
      id: '2',
      solver: 'Commented Rust Expert',
      title: 'Hello World with detailed comments',
      description: 'Educational version with explanations for each line',
      diffs: [
        { file: 'src/main.rs', added: 10, removed: 0 }
      ],
      codeLines: [
        { text: '// This is the main function - entry point of every Rust program', type: 'added' },
        { text: 'fn main() {', type: 'added' },
        { text: '    // Print a greeting message to the console', type: 'added' },
        { text: '    // println! is a macro that prints to stdout with a newline', type: 'added' },
        { text: '    println!("Hello, world!");', type: 'added' },
        { text: '', type: 'unchanged' },
        { text: '    // The program will exit here', type: 'added' },
        { text: '    // Rust automatically returns () (unit type) from functions', type: 'added' },
        { text: '}', type: 'added' }
      ]
    },
    {
      id: '3',
      solver: 'Interactive Rust',
      title: 'Interactive Hello World with user input',
      description: 'Reads user input and responds accordingly',
      diffs: [
        { file: 'src/main.rs', added: 12, removed: 0 }
      ],
      codeLines: [
        { text: 'use std::io;', type: 'added' },
        { text: '', type: 'unchanged' },
        { text: 'fn main() {', type: 'added' },
        { text: '    println!("Hello, world!");', type: 'added' },
        { text: '', type: 'unchanged' },
        { text: '    println!("What\'s your name?");', type: 'added' },
        { text: '    let mut name = String::new();', type: 'added' },
        { text: '    io::stdin().read_line(&mut name).expect("Failed to read line");', type: 'added' },
        { text: '', type: 'unchanged' },
        { text: '    println!("Hello, {}!", name.trim());', type: 'added' },
        { text: '}', type: 'added' }
      ]
    },
    {
      id: '4',
      solver: 'Modern Rust Patterns',
      title: 'Hello World using modern Rust patterns',
      description: 'Uses Result handling and modern syntax',
      diffs: [
        { file: 'src/main.rs', added: 15, removed: 0 }
      ],
      codeLines: [
        { text: 'use std::io::{self, Write};', type: 'added' },
        { text: '', type: 'unchanged' },
        { text: 'fn main() -> Result<(), Box<dyn std::error::Error>> {', type: 'added' },
        { text: '    println!("Hello, world!");', type: 'added' },
        { text: '', type: 'unchanged' },
        { text: '    print!("Enter your name: ");', type: 'added' },
        { text: '    io::stdout().flush()?;', type: 'added' },
        { text: '', type: 'unchanged' },
        { text: '    let mut name = String::new();', type: 'added' },
        { text: '    io::stdin().read_line(&mut name)?;', type: 'added' },
        { text: '', type: 'unchanged' },
        { text: '    println!("Hello, {}!", name.trim());', type: 'added' },
        { text: '    Ok(())', type: 'added' },
        { text: '}', type: 'added' }
      ]
},
    {
      id: '5',
      solver: 'Go Proxy Basic',
      title: 'Simple HTTP Proxy',
      description: 'Minimal HTTP proxy with forward functionality',
      diffs: [
        { file: 'main.go', added: 28, removed: 0 },
        { file: 'config.yaml', added: 5, removed: 0 },
        { file: 'go.mod', added: 2, removed: 0 }
      ],
      fileCodeLines: {
        'main.go': [
          { text: 'package main', type: 'added' },
          { text: '', type: 'unchanged' },
          { text: 'import (', type: 'added' },
          { text: '    "fmt"', type: 'added' },
          { text: '    "net/http"', type: 'added' },
          { text: '    "log"', type: 'added' },
          { text: ')', type: 'added' },
          { text: '', type: 'unchanged' },
          { text: 'func handleRequest(w http.ResponseWriter, r *http.Request) {', type: 'added' },
          { text: '    fmt.Printf("Proxying: %s %s\\n", r.Method, r.URL)', type: 'added' },
          { text: '    r.RequestURI = ""', type: 'added' },
          { text: '    r.URL.Scheme = "http"', type: 'added' },
          { text: '    r.URL.Host = "localhost:8080"', type: 'added' },
          { text: '', type: 'unchanged' },
          { text: '    client := &http.Client{}', type: 'added' },
          { text: '    resp, err := client.Do(r)', type: 'added' },
          { text: '    if err != nil {', type: 'added' },
          { text: '        http.Error(w, err.Error(), 500)', type: 'added' },
          { text: '        return', type: 'added' },
          { text: '    }', type: 'added' },
          { text: '    defer resp.Body.Close()', type: 'added' },
          { text: '', type: 'unchanged' },
          { text: '    for k, v := range resp.Header {', type: 'added' },
          { text: '        w.Header()[k] = v', type: 'added' },
          { text: '    }', type: 'added' },
          { text: '    w.WriteHeader(resp.StatusCode)', type: 'added' },
          { text: '}', type: 'added' },
          { text: '', type: 'unchanged' },
          { text: 'func main() {', type: 'added' },
          { text: '    http.HandleFunc("/", handleRequest)', type: 'added' },
          { text: '    log.Println("Proxy server on :9090")', type: 'added' },
          { text: '    log.Fatal(http.ListenAndServe(":9090", nil))', type: 'added' },
          { text: '}', type: 'added' }
        ],
        'config.yaml': [
          { text: 'server:', type: 'added' },
          { text: '  port: 9090', type: 'added' },
          { text: '  host: "0.0.0.0"', type: 'added' },
          { text: '', type: 'unchanged' },
          { text: 'proxy:', type: 'added' },
          { text: '  target: "http://localhost:8080"', type: 'added' },
          { text: '  timeout: 30', type: 'added' }
        ],
        'go.mod': [
          { text: 'module github.com/example/proxy', type: 'added' },
          { text: '', type: 'unchanged' },
          { text: 'go 1.21', type: 'added' }
        ]
      },
      codeLines: [
        { text: 'package main', type: 'added' },
        { text: '', type: 'unchanged' },
        { text: 'import (', type: 'added' },
        { text: '    "fmt"', type: 'added' },
        { text: '    "net/http"', type: 'added' },
        { text: '    "log"', type: 'added' },
        { text: ')', type: 'added' },
        { text: '', type: 'unchanged' },
        { text: 'func handleRequest(w http.ResponseWriter, r *http.Request) {', type: 'added' },
        { text: '    fmt.Printf("Proxying: %s %s\\n", r.Method, r.URL)', type: 'added' },
        { text: '    r.RequestURI = ""', type: 'added' },
        { text: '    r.URL.Scheme = "http"', type: 'added' },
        { text: '    r.URL.Host = "localhost:8080"', type: 'added' },
        { text: '', type: 'unchanged' },
        { text: '    client := &http.Client{}', type: 'added' },
        { text: '    resp, err := client.Do(r)', type: 'added' },
        { text: '    if err != nil {', type: 'added' },
        { text: '        http.Error(w, err.Error(), 500)', type: 'added' },
        { text: '        return', type: 'added' },
        { text: '    }', type: 'added' },
        { text: '    defer resp.Body.Close()', type: 'added' },
        { text: '', type: 'unchanged' },
        { text: '    for k, v := range resp.Header {', type: 'added' },
        { text: '        w.Header()[k] = v', type: 'added' },
        { text: '    }', type: 'added' },
        { text: '    w.WriteHeader(resp.StatusCode)', type: 'added' },
        { text: '    // w.CopyFrom(resp.Body)', type: 'added' },
        { text: '}', type: 'added' },
        { text: '', type: 'unchanged' },
        { text: 'func main() {', type: 'added' },
        { text: '    http.HandleFunc("/", handleRequest)', type: 'added' },
        { text: '    log.Println("Proxy server on :9090")', type: 'added' },
        { text: '    log.Fatal(http.ListenAndServe(":9090", nil))', type: 'added' },
        { text: '}', type: 'added' }
      ]
    },
    {
      id: '6',
      solver: 'Go Proxy Pro',
      title: 'Production-ready Proxy with Logging',
      description: 'Proxy with request/response logging and error handling',
      diffs: [
        { file: 'main.go', added: 48, removed: 0 },
        { file: 'config.go', added: 12, removed: 0 },
        { file: 'logger.go', added: 8, removed: 0 },
        { file: 'go.mod', added: 2, removed: 0 }
      ],
      codeLines: [
        { text: 'package main', type: 'added' },
        { text: '', type: 'unchanged' },
        { text: 'import (', type: 'added' },
        { text: '    "bytes"', type: 'added' },
        { text: '    "fmt"', type: 'added' },
        { text: '    "io"', type: 'added' },
        { text: '    "log"', type: 'added' },
        { text: '    "net/http"', type: 'added' },
        { text: '    "time"', type: 'added' },
        { text: ')', type: 'added' },
        { text: '', type: 'unchanged' },
        { text: 'type ProxyHandler struct {', type: 'added' },
        { text: '    targetURL string', type: 'added' },
        { text: '    timeout time.Duration', type: 'added' },
        { text: '}', type: 'added' },
        { text: '', type: 'unchanged' },
        { text: 'func (p *ProxyHandler) ServeHTTP(w http.ResponseWriter, r *http.Request) {', type: 'added' },
        { text: '    start := time.Now()', type: 'added' },
        { text: '', type: 'unchanged' },
        { text: '    r.RequestURI = ""', type: 'added' },
        { text: '    r.URL.Scheme = "http"', type: 'added' },
        { text: '    r.URL.Host = p.targetURL', type: 'added' },
        { text: '', type: 'unchanged' },
        { text: '    log.Printf("%s %s -> %s", r.Method, r.URL.Path, r.URL)', type: 'added' },
        { text: '', type: 'unchanged' },
        { text: '    client := &http.Client{Timeout: p.timeout}', type: 'added' },
        { text: '    resp, err := client.Do(r)', type: 'added' },
        { text: '    if err != nil {', type: 'added' },
        { text: '        log.Printf("Error: %v", err)', type: 'added' },
        { text: '        http.Error(w, err.Error(), 502)', type: 'added' },
        { text: '        return', type: 'added' },
        { text: '    }', type: 'added' },
        { text: '    defer resp.Body.Close()', type: 'added' },
        { text: '', type: 'unchanged' },
        { text: '    body, err := io.ReadAll(resp.Body)', type: 'added' },
        { text: '    if err != nil {', type: 'added' },
        { text: '        http.Error(w, err.Error(), 500)', type: 'added' },
        { text: '        return', type: 'added' },
        { text: '    }', type: 'added' },
        { text: '', type: 'unchanged' },
        { text: '    for k, v := range resp.Header {', type: 'added' },
        { text: '        w.Header()[k] = v', type: 'added' },
        { text: '    }', type: 'added' },
        { text: '    w.WriteHeader(resp.StatusCode)', type: 'added' },
        { text: '    w.Write(body)', type: 'added' },
        { text: '', type: 'unchanged' },
        { text: '    log.Printf("Completed in %v", time.Since(start))', type: 'added' },
        { text: '}', type: 'added' },
        { text: '', type: 'unchanged' },
        { text: 'func main() {', type: 'added' },
        { text: '    handler := &ProxyHandler{', type: 'added' },
        { text: '        targetURL: "localhost:8080",', type: 'added' },
        { text: '        timeout: 30 * time.Second,', type: 'added' },
        { text: '    }', type: 'added' },
        { text: '    log.Println("Starting proxy on :9090")', type: 'added' },
        { text: '    log.Fatal(http.ListenAndServe(":9090", handler))', type: 'added' },
        { text: '}', type: 'added' }
      ]
    },
    {
      id: '7',
      solver: 'Go Reverse Proxy',
      title: 'Reverse Proxy with Path Rewrite',
      description: 'Reverse proxy that rewrites paths and handles routing',
      diffs: [
        { file: 'main.go', added: 55, removed: 0 },
        { file: 'proxy.go', added: 15, removed: 0 },
        { file: 'config.go', added: 10, removed: 0 },
        { file: 'middleware.go', added: 8, removed: 0 },
        { file: 'go.mod', added: 2, removed: 0 }
      ],
      codeLines: [
        { text: 'package main', type: 'added' },
        { text: '', type: 'unchanged' },
        { text: 'import (', type: 'added' },
        { text: '    "fmt"', type: 'added' },
        { text: '    "net/http"', type: 'added' },
        { text: '    "net/http/httputil"', type: 'added' },
        { text: '    "net/url"', type: 'added' },
        { text: ')', type: 'added' },
        { text: '', type: 'unchanged' },
        { text: 'type ReverseProxy struct {', type: 'added' },
        { text: '    target *url.URL', type: 'added' },
        { text: '    director func(*http.Request)', type: 'added' },
        { text: '}', type: 'added' },
        { text: '', type: 'unchanged' },
        { text: 'func NewReverseProxy(target string) *ReverseProxy {', type: 'added' },
        { text: '    targetURL, _ := url.Parse(target)', type: 'added' },
        { text: '    return &ReverseProxy{', type: 'added' },
        { text: '        target: targetURL,', type: 'added' },
        { text: '        director: func(req *http.Request) {', type: 'added' },
        { text: '            req.URL.Scheme = targetURL.Scheme', type: 'added' },
        { text: '            req.URL.Host = targetURL.Host', type: 'added' },
        { text: '            req.Header.Set("X-Forwarded-Host", req.Host)', type: 'added' },
        { text: '            req.Header.Set("X-Real-IP", req.RemoteAddr)', type: 'added' },
        { text: '        },', type: 'added' },
        { text: '    }', type: 'added' },
        { text: '}', type: 'added' },
        { text: '', type: 'unchanged' },
        { text: 'func (rp *ReverseProxy) ServeHTTP(w http.ResponseWriter, r *http.Request) {', type: 'added' },
        { text: '    fmt.Printf("[%s] %s -> %s\\n", r.Method, r.URL.Path, rp.target)', type: 'added' },
        { text: '', type: 'unchanged' },
        { text: '    proxy := &httputil.ReverseProxy{', type: 'added' },
        { text: '        Director: rp.director,', type: 'added' },
        { text: '    }', type: 'added' },
        { text: '    proxy.ServeHTTP(w, r)', type: 'added' },
        { text: '}', type: 'added' },
        { text: '', type: 'unchanged' },
        { text: 'func main() {', type: 'added' },
        { text: '    proxy := NewReverseProxy("http://localhost:8080")', type: 'added' },
        { text: '    http.Handle("/", proxy)', type: 'added' },
        { text: '    fmt.Println("Reverse proxy listening on :9090")', type: 'added' },
        { text: '    fmt.Println("Forwarding to http://localhost:8080")', type: 'added' },
        { text: '    http.ListenAndServe(":9090", nil)', type: 'added' },
        { text: '}', type: 'added' }
      ]
    }
  ];

$effect(() => {
    if (initialized) return;
initialized = true;
    const current = solutionsStore.getAll();
    if (current.length === 0) {
      solutionsStore.set([...defaultSolutions]);
    }
  });

  const crownAnimating = $state<Record<string, boolean>>({});

  function handleCrownClick(solutionId: string) {
    if (crownAnimating[solutionId]) return;
    const idx = $solutionsStore.findIndex(s => s.id === solutionId);
    if (idx === -1) return;
    const sol = $solutionsStore[idx];
    if (sol.rated) {
      crownAnimating[solutionId] = true;
      const btn = document.querySelector<HTMLElement>(`[data-crown-btn="${solutionId}"]`);
      if (btn) {
        requestAnimationFrame(() => {
          btn.classList.remove('is-active');
          crownAnimating[solutionId] = false;
        });
      }
      solutionsStore.update(list => {
        const newList = [...list];
        newList[idx] = { ...newList[idx], rated: false };
        return newList;
      });
    } else {
      crownAnimating[solutionId] = true;
      solutionsStore.update(list => {
        const newList = [...list];
        newList[idx] = { ...newList[idx], rated: true };
        return newList;
      });
      setTimeout(() => {
        crownAnimating[solutionId] = false;
      }, 800);
    }
  }

  const isMultilineDraft = $derived(draft.description.includes('\n'));
  const displayedSolutions = $derived.by(() => {
    const all = $solutionsStore;
    const text = solverSearchText.trim().toLowerCase();
    if (taskCompleted) {
      const taskLower = taskSearchText.toLowerCase();
      if (taskLower.includes('мини прокси') && taskLower.includes('go')) {
        return all.filter(s => ['5', '6', '7'].includes(s.id));
      }
      if (taskLower.includes('hello world') && taskLower.includes('rust')) {
        return all.filter(s => ['1', '2', '3', '4'].includes(s.id));
      }
      return all;
    }
    if (!text) return all;
    if (text.includes('мини прокси') && text.includes('go')) {
      return all.filter(s => ['5', '6', '7'].includes(s.id));
    }
    if (text.includes('hello world') && text.includes('rust')) {
      return all.filter(s => ['1', '2', '3', '4'].includes(s.id));
    }
    return all;
  });

  let taskSearchText = $state('');

  const afeIntroCard = $derived(afe.cards[0] ?? null);
  const afeStepCards = $derived(afe.cards.slice(1));

  /**
   * When the user submits a search whose text matches an existing recent order,
   * we want to animate that existing row to the top and mark it completed — not
   * render a second "in progress" placeholder row beneath it. This finds such a
   * duplicate to suppress in the active-search placeholder rendering.
   */
  const activeSearchDuplicate = $derived.by(() => {
    if (!solverSearchActive) return null;
    const text = solverSearchText.trim().toLowerCase();
    if (!text) return null;
    return recentOrders.find((order) => order.title?.toLowerCase().includes(text)) ?? null;
  });

  const filteredRecentOrders = $derived(recentOrders);

  const searchResultHref = $derived.by(() => {
    const first = matchedOrders[0];
    if (first?.actorHandle && (first.shareId ?? first.id)) {
      return `/order/${encodeURIComponent(first.shareId ?? first.id)}`;
    }
    return `/order/go-proxy/solutions?task=${encodeURIComponent(solverSearchText)}`;
  });

  function isGoProxySearch(text: string): boolean {
    const normalized = text.trim().toLowerCase();
    return normalized.includes('мини прокси') && normalized.includes('go');
  }

  function isRustHelloWorldSearch(text: string): boolean {
    const normalized = text.trim().toLowerCase();
    return normalized.includes('hello world') && normalized.includes('rust');
  }

  function solverRepositoryName(text: string): string {
    if (isGoProxySearch(text)) {
      return '@kefine/go-proxy';
    }

    if (isRustHelloWorldSearch(text)) {
      return '@rust/hello-world';
    }

    return 'feat/basic-forward';
  }

  function completedBranchLabel(text: string, completed: boolean): string {
    return completed ? solverRepositoryName(text) : 'feat/basic-forward';
  }

  function shouldShowSolverList(text: string, completed: boolean): boolean {
    return completed && (isGoProxySearch(text) || isRustHelloWorldSearch(text));
  }

  function orderSolutionsHref(order: OrderView): string {
    return `/order/${encodeURIComponent(order.id)}/solutions?task=${encodeURIComponent(order.title || solverSearchText)}`;
  }

  function orderTaskHref(order: OrderView): string {
    return `/order/${encodeURIComponent(order.shareId ?? order.id)}`;
  }

  function openSolverList(event: MouseEvent, href: string) {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) {
      return;
    }

    event.preventDefault();
    void goto(href);
  }

  function formatTemplateVariableLabel(key: string): string {
    const normalized = key.trim().replace(/[_-]+/g, ' ');
    if (!normalized) {
      return 'Variable';
    }

    return normalized.replace(/\b\w/g, (char) => char.toUpperCase());
  }

  function getServiceInitial(title: string): string {
    const normalized = title.trim();
    if (!normalized) {
      return 'S';
    }

    const match = normalized.match(/[A-Za-zА-Яа-яԱ-Ֆա-ֆ0-9]/u);
    return (match?.[0] ?? normalized[0] ?? 'S').toUpperCase();
  }

  function getServiceAccentToken(title: string): string {
    const seed = Array.from(title.trim()).reduce((sum, char) => sum + char.charCodeAt(0), 0);
    const accents = ['gold', 'coral', 'rose', 'plum', 'sky', 'teal'];
    return accents[seed % accents.length] ?? 'gold';
  }

  function getTaskFontSizeToken(size: number): 'compact' | 'balanced' | 'hero' {
    if (size >= 1.7) return 'hero';
    if (size >= 1.3) return 'balanced';
    return 'compact';
  }

  function resizeTaskInput(_description: string) {
    if (!taskTextarea) {
      return;
    }

    if (!isMultilineDraft) {
      taskTextarea.style.height = '';
      return;
    }

    const scrollH = taskTextarea.scrollHeight;
    taskTextarea.style.height = `${Math.min(Math.max(scrollH, 104), 288)}px`;
  }

  function stopPlaceholderAnimation({ hide = false }: { hide?: boolean } = {}) {
    cancelPlaceholderTick?.();
    cancelPlaceholderTick = null;
    if (hide) {
      placeholderVisible = false;
      animatedPlaceholder = '';
    }
  }

  function resetPlaceholderAnimation() {
    placeholderVariantIndex = 0;
    placeholderCharIndex = 0;
    placeholderDeleting = false;
    animatedPlaceholder = '';
    placeholderVisible = false;
  }

  function schedulePlaceholderTick(delay: number) {
    cancelPlaceholderTick?.();
    cancelPlaceholderTick = scheduleAfter(delay, runPlaceholderTick);
  }

  function runPlaceholderTick() {
    const variants = placeholderVariants.length > 0 ? placeholderVariants : [placeholder];
    const active = variants[placeholderVariantIndex] ?? placeholder;

    if (placeholderFocused || draft.description.trim()) {
      stopPlaceholderAnimation({ hide: true });
      return;
    }

    if (!placeholderDeleting) {
      placeholderVisible = true;

      if (placeholderCharIndex < active.length) {
        placeholderCharIndex += 1;
        animatedPlaceholder = active.slice(0, placeholderCharIndex);
        schedulePlaceholderTick(PLACEHOLDER_TYPE_DELAY_MS);
        return;
      }

      placeholderDeleting = true;
      schedulePlaceholderTick(PLACEHOLDER_PAUSE_MS);
      return;
    }

    if (placeholderCharIndex > 0) {
      placeholderCharIndex -= 1;
      animatedPlaceholder = active.slice(0, placeholderCharIndex);
      schedulePlaceholderTick(PLACEHOLDER_DELETE_DELAY_MS);
      return;
    }

    placeholderVisible = false;
    placeholderDeleting = false;
    placeholderVariantIndex = (placeholderVariantIndex + 1) % variants.length;
    schedulePlaceholderTick(PLACEHOLDER_NEXT_DELAY_MS);
  }

  $effect(() => {
    resizeTaskInput(draft.description);
  });

  $effect(() => {
    const shouldAnimate = !draft.description.trim() && !placeholderFocused;

    if (!shouldAnimate) {
      stopPlaceholderAnimation({ hide: true });
      return;
    }

    if (!cancelPlaceholderTick) {
      schedulePlaceholderTick(animatedPlaceholder ? PLACEHOLDER_TYPE_DELAY_MS : 0);
    }

    return () => {
      cancelPlaceholderTick?.();
      cancelPlaceholderTick = null;
    };
  });

  $effect(() => {
    const text = solverSearchText.trim().toLowerCase();
    if (solverSearchActive && text.includes('hello world') && text.includes('rust')) {
      taskSearchText = solverSearchText.trim();
      isFlying = true;
      const timer = setTimeout(() => {
        taskCompleted = true;
        isFlying = false;
        markSearchCompleted(solverSearchText);
        const current = solutionsStore.getAll();
        const rustSolutions = defaultSolutions.filter(s => ['1', '2', '3', '4'].includes(s.id));
        const existingIds = current.map(s => s.id);
        const newSolutions = rustSolutions.filter(s => !existingIds.includes(s.id));
        if (newSolutions.length > 0) {
          solutionsStore.set([...current, ...newSolutions]);
        }
      }, 4000);
      return () => clearTimeout(timer);
    }
  });

  $effect(() => {
    const text = solverSearchText.trim().toLowerCase();
    if (solverSearchActive && text.includes('мини прокси') && text.includes('go')) {
      taskSearchText = solverSearchText.trim();
      isFlying = true;
      const timer = setTimeout(() => {
        taskCompleted = true;
        isFlying = false;
        markSearchCompleted(solverSearchText);
        const current = solutionsStore.getAll();
        const goSolutions = defaultSolutions.filter(s => ['5', '6', '7'].includes(s.id));
        const existingIds = current.map(s => s.id);
        const newSolutions = goSolutions.filter(s => !existingIds.includes(s.id));
        if (newSolutions.length > 0) {
          solutionsStore.set([...current, ...newSolutions]);
        }
      }, 4000);
      return () => clearTimeout(timer);
    }
  });

  $effect(() => {
    return () => {
      cancelPlaceholderTick?.();
      cancelPlaceholderTick = null;
      cancelQueuePress?.();
      cancelQueuePress = null;
    };
  });

  function handleTaskInputKeydown(event: KeyboardEvent) {
    // Instant-answers keyboard navigation takes priority while the dropdown is open.
    if (instantAnswersOpen) {
      if (event.key === 'ArrowDown') {
        event.preventDefault();
        instantHighlight = (instantHighlight + 1) % instantAnswers.length;
        return;
      }

      if (event.key === 'ArrowUp') {
        event.preventDefault();
        instantHighlight =
          (instantHighlight - 1 + instantAnswers.length) % instantAnswers.length;
        return;
      }

      if (event.key === 'Escape') {
        event.preventDefault();
        instantDismissed = true;
        instantHighlight = -1;
        return;
      }

      if (event.key === 'Enter' && instantHighlight >= 0) {
        event.preventDefault();
        openInstantAnswer(instantAnswers[instantHighlight]);
        return;
      }
    }

    if (event.key !== 'Enter') {
      return;
    }

    if (event.shiftKey || event.altKey) {
      event.preventDefault();
      void onQueueTask();
      return;
    }

    event.preventDefault();
    onSubmit();
  }

  function clearQueuePress() {
    cancelQueuePress?.();
    cancelQueuePress = null;
  }

  function startQueuePress(event: PointerEvent) {
    if (event.button !== 0) {
      return;
    }

    clearQueuePress();
    queuePressTriggered = false;
    cancelQueuePress = scheduleAfter(520, () => {
      queuePressTriggered = true;
      queuePopoverOpen = true;
      cancelQueuePress = null;
    });
  }

  function handleSubmitPressEnd() {
    clearQueuePress();
  }

  function handleSubmitButtonClick(event: MouseEvent) {
    if (queuePressTriggered) {
      queuePressTriggered = false;
      event.preventDefault();
      event.stopPropagation();
      return;
    }

    queuePopoverOpen = false;
    searchRevealed = false;
    onSubmit();
  }

  function handleQueueTaskClick() {
    queuePopoverOpen = false;
    searchRevealed = false;
    void onQueueTask();
  }

  $effect(() => {
    if (!browser || !queuePopoverOpen) {
      return;
    }

    const handleWindowPointerDown = (event: PointerEvent) => {
      const target = event.target as HTMLElement | null;
      if (target?.closest('[data-part="queue-popover"], [data-part="exec-button"]')) {
        return;
      }

      queuePopoverOpen = false;
    };

    globalThis.addEventListener('pointerdown', handleWindowPointerDown);
    return () => {
      globalThis.removeEventListener('pointerdown', handleWindowPointerDown);
    };
  });

  function isImageFile(file: File): boolean {
    return file.type.startsWith('image/');
  }

  async function createPreview(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        resolve(event.target?.result as string);
      };
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsDataURL(file);
    });
  }

  async function handleFileChange(event: Event) {
    const target = event.currentTarget as HTMLInputElement | null;
    if (!target?.files || target.files.length === 0) {
      return;
    }

    const filesToProcess = Array.from(target.files);

    // Ensure placeholder is hidden when files are being attached
    if (!draft.description.trim()) {
      placeholderFocused = false;
    }

    // Generate previews for image files
    filesToProcess.forEach((file, i) => {
      if (isImageFile(file)) {
        createPreview(file)
          .then((dataUrl) => {
            filePreviews.set(i, dataUrl);
            filePreviews = new Map(filePreviews);
          })
          .catch((err) => {
            console.error('Failed to create preview:', err);
          });
      }
    });

    // Notify parent about the files
    onAttachFiles(filesToProcess);
    target.value = '';
  }

  function handleDeleteClick(order: OrderView, event: MouseEvent) {
    event.preventDefault();
    event.stopPropagation();
    onDeleteOrder(order, event);
  }

  function handleOpenOrderKeydown(order: OrderView, event: KeyboardEvent) {
    if (event.key !== 'Enter' && event.key !== ' ') {
      return;
    }

    event.preventDefault();
    onOpenOrder(order);
  }

  function handleTaskInputFocus() {
    inputMetaOpen = true;
    searchRevealed = true;
    placeholderFocused = true;
    stopPlaceholderAnimation({ hide: true });
  }

  function handleTaskInputBlur() {
    placeholderFocused = false;
    if (!draft.description.trim()) {
      resetPlaceholderAnimation();
      schedulePlaceholderTick(PLACEHOLDER_NEXT_DELAY_MS);
    }
  }

  function handleTaskInputPointerDown() {
    inputMetaOpen = true;
    searchRevealed = true;
    placeholderFocused = true;
    stopPlaceholderAnimation({ hide: true });
  }

  function handleCreateFocusOut(event: FocusEvent) {
    const currentTarget = event.currentTarget as HTMLElement;

    queueMicrotask(() => {
      if (!currentTarget.contains(document.activeElement)) {
        inputMetaOpen = false;
        instantHighlight = -1;
      }
    });
  }

  // Keep the composer menu open when its chips/pills are pressed: without this the
  // mousedown blurs the task input, focus falls outside the card, and
  // handleCreateFocusOut tears the whole menu down before the click can act.
  function keepComposerFocus(event: MouseEvent) {
    event.preventDefault();
  }

  // Same idea at the card level — prevents the task input from losing focus when
  // clicking non-focusable areas of widgets (weather, translator, proxy, music, …).
  // Interactive elements (inputs, buttons, links, tabindex) are allowed to receive
  // focus naturally — handleCreateFocusOut won't close the menu because those
  // elements are still inside the <article>.
  function cardMouseDown(event: MouseEvent) {
    const target = event.target as HTMLElement | null;
    if (target?.closest?.('input, textarea, select, button, a[href], [contenteditable], [tabindex]:not([tabindex="-1"])')) {
      return;
    }
    event.preventDefault();
  }

  function normalizeTag(value: string): string {
    return value.trim().replace(/^#+/, '').toLowerCase();
  }

  function commitTag(rawValue: string) {
    const normalizedTag = normalizeTag(rawValue);
    if (!normalizedTag) {
      tagInputValue = '';
      return;
    }

    const nextTags = Array.from(new Set([...(draft.tags ?? []), normalizedTag]));
    onTagsChange?.(nextTags);
    tagInputValue = '';
    tagEditorOpen = false;
  }

  $effect(() => {
    if (!tagEditorOpen || !tagInput) {
      return;
    }

    queueMicrotask(() => {
      tagInput?.focus();
    });
  });

  $effect(() => {
    if (!searchRevealed || !articleRef) return;

    function onDocumentMouseDown(e: MouseEvent) {
      if (!articleRef!.contains(e.target as Node)) {
        searchRevealed = false;
      }
    }
    document.addEventListener('mousedown', onDocumentMouseDown);
    return () => document.removeEventListener('mousedown', onDocumentMouseDown);
  });

  function removeTag(tag: string) {
    onTagsChange?.((draft.tags ?? []).filter((item) => item !== tag));
  }

  function handleTagInputKeydown(event: KeyboardEvent) {
    if (event.key === 'Enter' || event.key === ',' || event.key === 'Tab') {
      event.preventDefault();
      commitTag(tagInputValue);
      return;
    }

    if (event.key === 'Backspace' && !tagInputValue && (draft.tags?.length ?? 0) > 0) {
      event.preventDefault();
      removeTag(draft.tags[draft.tags.length - 1] ?? '');
      return;
    }

    if (event.key === 'Escape') {
      tagInputValue = '';
      tagEditorOpen = false;
    }
  }

</script>

{#if afeIntroCard && showHomeContent}
  <h1 class="lefine-title">Lefine</h1>
  <p class="lefine-subtitle">{afeIntroCard.detail}</p>
{/if}

<article bind:this={articleRef} class="kefine-card kefine-card--wide" data-kefine-create role="presentation" onfocusout={handleCreateFocusOut} onmousedown={cardMouseDown}>
  {#if template}
    <section data-part="template-banner">
      <lefine-box>
        <strong>{template.title}</strong>
        <p>{template.description || `Template by @${template.authorHandle}`}</p>
      </lefine-box>
      <lefine-box data-part="template-meta">
        <strong>@{template.authorHandle}</strong>
        <lefine-text>{template.pricingMode === 'percent' ? `${template.pricingValue}%` : `$${template.pricingValue.toFixed(2)}`}</lefine-text>
      </lefine-box>
    </section>
  {/if}

  {#if serviceSetup && template}
    <section data-part="service-setup-banner">
      <strong>{serviceSetup.title}</strong>
      <p>{serviceSetup.subtitle}</p>
    </section>
  {/if}

  {#if template && (draft.templateVariables?.length ?? 0) > 0}
    <section data-part="template-variables">
      {#each draft.templateVariables ?? [] as variable (`template-var-${variable.key}`)}
        <label data-part="template-variable-field">
          <lefine-text>{formatTemplateVariableLabel(variable.key)}</lefine-text>
          <input
            value={draft.templateVariableValues?.[variable.key] ?? variable.defaultValue ?? ''}
            placeholder={formatTemplateVariableLabel(variable.key)}
            oninput={(event) => onTemplateVariableChange?.(variable.key, (event.currentTarget as HTMLInputElement).value)}
          />
        </label>
      {/each}
    </section>
  {/if}



  {#if showTaskComposer}
  <fieldset data-part="exec-row" data-testid="kefine-create-form">
    <kefine-task-shell>
      <label data-part="sr-only" for="order-title">{title}</label>
      <textarea
        id="order-title"
        bind:this={taskTextarea}
        value={draft.description}
        data-part="task-input"
        data-empty={!draft.description.trim()}
        data-multiline={isMultilineDraft}
        readonly={Boolean(template && draft.templatePromptTemplate)}
        data-testid="kefine-task-input"
        data-size={getTaskFontSizeToken(titleFontSize)}
        aria-label={title}
        aria-describedby="kefine-composer-hints"
        placeholder=""
        rows="1"
        wrap={isMultilineDraft ? 'soft' : 'off'}
        onkeydown={handleTaskInputKeydown}
        oninput={(e) => {
          const target = e.currentTarget as HTMLTextAreaElement;
          onDescriptionChange?.(target.value);
          resizeTaskInput(target.value);
        }}
        onfocus={handleTaskInputFocus}
        onblur={handleTaskInputBlur}
        onpointerdown={handleTaskInputPointerDown}
      ></textarea>
      {#if !draft.description.trim()}
        <kefine-task-placeholder
          data-visible={placeholderVisible}
          data-size={getTaskFontSizeToken(titleFontSize)}
          aria-hidden="true"
        >
          {animatedPlaceholder}
        </kefine-task-placeholder>
      {/if}
    </kefine-task-shell>
    <button
      type="button"
      data-variant="primary"
      data-part="exec-button"
      data-testid="kefine-submit-task"
      aria-label={executeAria}
      aria-haspopup="dialog"
      aria-expanded={queuePopoverOpen}
      onclick={handleSubmitButtonClick}
      onpointerdown={startQueuePress}
      onpointerup={handleSubmitPressEnd}
      onpointerleave={handleSubmitPressEnd}
      onpointercancel={handleSubmitPressEnd}
    >
      <kefine-exec-arrow aria-hidden="true">➵</kefine-exec-arrow>
    </button>
    {#if queuePopoverOpen}
      <kefine-submit-popover data-part="queue-popover" role="dialog" aria-label={backgroundExecuteAria}>
        <button type="button" data-part="queue-popover-action" onclick={handleQueueTaskClick}>
          {backgroundExecuteAria}
        </button>
      </kefine-submit-popover>
    {/if}
  </fieldset>
  {/if}

  {#if showSearchPageInput}
    <kefine-search-page-input-shell>
      <KefineSearchInput
        value={draft.description}
        label={title}
        placeholder={placeholder}
        inputTestId="kefine-search-page-input"
        rowTestId="kefine-search-page-input-row"
        variant="page"
        showShortcut={false}
        focusRequest={searchFocusRequest}
        onInput={handleSearchPageInput}
        onKeydown={handleSearchPageKeydown}
      />
    </kefine-search-page-input-shell>
  {/if}

  {#if pinnedAnswers.length > 0}
    <kefine-pinned-strip data-part="pinned-strip" aria-label={instantPinnedLabel}>
      {#each pinnedAnswers as site (site.url)}
        <kefine-pinned-chip data-part="pinned-chip">
          <a
            href={site.url}
            target="_blank"
            rel="noopener noreferrer"
            data-part="pinned-chip-link"
            title={site.url}
          >
            <kefine-instant-icon data-part="pinned-icon" aria-hidden="true">
              {#if faviconUrl(site.url) && !failedFavicons.has(site.url)}
                <img
                  data-part="instant-favicon"
                  src={faviconUrl(site.url)}
                  alt=""
                  width="18"
                  height="18"
                  loading="lazy"
                  onerror={() => markFaviconFailed(site.url)}
                />
              {:else}
                <kefine-instant-emoji>{site.icon}</kefine-instant-emoji>
              {/if}
            </kefine-instant-icon>
            <lefine-text data-part="pinned-name">{site.name}</lefine-text>
          </a>
          <button
            type="button"
            data-part="pinned-remove"
            title={instantUnpinLabel}
            aria-label={instantUnpinLabel}
            onclick={() => togglePin(site.url)}
          >
            <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true">
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </kefine-pinned-chip>
      {/each}
    </kefine-pinned-strip>
  {/if}

  {#if instantAnswersOpen}
    <kefine-instant-answers
      data-part="instant-answers"
      role="listbox"
      aria-label={instantAnswersLabel}
    >
      {#each instantAnswers as site, index (site.url)}
        <kefine-instant-row
          data-part="instant-row"
          data-highlighted={index === instantHighlight}
        >
          <a
            href={site.url}
            target="_blank"
            rel="noopener noreferrer"
            data-part="instant-answer"
            role="option"
            aria-selected={index === instantHighlight}
            onclick={() => openInstantAnswer(site)}
            onpointerenter={() => { instantHighlight = index; }}
          >
            <kefine-instant-icon aria-hidden="true">
              {#if faviconUrl(site.url) && !failedFavicons.has(site.url)}
                <img
                  data-part="instant-favicon"
                  src={faviconUrl(site.url)}
                  alt=""
                  width="20"
                  height="20"
                  loading="lazy"
                  onerror={() => markFaviconFailed(site.url)}
                />
              {:else}
                <kefine-instant-emoji>{site.icon}</kefine-instant-emoji>
              {/if}
            </kefine-instant-icon>
            <kefine-instant-text>
              <lefine-text data-part="instant-name">{site.name}</lefine-text>
              <lefine-text data-part="instant-url">{site.url}</lefine-text>
              {#if site.description}
                <lefine-text data-part="instant-description" data-testid={`kefine-instant-description-${site.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`}>
                  {site.description}
                </lefine-text>
              {/if}
            </kefine-instant-text>
            <kefine-instant-go aria-hidden="true">{instantAnswerGoHint} ↗</kefine-instant-go>
          </a>
          <kefine-instant-actions data-part="instant-actions">
            <button
              type="button"
              data-part="instant-action"
              data-pinned={isPinned(site.url)}
              aria-pressed={isPinned(site.url)}
              title={isPinned(site.url) ? instantUnpinLabel : instantPinLabel}
              aria-label={isPinned(site.url) ? instantUnpinLabel : instantPinLabel}
              onclick={() => togglePin(site.url)}
            >
              <svg viewBox="0 0 24 24" width="16" height="16" fill={isPinned(site.url) ? 'currentColor' : 'none'} stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <path d="M9 4h6l-1 6 3 3v2H7v-2l3-3-1-6z" />
                <path d="M12 15v5" />
              </svg>
            </button>
            <button
              type="button"
              data-part="instant-action"
              aria-haspopup="menu"
              aria-expanded={instantMenuOpen === site.url}
              title={instantMenuLabel}
              aria-label={instantMenuLabel}
              onclick={() => toggleInstantMenu(site.url)}
            >
              <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" aria-hidden="true">
                <circle cx="5" cy="12" r="1.8" />
                <circle cx="12" cy="12" r="1.8" />
                <circle cx="19" cy="12" r="1.8" />
              </svg>
            </button>
            {#if instantMenuOpen === site.url}
              <kefine-instant-menu data-part="instant-menu" role="menu" aria-label={instantMenuLabel}>
                <button type="button" data-part="instant-menu-item" role="menuitem" onclick={() => openQrCard(site)}>
                  {instantQrLabel}
                </button>
                <button type="button" data-part="instant-menu-item" role="menuitem" onclick={() => viewWithAgent(site)}>
                  {instantAgentLabel}
                </button>
                <button type="button" data-part="instant-menu-item" role="menuitem" onclick={() => addToProject(site)}>
                  {instantAddProjectLabel}
                </button>
              </kefine-instant-menu>
            {/if}
          </kefine-instant-actions>
        </kefine-instant-row>
      {/each}
    </kefine-instant-answers>
  {/if}

  {#if qrSite}
    <kefine-qr-card data-part="qr-card" role="dialog" aria-label={qrSite.name}>
      <lefine-text data-part="qr-name">{qrSite.name}</lefine-text>
      <kefine-qr-frame data-part="qr-image">
        {#if qrMatrix}
          <svg viewBox={qrViewBox} role="img" aria-label={qrSite.name} preserveAspectRatio="xMidYMid meet">
            <path d={qrPath} fill="currentColor" shape-rendering="crispEdges"></path>
          </svg>
        {/if}
      </kefine-qr-frame>
      <lefine-text data-part="qr-url">{qrSite.url}</lefine-text>
      <button type="button" data-part="qr-download" onclick={downloadQr}>
        {instantQrDownloadLabel}
      </button>
    </kefine-qr-card>
  {/if}

  {#if showTaskComposer}
    {#if inputMetaOpen}
      <kefine-input-meta data-part="input-meta">
        <kefine-composer-strip aria-label={composerHints}>
          <button type="button" data-part="composer-chip" title={backgroundExecuteAria} onmousedown={keepComposerFocus} onclick={() => fileInput?.click()}>
            <lefine-text>{addFileLabel}</lefine-text>
            {#if draft.files.length > 0}
              <strong>{fileCountLabel(draft.files.length)}</strong>
            {/if}
          </button>
          {#if executionEditorOpen}
            <kefine-execution-editor>
              <input
                value={draft.executionEstimate}
                data-part="execution-estimate-input"
                placeholder={executionEstimateLabel}
                oninput={(e) => onExecutionEstimateChange?.((e.currentTarget as HTMLInputElement).value)}
              />
            </kefine-execution-editor>
          {:else}
            <button type="button" data-part="composer-chip" onmousedown={keepComposerFocus} onclick={() => { executionEditorOpen = true; }}>
              <lefine-text>{addExecutionEstimateLabel}</lefine-text>
            </button>
          {/if}
          {#if tagEditorOpen}
            <input
              bind:this={tagInput}
              bind:value={tagInputValue}
              data-part="tag-input"
              placeholder={tagPlaceholderLabel}
              maxlength="32"
              onkeydown={handleTagInputKeydown}
              onblur={() => {
                if (tagInputValue.trim()) {
                  commitTag(tagInputValue);
                  return;
                }

                tagEditorOpen = false;
              }}
            />
          {:else}
            <button type="button" data-part="composer-chip" data-part-tag="true" onmousedown={keepComposerFocus} onclick={() => { tagEditorOpen = true; }}>
              <lefine-text>{addTagLabel}</lefine-text>
            </button>
          {/if}
        </kefine-composer-strip>

        {#if (draft.tags?.length ?? 0) > 0}
          <kefine-tag-strip data-has-tags="true">
            {#each draft.tags ?? [] as tag (`tag-${tag}`)}
              <button type="button" data-part="tag-pill" onmousedown={keepComposerFocus} onclick={() => removeTag(tag)} aria-label={removeTagLabel(tag)}>
                <lefine-text>#{tag}</lefine-text>
                <strong>×</strong>
              </button>
            {/each}
          </kefine-tag-strip>
        {/if}

        {#if (draft.templateFiles?.length ?? 0) > 0}
          <kefine-file-list data-template-files="true">
            {#each draft.templateFiles ?? [] as file (`template-${file.id}`)}
              <lefine-box data-part="template-file-pill">
                <lefine-text>{file.name}</lefine-text>
                <strong>{Math.max(1, Math.round((file.size ?? 1024) / 1024))} KB</strong>
              </lefine-box>
            {/each}
          </kefine-file-list>
        {/if}

        {#if draft.files.length > 0}
          <kefine-file-list>
            {#each draft.files as file, index (`${file.name}-${file.size}-${index}`)}
              <button type="button" data-part="file-pill" onmousedown={keepComposerFocus} onclick={() => onRemoveFile(index)}>
                {#if isImageFile(file) && filePreviews.has(index)}
                  <lefine-box data-part="file-preview-wrapper">
                    <img
                      src={filePreviews.get(index)}
                      alt={file.name}
                      data-part="file-preview"
                    />
                  </lefine-box>
                {/if}
                <lefine-text>{file.name}</lefine-text>
                <strong>{Math.max(1, Math.round(file.size / 1024))} KB</strong>
              </button>
            {/each}
          </kefine-file-list>
        {/if}
      </kefine-input-meta>
    {/if}

    <input bind:this={fileInput} data-part="file-input" type="file" multiple onchange={handleFileChange} />
    <p id="kefine-composer-hints" data-part="composer-hints" hidden>{composerHints}</p>
  {/if}

  <!-- Proxy/VPN configuration preview — appears above the task history while typing -->
  <KefineProxyConfigWidget active={proxyIntentActive} />

  <!-- Weather instant answer — appears for prompts such as "Погода Гомель" -->
  <KefineWeatherWidget active={weatherIntentActive} query={draft.description} />

  <!-- Translator instant answer — appears for prompts such as "Перевод с китайского на английский" -->
  <KefineTranslatorWidget active={translationIntentActive} query={draft.description} />

  <!-- Extracted-music preview — appears when the draft reads like "extract audio from video" -->
  <KefineMusicWidget active={musicIntentActive} />

  {#if showTaskHistory}
    <!-- Persistent task history on main page (same data as in profile) -->
    {#if (solverSearchActive && solverSearchText?.trim()) || (searchRevealed && recentOrders.length > 0)}
      <section data-part="tasks-list" data-entrance={!listEntranceDone}>
      {#if solverSearchActive && solverSearchText?.trim() && !activeSearchDuplicate}
        <kefine-task-history-item
          data-testid="kefine-solver-search-row"
          style="animation-delay: 0ms;"
        >
          <a
            href={searchResultHref}
            style="text-decoration:none; color:inherit; display:block;"
          >
            <kefine-solver-search-row aria-live="polite" data-state={taskCompleted ? 'completed' : 'in-progress'}>
              <lefine-text>{solverSearchText}</lefine-text>
              {#if taskCompleted}
                <kefine-task-branch>
                  <kefine-task-branch-name>{completedBranchLabel(solverSearchText, taskCompleted)}</kefine-task-branch-name>
                  <lef-cp-branch-icon>
                    <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                      <line x1="6" y1="3" x2="6" y2="15"></line>
                      <circle cx="6" cy="18" r="3"></circle>
                      <circle cx="18" cy="6" r="3"></circle>
                      <path d="M18 9a9 9 0 0 1-9 9"></path>
                    </svg>
                  </lef-cp-branch-icon>
                </kefine-task-branch>
              {/if}
              {#if isFlying}
                <lef-arrow-wrapper>
                  <lef-wind-flow>
                    <lef-wind-line></lef-wind-line>
                    <lef-wind-line></lef-wind-line>
                  </lef-wind-flow>
                  <lef-flying-arrow>➵</lef-flying-arrow>
                </lef-arrow-wrapper>
              {/if}

              <kefine-solver-search-indicator aria-label={taskCompleted ? solverSearchCompletedLabel : solverSearchLabel} title={taskCompleted ? solverSearchCompletedLabel : solverSearchLabel} data-completed={taskCompleted}>
                <kefine-solver-search-dot aria-hidden="true"></kefine-solver-search-dot>
              </kefine-solver-search-indicator>
            </kefine-solver-search-row>
          </a>
          {#if shouldShowSolverList(solverSearchText, taskCompleted)}
            <kefine-task-history-actions>
              <a
                role="button"
                data-part="open-solvers"
                href={searchResultHref}
                onmousedown={keepComposerFocus}
                onclick={(event) => openSolverList(event, searchResultHref)}
              >
                Open solver list
              </a>
            </kefine-task-history-actions>
          {/if}
        </kefine-task-history-item>
      {/if}
      {#each filteredRecentOrders as order, i (order.id)}
        {@const isDuplicate = activeSearchDuplicate?.id === order.id}
        {@const inProgress = isDuplicate && solverSearchActive && !taskCompleted}
        {@const orderHref = orderTaskHref(order)}
        <kefine-task-history-item
          data-testid={isDuplicate && !order.id.startsWith('temp-') ? 'kefine-solver-search-row' : null}
          style="animation-delay: {i * 78}ms;"
          data-order-id={order.id}
          data-status={order.status}
          data-active-task={isDuplicate ? 'true' : null}
        >
          <a
            href={orderHref}
            data-testid={`kefine-open-order-${order.id}`}
            style="text-decoration:none; color:inherit; display:block;"
            onmousedown={keepComposerFocus}
            onclick={(event) => openSolverList(event, orderHref)}
          >
            <kefine-solver-search-row aria-live="polite" data-state={inProgress ? 'in-progress' : 'completed'}>
              <lefine-text>{order.title}</lefine-text>

              {#if order.executionEstimate}
                <lefine-text data-part="task-estimate" data-testid={`kefine-order-eta-${order.id}`}>
                  {order.executionEstimate}
                </lefine-text>
              {/if}

              <kefine-task-branch>
                  <kefine-task-branch-name>{completedBranchLabel(order.title, !inProgress)}</kefine-task-branch-name>
                  <lef-cp-branch-icon>
                    <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                      <line x1="6" y1="3" x2="6" y2="15"></line>
                      <circle cx="6" cy="18" r="3"></circle>
                      <circle cx="18" cy="6" r="3"></circle>
                      <path d="M18 9a9 9 0 0 1-9 9"></path>
                    </svg>
                  </lef-cp-branch-icon>
                </kefine-task-branch>

              {#if inProgress && isFlying}
                <lef-arrow-wrapper>
                  <lef-wind-flow>
                    <lef-wind-line></lef-wind-line>
                    <lef-wind-line></lef-wind-line>
                  </lef-wind-flow>
                  <lef-flying-arrow>➵</lef-flying-arrow>
                </lef-arrow-wrapper>
              {/if}

              <kefine-solver-search-indicator
                aria-label={inProgress ? solverSearchLabel : solverSearchCompletedLabel}
                title={inProgress ? solverSearchLabel : solverSearchCompletedLabel}
                data-completed={!inProgress}
              >
                <kefine-solver-search-dot aria-hidden="true"></kefine-solver-search-dot>
              </kefine-solver-search-indicator>
            </kefine-solver-search-row>
          </a>
          <kefine-task-history-actions>
            {#if shouldShowSolverList(order.title, !inProgress)}
              <a
                role="button"
                data-part="open-solvers"
                href={orderSolutionsHref(order)}
                onmousedown={keepComposerFocus}
                onclick={(event) => openSolverList(event, orderSolutionsHref(order))}
              >
                Open solver list
              </a>
            {/if}
            {#if onStopOrder && order.status !== 'stopped' && order.status !== 'completed' && order.status !== 'done'}
              <button
                type="button"
                data-part="stop-task"
                data-testid={`kefine-stop-order-${order.id}`}
                aria-label={`${stopTaskLabel}: ${order.title}`}
                title={stopTaskLabel}
                onmousedown={keepComposerFocus}
                onclick={(event) => onStopOrder?.(order, event)}
                onpointerup={(event) => {
                  if (event.pointerType === 'touch') {
                    onStopOrder?.(order, event);
                  }
                }}
              >
                <lefine-text aria-hidden="true"></lefine-text>
              </button>
            {/if}
          </kefine-task-history-actions>
        </kefine-task-history-item>
      {/each}
      </section>
    {/if}
  {/if}

  {#if isSearching && (sortedMatchedOrders.length > 0 || searchMode)}
    <section
      data-part="recent"
      data-testid={searchMode ? 'kefine-search-page-results' : null}
      data-mode={searchMode}
      aria-label={isSearching ? matchedTasksLabel : solverLabel}
    >
      {#if !searchMode}
        <kefine-recent-title>{matchedTasksLabel}</kefine-recent-title>
      {/if}
      {#if sortedMatchedOrders.length > 0}
        <ul data-part="recent-list" data-compact="true" data-testid="kefine-search-results">
          {#each sortedMatchedOrders as order, i (order.id)}
            <li transition:taskDropIn={{ delay: i * 78 }} style="list-style:none;">
              <KefineOrderListItem
                {order}
                {openTaskLabel}
                {relatedItemsLabel}
                {createServiceLabel}
                {serviceVariablesLabel}
                {deleteTaskLabel}
                showCreateService={false}
                showDelete={true}
                compact={Boolean(searchMode)}
                searchQuery={draft.description}
                itemTestId={`kefine-search-order-${order.id}`}
                openTestId={`kefine-open-search-order-${order.id}`}
                deleteTestId={`kefine-delete-search-order-${order.id}`}
                onOpen={() => onOpenOrder(order)}
                onCreateService={(event) => onCreateServiceFromOrder?.(order, event)}
                onOpenKeydown={(event) => handleOpenOrderKeydown(order, event)}
                onDelete={(event) => handleDeleteClick(order, event)}
              />
            </li>
          {/each}
        </ul>
      {:else if searchMode}
        <kefine-search-results-empty
          data-testid="kefine-search-create-hint"
          data-variant="create-hint"
        >
          <lefine-text>{searchCreateTaskHint(draft.description.trim())}</lefine-text>
        </kefine-search-results-empty>
      {:else}
        <kefine-search-results-empty data-testid="kefine-search-results-empty">
          <lefine-text>{searchResultsEmptyLabel}</lefine-text>
        </kefine-search-results-empty>
      {/if}
    </section>
  {/if}
</article>

{#if showHomeContent && pinnedServices.length > 0}
  <lef-services-showcase>
    <lef-services-head>
      <strong>{pinnedServicesTitle}</strong>
      <p>{pinnedServicesSubtitle}</p>
    </lef-services-head>

    <lef-services-list>
      {#each pinnedServices as service (service.id)}
        <lef-service-card href={service.href}>
          {#if service.imageDataUrl}
            <lef-service-card-image src={service.imageDataUrl} alt=""></lef-service-card-image>
          {:else}
            <lef-service-card-icon data-accent={getServiceAccentToken(service.title)} aria-hidden="true">
              <lefine-text>{getServiceInitial(service.title)}</lefine-text>
            </lef-service-card-icon>
          {/if}

          <lef-service-card-copy>
            <strong>{service.title}</strong>
            <p>{service.description}</p>
            <lefine-text>@{service.authorHandle}</lefine-text>
          </lef-service-card-copy>
        </lef-service-card>
      {/each}
    </lef-services-list>
  </lef-services-showcase>
{/if}

{#if showHomeContent}
  {#if afeIntroCard}
    <lef-afe-showcase-heading>{afeIntroCard.title}</lef-afe-showcase-heading>
  {/if}

<lef-afe-showcase>
  <lef-afe-layout>
    <lef-afe-steps>
      <lef-afe-flow aria-label={afe.title}>
        <lef-afe-diagram>
          <lef-afe-node-round>
            <strong>{afe.labels.input}</strong>
          </lef-afe-node-round>

          {#if afeStepCards[0]}
            <lef-afe-link-in aria-hidden="true">
              <lefine-text>{afe.labels.intake}</lefine-text>
            </lef-afe-link-in>
            <lef-afe-node-step>
              <lef-afe-step-head>
                <strong>{afeStepCards[0].title}</strong>
                <lef-brief-writing aria-hidden="true">
                  <lef-brief-sheet>
                    <lef-brief-sheet-line></lef-brief-sheet-line>
                    <lef-brief-sheet-line></lef-brief-sheet-line>
                    <lef-brief-sheet-line></lef-brief-sheet-line>
                  </lef-brief-sheet>
                </lef-brief-writing>
              </lef-afe-step-head>
              {#if afeStepCards[0].detail}
                <p>{afeStepCards[0].detail}</p>
              {/if}
            </lef-afe-node-step>
          {/if}

          {#if afeStepCards[1]}
            <lef-afe-link-route aria-hidden="true">
              <lefine-text>{afe.labels.route}</lefine-text>
            </lef-afe-link-route>
            <lef-afe-node-step>
              <lef-afe-step-head>
                <strong>{afeStepCards[1].title}</strong>
                <lef-quote-box-pick aria-hidden="true">
                  <lef-quote-doc-chip>
                    <lef-quote-doc-line></lef-quote-doc-line>
                    <lef-quote-doc-line></lef-quote-doc-line>
                  </lef-quote-doc-chip>
                  <lef-quote-box></lef-quote-box>
                  <lef-quote-box></lef-quote-box>
                  <lef-quote-box data-selected="true"></lef-quote-box>
                </lef-quote-box-pick>
              </lef-afe-step-head>
              {#if afeStepCards[1].detail}
                <p>{afeStepCards[1].detail}</p>
              {/if}
            </lef-afe-node-step>
          {/if}

          <lef-afe-link-out aria-hidden="true">
            <lefine-text>{afe.labels.result}</lefine-text>
          </lef-afe-link-out>
          <lef-afe-node-round>
            <strong>{afeStepCards[2]?.title ?? afe.labels.delivery}</strong>
            <lef-delivery-pack aria-hidden="true">
              <lef-delivery-pack-doc></lef-delivery-pack-doc>
              <lef-delivery-pack-box></lef-delivery-pack-box>
              <lef-delivery-pack-lid></lef-delivery-pack-lid>
            </lef-delivery-pack>
          </lef-afe-node-round>
        </lef-afe-diagram>
      </lef-afe-flow>
    </lef-afe-steps>
  </lef-afe-layout>
</lef-afe-showcase>
{/if}

<style>
  @keyframes kefine-task-drop-in {
    0% {
      opacity: 0;
      transform: translateY(-14px) scale(1.085);
    }
    100% {
      opacity: 1;
      transform: translateY(0) scale(1);
    }
  }

  [data-kefine-create] {
    /* Shared leading inset of the search-input text; mirrored at each breakpoint
       so the pinned chips and instant-answer rows stay on the same left rail. */
    --kef-task-pad-inline: clamp(0.72rem, 2.5vw, 0.92rem);
    grid-template-rows: auto auto auto minmax(0, auto);
    align-content: start;
    gap: 0.62rem;
    width: min(100%, calc(100vw - 7rem));
    max-width: 64rem;
    justify-self: center;
    margin-inline: auto;
    border: 0;
    box-shadow: none;
    background: none;
  }

  lef-afe-showcase {
    display: block;
    width: min(100%, calc(100vw - 7rem));
    max-width: 64rem;
    justify-self: center;
    margin-inline: auto;
  }

  lef-afe-showcase-heading {
    display: block;
    width: min(100%, calc(100vw - 7rem));
    max-width: 64rem;
    justify-self: center;
    margin: var(--kef-space-3) auto 0;
    color: var(--lefine-text);
    font-size: clamp(1.15rem, 2vw, 1.55rem);
    font-weight: 740;
    line-height: 1.08;
    text-align: center;
  }

  lef-afe-layout {
    display: grid;
    gap: 0.55rem;
  }

  .lefine-title,
  .lefine-subtitle {
    width: min(100%, calc(100vw - 7rem));
    max-width: 44rem;
    justify-self: center;
    margin-inline: auto;
    text-align: center;
  }

  .lefine-title {
    margin-block: 0 0.18rem;
    color: var(--lefine-text);
    font-size: clamp(2.65rem, 7.2vw, 5.8rem);
    font-weight: 760;
    line-height: 0.95;
  }

  .lefine-subtitle {
    margin-block: 0 0.8rem;
    color: var(--lefine-text-soft);
    font-size: clamp(0.84rem, 1.3vw, 0.98rem);
    line-height: 1.35;
  }

  lef-services-showcase {
    display: grid;
    width: min(100%, calc(100vw - 7rem));
    max-width: 64rem;
    justify-self: center;
    margin-inline: auto;
    display: grid;
    gap: 0.7rem;
    padding: 0.95rem 1rem 1rem;
    border-radius: var(--kef-radius-ui);
    background: color-mix(in oklab, var(--kef-bg-card) 90%, var(--kef-bg-soft) 10%);
    border: 0;
    box-shadow: none;
  }

  lef-services-head,
  lef-services-list,
  lef-service-card,
  lef-service-card-copy {
    display: grid;
    gap: 0.75rem;
  }

  lef-services-head {
    gap: 0.28rem;
  }

  lef-services-head strong {
    font-size: clamp(0.98rem, 1.3vw, 1.1rem);
    letter-spacing: -0.02em;
  }

  lef-services-head p,
  lef-services-head strong,
  lef-service-card-copy p,
  lef-service-card-copy strong,
  lef-service-card-copy lefine-text {
    margin: 0;
  }

  lef-services-head p,
  lef-service-card-copy p,
  lef-service-card-copy lefine-text {
    color: var(--lefine-text-soft);
  }

  lef-services-head p {
    max-width: 28rem;
    font-size: 0.8rem;
  }

  lef-services-list {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 0.8rem;
    justify-items: start;
  }

  lef-service-card {
    display: grid;
    grid-template-columns: auto minmax(0, 1fr);
    align-items: start;
    gap: 0.6rem;
    width: min(100%, 18rem);
    min-height: 7.4rem;
    padding: 0.85rem 0.9rem;
    border-radius: var(--kef-radius-ui);
    background: color-mix(in oklab, var(--kef-bg-card) 94%, var(--kef-bg) 6%);
    border: 0;
    box-shadow: none;
    color: inherit;
    text-decoration: none;
  }

  lef-service-card-image,
  lef-service-card-icon {
    display: block;
    width: 2.1rem;
    height: 2.1rem;
    border-radius: var(--kef-radius-ui);
    flex: 0 0 auto;
  }

  lef-service-card-image {
    object-fit: cover;
  }

  lef-service-card-icon {
    display: grid;
    place-items: center;
    color: color-mix(in oklab, white 88%, var(--kef-bg-card));
  }

  lef-service-card-icon {
    font-size: 0.8rem;
    font-weight: 700;
    line-height: 1;
  }

  lef-service-card-icon[data-accent='gold'] {
    background:
      linear-gradient(180deg, color-mix(in oklab, #d6a23d 72%, var(--kef-bg-soft)), color-mix(in oklab, #d6a23d 84%, black 16%));
    border: 0;
  }

  lef-service-card-icon[data-accent='coral'] {
    background:
      linear-gradient(180deg, color-mix(in oklab, #d86c4b 72%, var(--kef-bg-soft)), color-mix(in oklab, #d86c4b 84%, black 16%));
    border: 0;
  }

  lef-service-card-icon[data-accent='rose'] {
    background:
      linear-gradient(180deg, color-mix(in oklab, #cf5b7c 72%, var(--kef-bg-soft)), color-mix(in oklab, #cf5b7c 84%, black 16%));
    border: 0;
  }

  lef-service-card-icon[data-accent='plum'] {
    background:
      linear-gradient(180deg, color-mix(in oklab, #7f59c9 72%, var(--kef-bg-soft)), color-mix(in oklab, #7f59c9 84%, black 16%));
    border: 0;
  }

  lef-service-card-icon[data-accent='sky'] {
    background:
      linear-gradient(180deg, color-mix(in oklab, #4d8fd8 72%, var(--kef-bg-soft)), color-mix(in oklab, #4d8fd8 84%, black 16%));
    border: 0;
  }

  lef-service-card-icon[data-accent='teal'] {
    background:
      linear-gradient(180deg, color-mix(in oklab, #2f9d88 72%, var(--kef-bg-soft)), color-mix(in oklab, #2f9d88 84%, black 16%));
    border: 0;
  }

  lef-service-card-copy {
    min-width: 0;
    gap: 0.2rem;
  }

  lef-service-card-copy strong {
    font-size: 0.92rem;
    letter-spacing: -0.01em;
  }

  lef-service-card-copy p {
    line-height: 1.35;
    font-size: 0.82rem;
    line-clamp: 2;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  lef-service-card:hover {
    background: color-mix(in oklab, var(--kef-bg-card) 88%, var(--kef-bg-soft));
  }

  lef-afe-flow {
    --afe-ink: #23170f;
    --afe-ink-soft: #332419;
    --afe-ink-muted: #3b2819;
    --afe-edge: #2f2015;
    --afe-edge-soft: #7a5a37;
    --afe-edge-warm: #8f6a43;
    --afe-paper: #ecd9b2;
    --afe-paper-deep: #dcc292;
    --afe-paper-note: #f8ebca;
    --afe-paper-sheet: #f7e7c5;
    --afe-paper-fold: #f3dfb6;
    --afe-paper-highlight: #fff8ea;
    --afe-feather: #4a3220;
    --afe-feather-mid: #6d4b2f;
    --afe-feather-light: #8c6945;
    --afe-quill-spine: #f4e3bf;
    --afe-quill-shaft: #24170f;
    --afe-quill-shaft-end: #5a3f28;
    --afe-quill-nib: #170e09;
    --afe-quill-nib-end: #38261a;
    --afe-box: #e8cd9d;
    --afe-box-lid: #edd6ab;
    --afe-box-deep: #d7b576;
    --afe-pack-box: #e4c794;
    --afe-pack-box-deep: #cda869;
    --afe-accepted: #dbe7c9;
    --afe-accepted-deep: #b8ce97;
    --afe-accepted-ink: #3b5b31;
    --afe-accepted-glow: #8fb07f;
    --afe-wash-a: #8d6438;
    --afe-wash-b: #7b542d;
    --afe-grain: #6e4d2b;
    --afe-speck: #5d4025;
    --afe-shadow: #4d3522;
    --afe-shadow-deep: #7f5d35;
    position: relative;
    display: grid;
    gap: 1rem;
    width: 100%;
    min-width: 0;
    padding: clamp(1rem, 2vw, 1.5rem);
    border-radius: 1.35rem;
    border: 0;
    background:
      radial-gradient(circle at 18% 22%, color-mix(in oklab, var(--afe-wash-a) 8%, transparent), transparent 18%),
      radial-gradient(circle at 82% 76%, color-mix(in oklab, var(--afe-wash-b) 7%, transparent), transparent 20%),
      color-mix(in oklab, var(--afe-paper) 92%, var(--afe-paper-deep) 8%);
    box-shadow:
      inset 0 0 40px color-mix(in oklab, var(--afe-wash-a) 4%, transparent),
      0 10px 20px color-mix(in oklab, var(--afe-shadow-deep) 6%, transparent);
    overflow: hidden;
  }

  lef-afe-flow::before {
    content: '';
    position: absolute;
    inset: 0;
    background:
      repeating-linear-gradient(
        0deg,
        color-mix(in oklab, var(--afe-grain) 3.2%, transparent) 0 2px,
        transparent 2px 8px
      ),
      repeating-linear-gradient(
        90deg,
        color-mix(in oklab, var(--afe-grain) 2.6%, transparent) 0 3px,
        transparent 3px 11px
      ),
      radial-gradient(circle at 20% 24%, color-mix(in oklab, var(--afe-speck) 8%, transparent) 0 1px, transparent 1.2px),
      radial-gradient(circle at 72% 68%, color-mix(in oklab, var(--afe-speck) 7%, transparent) 0 1px, transparent 1.2px);
    background-size: auto, auto, 24px 24px, 32px 32px;
    mix-blend-mode: multiply;
    opacity: 0.72;
    pointer-events: none;
  }

  lef-afe-flow::after {
    content: '';
    position: absolute;
    inset: 0;
    border-radius: inherit;
    box-shadow: none;
    pointer-events: none;
  }

  lef-afe-diagram {
    position: relative;
    z-index: 1;
    display: grid;
    width: 100%;
    min-width: 0;
    grid-template-columns:
      minmax(4.8rem, 5.8rem)
      minmax(2rem, 0.42fr)
      minmax(0, 1.1fr)
      minmax(2rem, 0.42fr)
      minmax(0, 1.1fr)
      minmax(2rem, 0.42fr)
      minmax(4.8rem, 5.8rem);
    grid-template-rows: auto auto;
    align-items: center;
    column-gap: clamp(0.45rem, 1vw, 0.8rem);
    row-gap: 0.9rem;
  }

  lef-afe-node-round,
  lef-afe-node-step,
  lef-afe-node-round strong,
  lef-afe-node-step strong,
  lef-afe-node-step p,
  lef-afe-step-head,
  lef-afe-link-in lefine-text,
  lef-afe-link-route lefine-text,
  lef-afe-link-out lefine-text {
    margin: 0;
  }

  lef-afe-node-round,
  lef-afe-node-step {
    position: relative;
    display: grid;
    min-width: 0;
    color: var(--afe-ink);
    background: color-mix(in oklab, var(--afe-paper) 94%, var(--afe-paper-deep) 6%);
  }

  lef-afe-node-round {
    place-items: center;
    width: clamp(4.6rem, 8vw, 5.7rem);
    aspect-ratio: 1;
    border-radius: 999px;
    border: 0;
    box-shadow: none;
    transform: rotate(-3deg);
  }

  lef-afe-node-round strong {
    font-size: 0.94rem;
    font-weight: 700;
    letter-spacing: -0.01em;
    color: var(--afe-ink);
  }

  lef-afe-node-step {
    align-content: start;
    justify-items: start;
    min-height: 8.4rem;
    padding: 0.9rem 1rem 0.95rem;
    border-radius: 0.95rem;
    border: 0;
    box-shadow: 0 8px 18px color-mix(in oklab, var(--afe-shadow) 5%, transparent);
    transform: rotate(-0.6deg);
    overflow: hidden;
  }

  lef-afe-node-step strong {
    font-size: 1rem;
    font-weight: 760;
    line-height: 1.15;
    letter-spacing: -0.02em;
    color: var(--afe-ink);
  }

  lef-afe-step-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.85rem;
    width: 100%;
  }

  lef-afe-node-step p {
    margin-top: 0.45rem;
    font-size: 0.84rem;
    line-height: 1.45;
    color: color-mix(in oklab, var(--afe-ink-soft) 96%, var(--afe-edge-soft) 4%);
  }

  lef-brief-writing {
    position: relative;
    display: block;
    width: 2.35rem;
    height: 2.2rem;
    overflow: hidden;
    flex: 0 0 auto;
  }

  lef-brief-sheet {
    position: absolute;
    inset: 0.62rem 0.24rem 0.12rem 0.38rem;
    display: grid;
    align-content: center;
    gap: 0.22rem;
    padding: 0.34rem 0.34rem 0.28rem;
    border: 2px solid color-mix(in oklab, var(--afe-edge) 70%, transparent);
    border-radius: 0.36rem 0.5rem 0.42rem 0.46rem;
    background: color-mix(in oklab, var(--afe-paper-note) 92%, white 8%);
    box-shadow: 0 4px 10px color-mix(in oklab, var(--afe-shadow) 5%, transparent);
    transform: rotate(4deg);
    opacity: 0.9;
    overflow: hidden;
  }

  lef-brief-sheet-line {
    display: block;
    height: 2px;
    border-radius: 999px;
    background: color-mix(in oklab, var(--afe-ink-muted) 82%, transparent);
    justify-self: start;
    transform-origin: left center;
    animation: kefine-brief-writing 3.2s ease-in-out infinite;
  }

  lef-brief-sheet-line:nth-child(1) {
    width: 78%;
    animation-delay: 0.1s;
  }

  lef-brief-sheet-line:nth-child(2) {
    width: 92%;
    animation-delay: 0.45s;
  }

  lef-brief-sheet-line:nth-child(3) {
    width: 66%;
    animation-delay: 0.8s;
  }

  lef-quote-box-pick {
    position: relative;
    display: flex;
    align-items: flex-end;
    gap: 0.22rem;
    min-width: 3.6rem;
    height: 2.1rem;
    padding: 0.1rem 0 0;
    flex: 0 0 auto;
  }

  lef-quote-doc-chip,
  lef-quote-doc-line,
  lef-quote-box,
  lef-delivery-pack,
  lef-delivery-pack-doc,
  lef-delivery-pack-box,
  lef-delivery-pack-lid {
    display: block;
  }

  lef-quote-doc-chip {
    position: absolute;
    top: 0.02rem;
    left: 0.08rem;
    width: 0.9rem;
    height: 1.08rem;
    padding: 0.18rem 0.14rem;
    border: 1.6px solid color-mix(in oklab, #2f2015 68%, transparent);
    border-radius: 0.14rem 0.24rem 0.16rem 0.16rem;
    background: color-mix(in oklab, #f7e7c5 96%, white 4%);
    box-shadow: 0 3px 8px color-mix(in oklab, #4d3522 7%, transparent);
    transform: rotate(-8deg);
    animation: kefine-quote-doc-select 4.8s cubic-bezier(0.22, 0.7, 0.2, 1) infinite;
    z-index: 2;
  }

  lef-quote-doc-chip::before {
    content: '';
    position: absolute;
    top: -0.02rem;
    right: -0.02rem;
    width: 0.28rem;
    height: 0.28rem;
    border-top: 1.6px solid color-mix(in oklab, #2f2015 58%, transparent);
    border-right: 1.6px solid color-mix(in oklab, #2f2015 58%, transparent);
    background: color-mix(in oklab, #f3dfb6 92%, white 8%);
    clip-path: polygon(100% 0, 0 0, 100% 100%);
  }

  lef-quote-doc-line {
    height: 2px;
    border-radius: 999px;
    background: color-mix(in oklab, #3b2819 76%, transparent);
    opacity: 0.82;
  }

  lef-quote-doc-line:first-child {
    width: 72%;
  }

  lef-quote-doc-line:last-child {
    width: 86%;
    margin-top: 0.14rem;
  }

  lef-quote-box {
    position: relative;
    width: 0.92rem;
    height: 0.7rem;
    border: 2px solid color-mix(in oklab, #2f2015 64%, transparent);
    border-radius: 0.18rem;
    background: color-mix(in oklab, #e8cd9d 92%, #d7b576 8%);
    box-shadow: 0 3px 8px color-mix(in oklab, #4d3522 5%, transparent);
    animation: kefine-quote-box-idle 4.8s ease-in-out infinite;
  }

  lef-quote-box::before {
    content: '';
    position: absolute;
    top: -0.18rem;
    left: 0.08rem;
    right: 0.08rem;
    height: 0.22rem;
    border: 2px solid color-mix(in oklab, #2f2015 60%, transparent);
    border-bottom: 0;
    border-radius: 0.18rem 0.18rem 0 0;
    background: color-mix(in oklab, #edd6ab 90%, #d7b576 10%);
  }

  lef-quote-box:nth-child(2) {
    animation-delay: 0s;
  }

  lef-quote-box:nth-child(3) {
    animation-delay: 1.1s;
  }

  lef-quote-box:nth-child(4) {
    animation-delay: 2.2s;
  }

  lef-quote-box[data-selected='true'] {
    background: color-mix(in oklab, #dbe7c9 82%, #b8ce97 18%);
    border-color: color-mix(in oklab, #3b5b31 62%, transparent);
    box-shadow:
      inset 0 0 0 1px color-mix(in oklab, white 22%, transparent),
      0 0 0 1px color-mix(in oklab, #8fb07f 10%, transparent);
  }

  lef-delivery-pack {
    position: absolute;
    bottom: 0.7rem;
    left: 50%;
    width: 1.55rem;
    height: 1.05rem;
    transform: translateX(-50%);
    overflow: hidden;
  }

  lef-delivery-pack-doc {
    position: absolute;
    left: 50%;
    top: -0.02rem;
    width: 0.72rem;
    height: 0.88rem;
    border: 1.6px solid color-mix(in oklab, #2f2015 68%, transparent);
    border-radius: 0.12rem 0.2rem 0.14rem 0.14rem;
    background: color-mix(in oklab, #f7e7c5 96%, white 4%);
    transform: translateX(-50%);
    animation: kefine-delivery-doc-pack 4.6s ease-in-out infinite;
    z-index: 0;
  }

  lef-delivery-pack-box {
    position: absolute;
    inset: auto 0 0;
    height: 0.6rem;
    border: 2px solid color-mix(in oklab, #2f2015 72%, transparent);
    border-radius: 0.16rem;
    background: color-mix(in oklab, #e4c794 92%, #cda869 8%);
    z-index: 1;
  }

  lef-delivery-pack-lid {
    position: absolute;
    top: 0.18rem;
    left: 0.06rem;
    right: 0.06rem;
    height: 0.24rem;
    border: 2px solid color-mix(in oklab, #2f2015 68%, transparent);
    border-bottom: 0;
    border-radius: 0.16rem 0.16rem 0 0;
    background: color-mix(in oklab, #edd6ab 90%, #d7b576 10%);
    transform-origin: center bottom;
    animation: kefine-delivery-lid-pack 4.6s ease-in-out infinite;
    z-index: 2;
  }

  @keyframes kefine-quote-doc-select {
    0%,
    10%,
    100% {
      left: 0.08rem;
      top: 0.02rem;
      transform: rotate(-8deg) scale(0.92);
    }

    28% {
      left: 1.18rem;
      top: 0.08rem;
      transform: rotate(-3deg) scale(0.96);
    }

    52% {
      left: 2.24rem;
      top: 0.06rem;
      transform: rotate(4deg) scale(1);
    }

    74% {
      left: 2.24rem;
      top: 0.44rem;
      transform: rotate(2deg) scale(0.88);
    }
  }

  @keyframes kefine-quote-box-idle {
    0%,
    12%,
    100% {
      transform: translateY(0) scale(0.94);
    }

    22%,
    34% {
      transform: translateY(-0.05rem) scale(1);
    }
  }

  @keyframes kefine-brief-writing {
    0%,
    18%,
    100% {
      opacity: 0.2;
      transform: scaleX(0.08);
    }

    26%,
    46% {
      opacity: 1;
      transform: scaleX(1);
    }
  }

  @keyframes kefine-delivery-doc-pack {
    0%,
    12%,
    100% {
      top: -0.02rem;
      opacity: 0.95;
      transform: translateX(-50%) scale(0.96);
    }

    46% {
      top: -0.02rem;
      opacity: 0.95;
      transform: translateX(-50%) scale(1);
    }

    68% {
      top: 0.3rem;
      opacity: 1;
      transform: translateX(-50%) scale(0.88);
    }

    82% {
      top: 0.52rem;
      opacity: 0.14;
      transform: translateX(-50%) scale(0.74);
    }

    100% {
      top: 0.58rem;
      opacity: 0;
      transform: translateX(-50%) scale(0.68);
    }
  }

  @keyframes kefine-delivery-lid-pack {
    0%,
    34%,
    100% {
      transform: perspective(40px) rotateX(-62deg);
    }

    52% {
      transform: perspective(40px) rotateX(-20deg);
    }

    74% {
      transform: perspective(40px) rotateX(0deg);
    }
  }

  lef-afe-link-in,
  lef-afe-link-route,
  lef-afe-link-out {
    position: relative;
    display: block;
    height: 2px;
    border-radius: 999px;
    background: currentColor;
    opacity: 0.9;
  }

  lef-afe-link-in::after,
  lef-afe-link-route::after,
  lef-afe-link-out::after {
    content: '';
    position: absolute;
    top: 50%;
    right: -0.02rem;
    width: 0.78rem;
    height: 0.78rem;
    border-top: 2px solid currentColor;
    border-right: 2px solid currentColor;
    transform: translateY(-50%) rotate(45deg);
  }

  lef-afe-link-in,
  lef-afe-link-route,
  lef-afe-link-out {
    color: #23170f;
  }

  lef-afe-link-in lefine-text,
  lef-afe-link-route lefine-text,
  lef-afe-link-out lefine-text {
    position: absolute;
    top: -1.1rem;
    left: 50%;
    transform: translateX(-50%);
    font-size: 0.7rem;
    font-weight: 700;
    letter-spacing: 0.03em;
    text-transform: lowercase;
    color: color-mix(in oklab, #2d1e14 92%, #7a5838 8%);
  }

  lef-afe-diagram > lef-afe-node-round,
  lef-afe-diagram > lef-afe-node-step,
  lef-afe-diagram > lef-afe-link-in,
  lef-afe-diagram > lef-afe-link-route,
  lef-afe-diagram > lef-afe-link-out {
    grid-row: 1;
  }

  lef-afe-diagram > lef-afe-node-round:last-child {
    transform: rotate(2.6deg);
  }

  :global(:root[data-kefine-theme='dark']) lef-afe-flow {
    --afe-ink: #1c120b;
    --afe-ink-soft: #1c120b;
    --afe-ink-muted: #1c120b;
    --afe-edge: #25170f;
    --afe-edge-soft: #8b6a44;
    --afe-edge-warm: #7f5c38;
    --afe-paper: #cfb487;
    --afe-paper-deep: #8f6d47;
    --afe-paper-note: #dfc48f;
    --afe-paper-sheet: #dfc48f;
    --afe-paper-fold: #d4b67c;
    --afe-paper-highlight: #fff1d8;
    --afe-feather: #2c1b11;
    --afe-feather-mid: #5d4229;
    --afe-feather-light: #5d4229;
    --afe-quill-spine: #e6d4b1;
    --afe-quill-shaft: #180f0a;
    --afe-quill-shaft-end: #4a3421;
    --afe-quill-nib: #140c08;
    --afe-quill-nib-end: #140c08;
    --afe-box: #d5b478;
    --afe-box-lid: #d5b478;
    --afe-box-deep: #8f6a43;
    --afe-pack-box: #d5b478;
    --afe-pack-box-deep: #8f6a43;
    --afe-accepted: #93ab72;
    --afe-accepted-deep: #c2a16d;
    --afe-accepted-ink: #28461f;
    --afe-accepted-glow: #5d7d4d;
    --afe-wash-a: #7a5a36;
    --afe-wash-b: #5c4228;
    --afe-speck: #5b4126;
    background:
      radial-gradient(circle at 18% 22%, color-mix(in oklab, var(--afe-wash-a) 12%, transparent), transparent 18%),
      radial-gradient(circle at 82% 76%, color-mix(in oklab, var(--afe-wash-b) 10%, transparent), transparent 20%),
      color-mix(in oklab, var(--afe-paper) 78%, var(--afe-paper-deep) 22%);
    box-shadow:
      inset 0 0 42px color-mix(in oklab, var(--afe-speck) 8%, transparent),
      0 10px 22px color-mix(in oklab, #000000 14%, transparent);
  }

  :global(:root[data-kefine-theme='dark']) lef-afe-flow::before {
    opacity: 0.86;
  }

  :global(:root[data-kefine-theme='dark']) lef-afe-flow::after {
    box-shadow: none;
  }

  :global(:root[data-kefine-theme='dark']) lef-afe-node-round,
  :global(:root[data-kefine-theme='dark']) lef-afe-node-step {
    color: #1a110b;
    background: color-mix(in oklab, #e1c896 88%, #a67e52 12%);
  }

  :global(:root[data-kefine-theme='dark']) lef-afe-node-round {
    box-shadow: none;
  }

  :global(:root[data-kefine-theme='dark']) lef-afe-node-step {
    box-shadow: 0 8px 18px color-mix(in oklab, #000000 14%, transparent);
  }

  :global(:root[data-kefine-theme='dark']) lef-afe-node-round strong,
  :global(:root[data-kefine-theme='dark']) lef-afe-node-step strong,
  :global(:root[data-kefine-theme='dark']) lef-afe-node-step p,
  :global(:root[data-kefine-theme='dark']) lef-brief-sheet-line,
  :global(:root[data-kefine-theme='dark']) lef-quote-doc-line,
  :global(:root[data-kefine-theme='dark']) lef-afe-link-in,
  :global(:root[data-kefine-theme='dark']) lef-afe-link-route,
  :global(:root[data-kefine-theme='dark']) lef-afe-link-out,
  :global(:root[data-kefine-theme='dark']) lef-afe-link-in lefine-text,
  :global(:root[data-kefine-theme='dark']) lef-afe-link-route lefine-text,
  :global(:root[data-kefine-theme='dark']) lef-afe-link-out lefine-text {
    color: #1c120b;
  }

  @media (max-width: 1080px) {
    lef-afe-flow {
      padding-block: 1rem;
    }

    lef-afe-diagram {
      grid-template-columns: 1fr;
      grid-template-rows: none;
      gap: 0.5rem;
    }

    lef-afe-link-in,
    lef-afe-link-route,
    lef-afe-link-out {
      width: 2px;
      height: 1.35rem;
      justify-self: center;
    }

    lef-afe-link-in::after,
    lef-afe-link-route::after,
    lef-afe-link-out::after {
      top: auto;
      bottom: 0;
      right: 50%;
      transform: translateX(50%) rotate(135deg);
    }

    lef-afe-link-in lefine-text,
    lef-afe-link-route lefine-text,
    lef-afe-link-out lefine-text {
      top: 50%;
      left: 1rem;
      transform: translateY(-50%);
    }

    lef-afe-node-round {
      justify-self: center;
    }

    lef-afe-node-step {
      min-height: 0;
      width: 100%;
      padding-block: 0.8rem;
    }

    lef-afe-step-head {
      gap: 0.6rem;
    }

    lef-brief-writing {
      width: 2.1rem;
      height: 1.95rem;
    }

    lef-quote-box-pick {
      min-width: 3rem;
      height: 1.95rem;
    }

    lef-quote-box {
      width: 0.82rem;
      height: 0.62rem;
    }

    lef-afe-diagram > lef-afe-node-round,
    lef-afe-diagram > lef-afe-node-step,
    lef-afe-diagram > lef-afe-link-in,
    lef-afe-diagram > lef-afe-link-route,
    lef-afe-diagram > lef-afe-link-out {
      grid-column: auto;
      grid-row: auto;
    }
  }

  label[data-part='sr-only'] {
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

  section[data-part='template-banner'] {
    display: flex;
    justify-content: space-between;
    gap: 0.9rem;
    padding: 0.85rem 1rem;
    border-radius: 0.6rem;
    background: color-mix(in oklab, var(--kef-primary) 10%, var(--kef-bg-card));
    border: 0;
  }

  section[data-part='template-variables'] {
    display: grid;
    gap: 0.75rem;
    grid-template-columns: repeat(auto-fit, minmax(10rem, 1fr));
  }

  section[data-part='service-setup-banner'] {
    display: grid;
    gap: 0.35rem;
    padding: 0.95rem 1rem;
    border-radius: 0.75rem;
    background: color-mix(in oklab, var(--kef-primary) 8%, var(--kef-bg-card));
    border: 0;
  }

  section[data-part='service-setup-banner'] p {
    margin: 0;
    color: var(--lefine-text-soft);
  }

  label[data-part='template-variable-field'] {
    display: grid;
    gap: 0.35rem;
  }

  label[data-part='template-variable-field'] lefine-text {
    color: var(--lefine-text-soft);
  }

  label[data-part='template-variable-field'] input {
    width: 100%;
    min-height: 2.6rem;
    padding: 0.55rem 0.8rem;
    border-radius: 0.55rem;
    border: 0;
    background: color-mix(in oklab, var(--kef-bg-card) 94%, white 6%);
    color: var(--lefine-text);
  }

  kefine-tag-strip {
    display: flex;
    flex-wrap: nowrap;
    gap: 0.55rem;
    align-items: center;
    overflow-x: auto;
    overflow-y: hidden;
    white-space: nowrap;
    padding-bottom: 0.15rem;
    scrollbar-width: thin;
  }

  button[data-part='tag-pill'] {
    display: inline-flex;
    align-items: center;
    gap: 0.45rem;
    min-height: 2rem;
    padding: 0.35rem 0.75rem;
    border-radius: 999px;
    border: 0;
    background: color-mix(in oklab, var(--kef-bg-card) 92%, white 8%);
    color: var(--lefine-text);
    flex: 0 0 auto;
    cursor: pointer;
    transition:
      background-color 160ms ease,
      transform 120ms ease;
  }

  button[data-part='tag-pill']:hover {
    background: color-mix(in oklab, var(--kef-bg-card) 80%, var(--kef-color-primary) 20%);
  }

  button[data-part='tag-pill']:active {
    transform: scale(0.97);
  }

  [data-part="tasks-list"] {
    width: min(100%, calc(100vw - 7rem));
    max-width: 64rem;
    margin-inline: auto;
    padding: 0.28rem;
    display: grid;
    gap: 1rem;
  }

  [data-part="tasks-list"][data-entrance] > kefine-task-history-item {
    animation: kefine-task-drop-in 420ms cubic-bezier(0.23, 1, 0.32, 1) backwards;
    transform-origin: 50% 0;
    will-change: transform, opacity;
  }

  kefine-task-history-item {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    align-items: center;
    gap: 0.5rem;
    min-width: 0;
  }

  kefine-task-history-item > a {
    min-width: 0;
  }

  kefine-task-history-actions {
    display: inline-flex;
    align-items: center;
    gap: 0.36rem;
    min-width: max-content;
  }

  kefine-task-history-actions a[data-part='open-solvers'],
  kefine-task-history-actions button[data-part='stop-task'] {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-height: 2rem;
    border-radius: 999px;
    border: 1px solid color-mix(in oklab, var(--kef-line) 84%, transparent);
    background: color-mix(in oklab, var(--kef-bg-card) 92%, var(--kef-color-primary) 8%);
    color: var(--lefine-text);
    font-size: 0.78rem;
    font-weight: 650;
    line-height: 1;
    text-decoration: none;
    cursor: pointer;
    transition:
      background-color var(--kef-motion-fast) var(--kef-ease-soft),
      border-color var(--kef-motion-fast) var(--kef-ease-soft),
      transform 120ms ease;
  }

  kefine-task-history-actions a[data-part='open-solvers'] {
    padding: 0 0.78rem;
  }

  kefine-task-history-actions button[data-part='stop-task'] {
    width: 2rem;
    padding: 0;
  }

  kefine-task-history-actions button[data-part='stop-task'] lefine-text {
    width: 0.52rem;
    height: 0.52rem;
    border-radius: 0.16rem;
    background: currentColor;
  }

  kefine-task-history-actions a[data-part='open-solvers']:hover,
  kefine-task-history-actions button[data-part='stop-task']:hover {
    background: color-mix(in oklab, var(--kef-bg-card) 82%, var(--kef-color-primary) 18%);
    border-color: color-mix(in oklab, var(--kef-color-primary) 38%, var(--kef-line));
  }

  kefine-task-history-actions a[data-part='open-solvers']:active,
  kefine-task-history-actions button[data-part='stop-task']:active {
    transform: scale(0.96);
  }

  lef-tasks-grid {
    display: grid;
    grid-template-columns: minmax(220px, 1fr) 38rem 320px;
    gap: 1rem;
    align-items: start;
  }

  lef-tasks-aside {
    display: flex;
    flex-direction: column;
    gap: 0.6rem;
    padding: 0.85rem 0.85rem 0.95rem;
    background: var(--kef-bg-card);
    border: 1px solid var(--kef-line);
    border-radius: 0.75rem;
    position: sticky;
    top: 1rem;
  }

  lef-tasks-aside-head {
    display: block;
    font-size: 0.72rem;
    font-weight: 700;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--lefine-text-soft);
    padding: 0.1rem 0.25rem 0.4rem;
  }

  lef-tasks-aside-list {
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
  }

  lef-tasks-aside-item {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem 0.6rem;
    border-radius: 0.55rem;
    border: 0;
    background: color-mix(in oklab, var(--kef-color-primary, #c89a5a) 8%, var(--kef-bg-card));
    color: var(--lefine-text);
    font-size: 0.85rem;
  }

  lef-tasks-aside-item[data-active='true'] {
    background: color-mix(in oklab, var(--kef-color-primary, #c89a5a) 14%, var(--kef-bg-card));
  }

  lef-tasks-aside-item lefine-text {
    min-width: 0;
    overflow-wrap: anywhere;
    white-space: normal;
    line-height: 1.3;
    color: var(--lefine-text);
  }

  lef-task-rail {
    display: flex;
    flex-direction: column;
    gap: 0.6rem;
    position: sticky;
    top: 1rem;
  }

  lef-task-rail-card {
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
    padding: 0.85rem 0.95rem 1rem;
    background: var(--kef-bg-card);
    border: 1px solid var(--kef-line);
    border-radius: 0.75rem;
  }

  lef-task-rail-head {
    display: block;
    font-size: 0.72rem;
    font-weight: 700;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--lefine-text-soft);
  }

  lef-task-rail-body {
    display: block;
    font-size: 0.95rem;
    color: var(--lefine-text);
    line-height: 1.4;
    word-break: break-word;
  }

  lef-task-rail-actions {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 0.5rem;
  }

  .task-rail-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 0.4rem;
    padding: 0.55rem 0.75rem;
    border-radius: 0.55rem;
    border: 1px solid var(--kef-line);
    background: var(--kef-bg-card);
    color: var(--lefine-text);
    font-size: 0.85rem;
    font-weight: 600;
    cursor: pointer;
    transition: background 160ms ease, border-color 160ms ease;
  }

  .task-rail-btn:hover {
    background: color-mix(in oklab, var(--kef-color-primary, #c89a5a) 8%, var(--kef-bg-card));
    border-color: color-mix(in oklab, var(--kef-color-primary, #c89a5a) 30%, var(--kef-line));
  }

  .task-rail-btn--primary {
    background: color-mix(in oklab, var(--kef-color-primary, #c89a5a) 14%, var(--kef-bg-card));
    border-color: color-mix(in oklab, var(--kef-color-primary, #c89a5a) 35%, var(--kef-line));
  }

  lef-task-rail-icon {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 1.05rem;
    height: 1.05rem;
    font-size: 0.95rem;
    line-height: 1;
    color: var(--lefine-text);
  }

  @media (max-width: 1280px) {
    lef-tasks-grid {
      grid-template-columns: minmax(220px, 1fr) minmax(0, 38rem);
    }
    lef-task-rail {
      grid-column: 1 / -1;
      position: static;
    }
  }

  @media (max-width: 1180px) {
    lef-tasks-grid {
      grid-template-columns: minmax(200px, 1fr) minmax(0, 38rem);
    }
  }

  @media (max-width: 760px) {
    lef-tasks-grid {
      grid-template-columns: minmax(0, 1fr);
    }
    lef-tasks-aside,
    lef-task-rail {
      position: static;
    }
  }

  lef-solutions-list {
    display: grid;
    gap: 0.7rem;
    width: 100%;
  }

  .solution-card {
    --card-i: 0;
    display: grid;
    gap: 0.5rem;
    padding: 0.75rem 0.9rem;
    background: var(--kef-bg-card);
    border: 1px solid var(--kef-line);
    border-radius: var(--kef-radius-ui, 0.75rem);
    box-shadow: 0 1px 0 color-mix(in oklab, var(--kef-line) 60%, transparent);
    box-sizing: border-box;
    animation: solution-card-appear 480ms cubic-bezier(0.22, 1, 0.36, 1) both;
    animation-delay: calc(var(--card-i) * 70ms);
    transform-origin: top center;
    will-change: opacity, transform;
  }

  @keyframes solution-card-appear {
    0% {
      opacity: 0;
      transform: translateY(8px) scale(0.97);
      filter: blur(2px);
    }
    60% {
      filter: blur(0);
    }
    100% {
      opacity: 1;
      transform: translateY(0) scale(1);
      filter: blur(0);
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .solution-card {
      animation: none;
    }
  }

  .solution-card-header {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    align-items: center;
    gap: 0.75rem;
  }

  lef-solution-meta {
    display: grid;
    gap: 0.1rem;
    min-width: 0;
  }

  lef-solution-meta strong {
    color: var(--lefine-text);
    font-size: 1rem;
    font-weight: 600;
    line-height: 1.25;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  lef-solution-meta lefine-text {
    color: var(--lefine-text-soft);
    font-size: 0.875rem;
    line-height: 1.3;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .solution-description {
    margin: 0;
    color: var(--lefine-text-soft);
    font-size: 0.92rem;
    line-height: 1.45;
  }

  lef-file-list {
    display: flex;
    flex-direction: column;
    gap: 0.2rem;
    font-family: 'Synt', monospace;
    font-size: 0.78rem;
  }

  lef-file-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.5rem;
    min-width: 0;
  }

  lef-file-name {
    color: var(--lefine-text-soft);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    min-width: 0;
    flex: 1 1 auto;
  }

  lef-file-changes {
    display: inline-flex;
    gap: 0.4rem;
    font-weight: 600;
    font-size: 0.78rem;
    flex: 0 0 auto;
  }

  lef-file-added { color: var(--kef-success, #22c55e); }
  lef-file-removed { color: var(--kef-error, #ef4444); }

  lef-card-actions {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 0.5rem;
  }

  .pin-button {
    position: relative;
    width: 28px;
    height: 28px;
    background: transparent;
    border: 1px solid var(--kef-line);
    border-radius: 0.4rem;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    transition:
      border-color 200ms ease,
      background-color 200ms ease,
      color 200ms ease;
    padding: 0;
    outline: none;
    flex-shrink: 0;
    color: var(--lefine-text-soft);
    -webkit-tap-highlight-color: transparent;
  }

  .pin-button:hover {
    border-color: color-mix(in oklab, var(--kef-color-primary) 40%, var(--kef-line));
    color: var(--kef-color-primary);
  }

  .pin-button:active {
    transform: scale(0.96);
  }

  .pin-svg {
    width: 16px;
    height: 16px;
    transition: fill 200ms ease, stroke 200ms ease;
  }

  .pin-button.is-active {
    border-color: color-mix(in oklab, var(--kef-color-primary) 55%, var(--kef-line));
    background: color-mix(in oklab, var(--kef-color-primary) 14%, var(--kef-bg-card));
    color: var(--kef-color-primary);
  }

  .pin-button.is-active .pin-svg {
    fill: currentColor;
    animation: pin-pop 320ms cubic-bezier(0.34, 1.56, 0.64, 1) both;
  }

  @keyframes pin-pop {
    0% { transform: scale(1); }
    50% { transform: scale(1.18); }
    100% { transform: scale(1); }
  }

  @media (prefers-reduced-motion: reduce) {
    .pin-button.is-active .pin-svg { animation: none; }
  }

  .view-solution-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 30px;
    height: 28px;
    padding: 0;
    background: transparent;
    color: var(--lefine-text-soft);
    border: 1px solid var(--kef-line);
    border-radius: 0.4rem;
    cursor: pointer;
    transition:
      background-color 160ms ease,
      border-color 160ms ease,
      color 160ms ease,
      transform 120ms ease;
  }

  .view-solution-icon {
    width: 14px;
    height: 14px;
  }

  .view-solution-btn:hover {
    background: color-mix(in oklab, var(--kef-color-primary) 10%, transparent);
    border-color: color-mix(in oklab, var(--kef-color-primary) 40%, var(--kef-line));
    color: var(--kef-color-primary);
  }

  .view-solution-btn:active {
    transform: scale(0.97);
  }

  .solution-merge-btn {
    display: inline-flex;
    align-items: center;
    gap: 0.3rem;
    padding: 0.28rem 0.6rem;
    border-radius: 0.4rem;
    border: 1px solid color-mix(in oklab, var(--kef-success, #16a34a) 35%, var(--kef-line));
    background: color-mix(in oklab, var(--kef-success, #16a34a) 10%, var(--kef-bg-card));
    color: var(--kef-success, #16a34a);
    font-size: 0.74rem;
    font-weight: 600;
    cursor: pointer;
    transition:
      background-color 160ms ease,
      border-color 160ms ease,
      transform 120ms ease;
  }

  .solution-merge-btn:hover {
    background: color-mix(in oklab, var(--kef-success, #16a34a) 18%, var(--kef-bg-card));
    border-color: var(--kef-success, #16a34a);
  }

  .solution-merge-btn:active {
    transform: scale(0.97);
  }

  .solution-merge-btn--merged {
    background: color-mix(in oklab, var(--kef-success, #16a34a) 22%, var(--kef-bg-card));
    border-color: var(--kef-success, #16a34a);
  }

  button[data-part='composer-chip'][data-part-tag='true'] {
    border-style: dashed;
    color: var(--lefine-text-soft);
  }

  button[data-part='tag-pill'] strong {
    font-size: 0.95rem;
    line-height: 1;
  }

  input[data-part='tag-input'] {
    width: 8rem;
    min-height: 2rem;
    padding: 0.35rem 0.75rem;
    border-radius: 999px;
    border: 0;
    background: color-mix(in oklab, var(--kef-bg-card) 94%, white 6%);
    color: var(--lefine-text);
    flex: 0 0 auto;
  }

  input[data-part='tag-input']:focus {
    outline: none;
  }

  section[data-part='template-banner'] p,
  section[data-part='template-banner'] strong,
  [data-part='template-meta'] strong,
  [data-part='template-meta'] lefine-text {
    margin: 0;
  }

  [data-part='template-meta'] {
    display: grid;
    gap: 0.25rem;
    justify-items: end;
    text-align: right;
  }

  kefine-solver-search-row {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto auto auto;
    align-items: center;
    gap: 0.72rem;
    min-height: 2.85rem;
    padding: 0.42rem 0.28rem 0.42rem 0.78rem;
    border-radius: 0.38rem;
    background: color-mix(in oklab, var(--kef-bg-card) 96%, var(--kef-bg));
    box-shadow: none;
  }

  kefine-solver-search-row:has(lef-arrow-wrapper) {
    grid-template-columns: minmax(0, 1fr) auto auto auto;
  }

  lef-arrow-wrapper {
    display: inline-flex;
    align-items: center;
    gap: 8px;
  }

  lef-flying-arrow {
    display: inline-block;
    font-size: 1.2rem;
    color: var(--kef-color-primary, #c89a5a);
    animation: arrow-fly-into 3.5s ease-in-out forwards;
  }

  @keyframes arrow-fly-into {
    0% {
      opacity: 1;
      transform: translateX(0);
    }
    30% {
      transform: translateX(-5px);
    }
    50% {
      transform: translateX(-2px);
    }
    70% {
      transform: translateX(-1px);
    }
    85% {
      opacity: 1;
      transform: translateX(0);
    }
    95% {
      opacity: 0.5;
      transform: translateX(2px);
    }
    100% {
      opacity: 0;
      transform: translateX(5px);
    }
  }

  lef-wind-flow {
    display: flex;
    flex-direction: column;
    gap: 3px;
  }

  lef-wind-line {
    display: block;
    height: 1px;
    background: linear-gradient(90deg, transparent, var(--kef-color-primary, #c89a5a));
    animation: wind-dash 1s linear infinite;
  }

  lef-wind-line:nth-child(1) {
    width: 15px;
    opacity: 0.6;
  }

  lef-wind-line:nth-child(2) {
    width: 10px;
    opacity: 0.4;
    animation-delay: 0.3s;
  }

  @keyframes wind-dash {
    0% {
      transform: translateX(-15px);
      opacity: 0;
    }
    50% {
      opacity: 0.6;
    }
    100% {
      transform: translateX(5px);
      opacity: 0;
    }
  }

  kefine-solver-search-row lefine-text {
    min-width: 0;
    overflow: hidden;
    color: color-mix(in oklab, var(--lefine-text) 92%, transparent);
    font-size: 0.92rem;
    font-weight: 650;
    line-height: 1;
    padding-block: 0.15rem 0;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  kefine-solver-search-row lefine-text[data-part='task-estimate'] {
    flex: 0 0 auto;
    color: color-mix(in oklab, var(--lefine-text) 66%, transparent);
    font-size: 0.78rem;
    font-weight: 600;
  }

  kefine-task-branch {
    display: inline-flex;
    align-items: center;
    gap: 0;
    padding: 0.05rem 0.2rem;
    border-radius: 999px;
    background: transparent;
    transition: background 120ms ease, padding 120ms ease;
  }

  kefine-task-branch:hover {
    background: color-mix(in oklab, var(--kef-bg-card) 78%, transparent);
    gap: 4px;
    padding: 0.05rem 0.45rem 0.05rem 0.32rem;
  }

  lef-cp-branch-icon {
    display: inline-flex;
    color: var(--lefine-text-soft);
    opacity: 0.85;
    flex: 0 0 auto;
  }

  kefine-task-branch-name {
    font-family: 'Synt', monospace;
    font-size: 0.74rem;
    font-weight: 600;
    color: var(--lefine-text);
    line-height: 1;
    letter-spacing: -0.01em;
    opacity: 0;
    max-width: 0;
    overflow: hidden;
    white-space: nowrap;
    transition: opacity 160ms ease, max-width 200ms cubic-bezier(0.23, 1, 0.32, 1);
    margin-right: 0;
  }

  kefine-task-branch:hover kefine-task-branch-name {
    opacity: 1;
    max-width: 160px;
    margin-right: 3px;
  }

  kefine-solver-search-indicator {
    position: relative;
    display: inline-grid;
    place-items: center;
    width: 2rem;
    height: 2rem;
    border-radius: 999px;
    color: color-mix(in oklab, var(--kef-primary) 88%, #5a4636);
    background: color-mix(in oklab, var(--kef-primary) 9%, var(--kef-bg-card));
    box-shadow:
      inset 0 0 0 1px color-mix(in oklab, currentColor 18%, transparent),
      0 0 0 0 color-mix(in oklab, currentColor 22%, transparent);
    animation: kefine-solver-search-pulse 1.65s var(--kef-ease-soft) infinite;
  }

  kefine-solver-search-indicator[data-completed='true'] {
    animation: none;
    color: color-mix(in oklab, #22c55e 88%, #166534);
  }

  kefine-solver-search-indicator::before {
    content: '';
    position: absolute;
    inset: 0.28rem;
    border: 2px solid color-mix(in oklab, currentColor 18%, transparent);
    border-top-color: currentColor;
    border-radius: inherit;
    animation: kefine-solver-search-spin 0.9s linear infinite;
  }

  kefine-solver-search-indicator[data-completed='true']::before {
    animation: none;
    border-color: currentColor;
    border-top-color: transparent;
  }

  kefine-solver-search-dot {
    display: block;
    width: 0.42rem;
    height: 0.42rem;
    border-radius: 999px;
    background: currentColor;
  }

  fieldset[data-part='exec-row'] {
    position: relative;
    display: grid;
    grid-template-columns: minmax(0, 1fr) 4.05rem;
    gap: clamp(0.45rem, 2vw, 0.75rem);
    align-items: center;
    border-radius: 0.38rem;
    padding: 0.28rem;
    margin: 0;
    border: 0;
    min-inline-size: 0;
    background: transparent;
    box-shadow: none;
  }

  fieldset[data-part='exec-row']:focus-within {
    box-shadow: none;
  }

  kefine-search-page-input-shell {
    display: block;
    min-width: 0;
    width: 100%;
  }

  kefine-task-shell {
    margin: 0;
    display: grid;
    grid-template-columns: minmax(0, 1fr);
    align-items: start;
    min-width: 0;
    max-width: 100%;
    overflow: hidden;
    position: relative;
  }

  textarea[data-part='task-input'] {
    display: block;
    width: 100%;
    min-width: 0;
    max-width: 100%;
    box-sizing: border-box;
    min-height: clamp(3.3rem, 7vw, 4rem);
    height: clamp(3.3rem, 7vw, 4rem);
    max-height: 18rem;
    font-size: clamp(0.98rem, 2.15vw, 1.72rem);
    font-weight: 740;
    line-height: 1.04;
    letter-spacing: -0.02em;
    text-align: left;
    color: var(--kef-on-primary);
    background: var(--kef-primary);
    border: var(--kef-border-width-strong) solid transparent;
    border-radius: 0.3rem;
    resize: none;
    overflow-x: hidden;
    overflow-y: hidden;
    padding-inline: var(--kef-task-pad-inline);
    padding-top: max(0.48rem, calc((clamp(3.3rem, 7vw, 4rem) - 1.04em) / 2));
    padding-bottom: max(0.48rem, calc((clamp(3.3rem, 7vw, 4rem) - 1.04em) / 2));
    overflow-wrap: anywhere;
    white-space: pre-wrap;
    transition:
      border-color var(--kef-motion-fast) var(--kef-ease-soft),
      box-shadow var(--kef-motion-fast) var(--kef-ease-soft),
      background-color var(--kef-motion-fast) var(--kef-ease-soft);
  }

  textarea[data-part='task-input']:focus {
    box-shadow: none;
  }

  textarea[data-part='task-input'][data-multiline='true'] {
    height: auto;
    overflow-x: hidden;
    white-space: pre-wrap;
    overflow-wrap: anywhere;
    padding-top: 0.72rem;
    padding-bottom: 0.72rem;
  }

  kefine-task-placeholder {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    min-width: 0;
    max-width: 100%;
    min-height: clamp(3.3rem, 7vw, 4rem);
    padding-inline: var(--kef-task-pad-inline);
    padding-top: max(0.48rem, calc((clamp(3.3rem, 7vw, 4rem) - 1.04em) / 2));
    padding-bottom: max(0.48rem, calc((clamp(3.3rem, 7vw, 4rem) - 1.04em) / 2));
    color: color-mix(in oklab, var(--kef-on-primary) 78%, transparent);
    font-size: clamp(0.98rem, 2.15vw, 1.72rem);
    font-weight: 720;
    opacity: 0;
    pointer-events: none;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    transition: opacity 220ms var(--kef-ease-soft);
  }

  kefine-task-placeholder[data-visible='true'] {
    opacity: 1;
  }

  textarea[data-part='task-input'][data-size='hero'],
  kefine-task-placeholder[data-size='hero'] {
    font-size: 1.6rem;
  }

  textarea[data-part='task-input'][data-size='balanced'],
  kefine-task-placeholder[data-size='balanced'] {
    font-size: 1.25rem;
  }

  textarea[data-part='task-input'][data-size='compact'],
  kefine-task-placeholder[data-size='compact'] {
    font-size: 0.92rem;
  }

  button[data-part='exec-button'] {
    width: 100%;
    height: clamp(3.3rem, 7vw, 4rem);
    min-height: clamp(3.3rem, 7vw, 4rem);
    max-width: 4.05rem;
    border-radius: 0.3rem;
    padding: 0;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    font-size: 0;
  }

  kefine-exec-arrow {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    height: 100%;
    font-size: clamp(2.35rem, 8vw, 3.6rem);
    font-weight: 400;
    line-height: 1;
    text-align: center;
  }

  @keyframes kefine-solver-search-spin {
    to {
      transform: rotate(360deg);
    }
  }

  @keyframes kefine-solver-search-pulse {
    50% {
      box-shadow:
        inset 0 0 0 1px color-mix(in oklab, currentColor 18%, transparent),
        0 0 0 0.42rem color-mix(in oklab, currentColor 0%, transparent);
    }
  }

  kefine-input-meta {
    display: grid;
    gap: 0.55rem;
    margin-top: -0.05rem;
    padding: 0.52rem 0.58rem 0.62rem;
    border-radius: 0.4rem;
    background: color-mix(in oklab, var(--kef-bg-card) 86%, var(--kef-bg-soft) 14%);
    box-shadow: none;
  }

  kefine-pinned-strip {
    display: flex;
    flex-wrap: wrap;
    gap: 0.4rem;
    margin-top: 0.45rem;
    /* Align the chip icon with the search-input text (tracks the same inset). */
    padding-left: calc(var(--kef-task-pad-inline) - 0.05rem);
  }

  kefine-pinned-chip {
    display: inline-flex;
    align-items: center;
    gap: 0.15rem;
    padding: 0.2rem 0.3rem 0.2rem 0.2rem;
    border-radius: 999px;
    border: 1px solid color-mix(in oklab, var(--kef-color-primary, #c89a5a) 45%, transparent);
    background: color-mix(in oklab, var(--kef-color-primary, #c89a5a) 10%, var(--kef-bg-card));
  }

  a[data-part='pinned-chip-link'] {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    min-width: 0;
    padding: 0.05rem 0.15rem;
    color: var(--lefine-text);
    text-decoration: none;
    cursor: pointer;
  }

  kefine-instant-icon[data-part='pinned-icon'] {
    width: 1.4rem;
    height: 1.4rem;
    font-size: 0.95rem;
  }

  lefine-text[data-part='pinned-name'] {
    font-size: 0.82rem;
    font-weight: 600;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 9rem;
  }

  button[data-part='pinned-remove'] {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 1.25rem;
    height: 1.25rem;
    padding: 0;
    border: none;
    border-radius: 50%;
    background: transparent;
    color: var(--lefine-text-soft);
    cursor: pointer;
    transition: background-color 0.12s ease, color 0.12s ease;
  }

  button[data-part='pinned-remove']:hover {
    background: color-mix(in oklab, var(--lefine-text) 12%, transparent);
    color: var(--lefine-text);
  }

  kefine-instant-answers {
    display: grid;
    gap: 0.2rem;
    margin-top: 0.4rem;
    padding: 0.35rem;
    border-radius: 0.7rem;
    border: 1px solid color-mix(in oklab, var(--kef-line-strong) 60%, transparent);
    background: color-mix(in oklab, var(--kef-bg-card) 96%, white 4%);
    box-shadow: 0 12px 24px color-mix(in oklab, var(--lefine-text) 14%, transparent);
  }

  kefine-instant-row {
    position: relative;
    display: flex;
    align-items: center;
    gap: 0.3rem;
    border-radius: 0.5rem;
  }

  kefine-instant-row[data-highlighted='true'] {
    background: color-mix(in oklab, var(--kef-color-primary, #c89a5a) 12%, var(--kef-bg-card));
  }

  a[data-part='instant-answer'] {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    flex: 1;
    min-width: 0;
    /* Align the leading icon with the search-input text (tracks the same inset). */
    padding: 0.55rem 0.7rem 0.55rem calc(var(--kef-task-pad-inline) - 0.05rem);
    border-radius: 0.5rem;
    color: var(--lefine-text);
    text-decoration: none;
    cursor: pointer;
  }

  kefine-instant-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 1.4rem;
    height: 1.4rem;
    flex-shrink: 0;
    font-size: 0.95rem;
    line-height: 1;
    border-radius: 50%;
    overflow: hidden;
    background: color-mix(in oklab, var(--lefine-text) 8%, transparent);
  }

  img[data-part='instant-favicon'] {
    width: 1.15rem;
    height: 1.15rem;
    object-fit: contain;
    display: block;
  }

  kefine-instant-emoji {
    display: flex;
    align-items: center;
    justify-content: center;
    line-height: 1;
  }

  kefine-instant-actions {
    position: relative;
    display: flex;
    align-items: center;
    gap: 0.1rem;
    flex-shrink: 0;
    padding-right: 0.4rem;
  }

  button[data-part='instant-action'] {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 1.85rem;
    height: 1.85rem;
    padding: 0;
    border: none;
    border-radius: 0.45rem;
    background: transparent;
    color: var(--lefine-text-soft);
    cursor: pointer;
    transition: background-color 0.12s ease, color 0.12s ease;
  }

  button[data-part='instant-action']:hover {
    background: color-mix(in oklab, var(--lefine-text) 10%, transparent);
    color: var(--lefine-text);
  }

  button[data-part='instant-action'][data-pinned='true'] {
    color: var(--kef-color-primary, #c89a5a);
  }

  kefine-instant-menu {
    position: absolute;
    top: calc(100% + 0.25rem);
    right: 0;
    z-index: 5;
    display: grid;
    gap: 0.1rem;
    min-width: 13rem;
    padding: 0.3rem;
    border-radius: 0.55rem;
    border: 1px solid color-mix(in oklab, var(--kef-line-strong) 60%, transparent);
    background: var(--kef-bg-card);
    box-shadow: 0 14px 30px color-mix(in oklab, var(--lefine-text) 22%, transparent);
  }

  button[data-part='instant-menu-item'] {
    display: block;
    width: 100%;
    padding: 0.45rem 0.6rem;
    border: none;
    border-radius: 0.4rem;
    background: transparent;
    color: var(--lefine-text);
    font-size: 0.86rem;
    text-align: left;
    cursor: pointer;
  }

  button[data-part='instant-menu-item']:hover {
    background: color-mix(in oklab, var(--kef-color-primary, #c89a5a) 14%, var(--kef-bg-card));
  }

  kefine-qr-card {
    display: grid;
    justify-items: center;
    gap: 0.5rem;
    margin-top: 0.5rem;
    margin-left: auto;
    width: max-content;
    padding: 1rem 1.2rem;
    border-radius: 0.7rem;
    border: 1px solid color-mix(in oklab, var(--kef-line-strong) 60%, transparent);
    background: var(--kef-bg-card);
    box-shadow: 0 14px 30px color-mix(in oklab, var(--lefine-text) 18%, transparent);
  }

  lefine-text[data-part='qr-name'] {
    font-weight: 600;
  }

  kefine-qr-frame[data-part='qr-image'] {
    display: block;
    width: 11rem;
    height: 11rem;
    border-radius: 0.4rem;
    background: white;
    padding: 0.5rem;
    color: #111;
  }

  kefine-qr-frame[data-part='qr-image'] svg {
    width: 100%;
    height: 100%;
    display: block;
  }

  lefine-text[data-part='qr-url'] {
    color: var(--lefine-text-soft);
    font-size: 0.8rem;
    max-width: 14rem;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  button[data-part='qr-download'] {
    padding: 0.4rem 0.9rem;
    border: none;
    border-radius: 0.45rem;
    background: var(--kef-color-primary, #c89a5a);
    color: var(--kef-bg-card, #1b1710);
    font-size: 0.85rem;
    font-weight: 600;
    cursor: pointer;
  }

  kefine-instant-text {
    display: grid;
    gap: 0.05rem;
    min-width: 0;
    flex: 1;
  }

  lefine-text[data-part='instant-name'] {
    font-weight: 600;
    letter-spacing: 0;
  }

  lefine-text[data-part='instant-url'] {
    color: var(--lefine-text-soft);
    font-size: 0.82rem;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  lefine-text[data-part='instant-description'] {
    color: color-mix(in oklab, var(--lefine-text) 66%, transparent);
    font-size: 0.78rem;
    line-height: 1.32;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  kefine-instant-go {
    flex-shrink: 0;
    color: var(--kef-color-primary, #c89a5a);
    font-size: 0.82rem;
    font-weight: 600;
    opacity: 0;
    transition: opacity 0.12s ease;
  }

  kefine-instant-row[data-highlighted='true'] kefine-instant-go,
  kefine-instant-row:hover kefine-instant-go {
    opacity: 1;
  }

  kefine-composer-strip {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    align-items: center;
    padding: 0.05rem 0 0.2rem;
  }

  button[data-part='composer-chip'],
  input[data-part='execution-estimate-input'],
  button[data-part='file-pill'] {
    min-height: 2.35rem;
    padding: 0.5rem 0.95rem;
    border-radius: 999px;
    border: var(--kef-border-width-soft) solid var(--kef-line);
    background: color-mix(in oklab, var(--kef-bg-card) 68%, var(--kef-bg-soft) 32%);
    color: var(--lefine-text);
    font: inherit;
    box-shadow: 0 1px 2px color-mix(in oklab, var(--kef-primary) 14%, transparent);
  }

  button[data-part='composer-chip'] {
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;
    letter-spacing: -0.01em;
    font-weight: 500;
    cursor: pointer;
    transition:
      background-color 160ms ease,
      border-color 160ms ease,
      box-shadow 160ms ease,
      color 160ms ease,
      transform 120ms ease;
  }

  button[data-part='composer-chip']:hover {
    background: color-mix(in oklab, var(--kef-bg-card) 66%, var(--kef-primary) 34%);
    border-color: var(--kef-line-primary);
    box-shadow: 0 2px 6px color-mix(in oklab, var(--kef-primary) 22%, transparent);
    color: var(--kef-primary);
  }

  button[data-part='composer-chip']:focus-visible {
    outline: 2px solid color-mix(in oklab, var(--kef-primary) 60%, transparent);
    outline-offset: 2px;
  }

  button[data-part='composer-chip']:active {
    transform: scale(0.97);
  }

  button[data-part='composer-chip'][data-part-tag='true']:hover {
    border-color: var(--kef-line-primary);
    color: var(--kef-primary);
  }

  kefine-execution-editor {
    display: flex;
    gap: 0.5rem;
    align-items: center;
  }

  input[data-part='execution-estimate-input'] {
    width: 10rem;
    background: color-mix(in oklab, var(--kef-bg-card) 94%, white 6%);
  }

  input[data-part='file-input'] {
    display: none;
  }

  kefine-file-list {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
  }

  kefine-file-list[data-template-files='true'] {
    opacity: 0.84;
  }

  button[data-part='file-pill'] {
    display: inline-flex;
    align-items: center;
    gap: 0.65rem;
    cursor: pointer;
    transition:
      background-color 160ms ease,
      transform 120ms ease;
  }

  button[data-part='file-pill']:hover {
    background: color-mix(in oklab, var(--kef-bg-card) 80%, var(--kef-color-primary) 20%);
  }

  button[data-part='file-pill']:active {
    transform: scale(0.97);
  }

  img[data-part='file-preview'] {
    max-width: 100%;
    max-height: 100%;
    object-fit: contain;
    display: block;
  }

  lefine-box[data-part='file-preview-wrapper'] {
    width: 2rem;
    height: 2rem;
    border-radius: 0.3rem;
    flex-shrink: 0;
    overflow: hidden;
    background: color-mix(in oklab, var(--kef-bg-card) 50%, transparent);
    display: flex;
    align-items: center;
    justify-content: center;
  }

  [data-part='template-file-pill'] {
    display: inline-flex;
    align-items: center;
    gap: 0.65rem;
    min-height: 2.5rem;
    padding: 0.6rem 0.85rem;
    border-radius: 999px;
    border: 1px solid color-mix(in oklab, var(--kef-line) 60%, transparent);
    background: color-mix(in oklab, var(--kef-bg-soft) 58%, transparent);
  }

  p[data-part='composer-hints'] {
    margin: 0;
    color: var(--lefine-text-soft);
    font-size: 0.85rem;
  }

  kefine-submit-popover {
    position: absolute;
    right: 0.28rem;
    top: calc(100% + 0.35rem);
    z-index: 4;
    display: grid;
    gap: 0.4rem;
    min-width: min(16rem, calc(100vw - 3rem));
    padding: 0.45rem;
    border-radius: 0.7rem;
    border: 1px solid color-mix(in oklab, var(--kef-line-strong) 72%, transparent);
    background: color-mix(in oklab, var(--kef-bg-card) 96%, white 4%);
    box-shadow: 0 12px 24px color-mix(in oklab, var(--lefine-text) 14%, transparent);
  }

  button[data-part='queue-popover-action'] {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-height: 2.6rem;
    padding: 0.6rem 0.85rem;
    border-radius: 0.55rem;
    border: 1px solid color-mix(in oklab, var(--kef-line-strong) 64%, transparent);
    background: color-mix(in oklab, var(--kef-bg-soft) 84%, var(--kef-bg-card) 16%);
    color: var(--lefine-text);
    font: inherit;
    font-weight: 600;
    text-align: center;
  }

  section[data-part='recent'] {
    display: grid;
    gap: 0.65rem;
    min-height: 0;
  }

  kefine-recent-title {
    font-size: 0.95rem;
    font-weight: 650;
    color: var(--lefine-text-soft);
    margin: 0;
  }

  ul[data-part='recent-list'] {
    margin: 0;
    padding: 0;
    list-style: none;
    display: grid;
    gap: 0.5rem;
  }

  ul[data-part='recent-list'][data-compact='true'] {
    gap: 0.42rem;
  }

  kefine-search-results-empty {
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 9rem;
    padding: 1.2rem;
    border: 1px solid color-mix(in oklab, var(--kef-line) 70%, transparent);
    border-radius: 0.42rem;
    background: color-mix(in oklab, var(--kef-bg-card) 86%, transparent);
    color: color-mix(in oklab, var(--lefine-text-soft) 86%, transparent);
    font-size: 0.95rem;
    font-weight: 620;
    text-align: center;
  }

  kefine-search-results-empty[data-variant='create-hint'] {
    border-style: dashed;
    border-color: color-mix(in oklab, var(--kef-primary) 42%, var(--kef-line));
    background: color-mix(in oklab, var(--kef-primary) 6%, var(--kef-bg-card));
    color: color-mix(in oklab, var(--lefine-text) 80%, transparent);
  }

  lef-services-showcase {
    margin-top: var(--kef-space-3);
  }

  lef-afe-showcase {
    margin-top: 0.45rem;
  }

  @media (min-width: 960px) {
    [data-kefine-create] {
      --kef-task-pad-inline: 1rem;
      width: min(64rem, calc(100vw - 8rem));
    }

    lef-afe-showcase-heading,
    lef-afe-showcase {
      width: min(64rem, calc(100vw - 8rem));
    }

    lef-services-showcase {
      width: min(64rem, calc(100vw - 8rem));
    }

    fieldset[data-part='exec-row'] {
      grid-template-columns: minmax(0, 1fr) 3.95rem;
      gap: 0.5rem;
    }

    textarea[data-part='task-input'] {
      min-height: 4.5rem;
      height: 4.5rem;
      font-size: clamp(1.2rem, 1.6vw, 1.75rem);
      line-height: 1.02;
      padding-top: calc((4.5rem - 1.02em) / 2);
      padding-bottom: calc((4.5rem - 1.02em) / 2);
    }

    kefine-task-placeholder {
      padding-top: calc((4.5rem - 1.02em) / 2);
      padding-bottom: calc((4.5rem - 1.02em) / 2);
    }

    button[data-part='exec-button'] {
      height: 4.5rem;
      min-height: 4.5rem;
      max-width: 3.95rem;
    }
  }

  @media (max-width: 760px) {
    [data-kefine-create] {
      --kef-task-pad-inline: 0.78rem;
      width: min(100%, calc(100vw - 2rem));
    }

    lef-afe-showcase-heading,
    lef-afe-showcase {
      width: min(100%, calc(100vw - 2rem));
    }

    lef-services-showcase {
      width: min(100%, calc(100vw - 2rem));
    }

    lef-services-list {
      grid-template-columns: 1fr;
    }

    fieldset[data-part='exec-row'] {
      grid-template-columns: minmax(0, 1fr);
    }

    kefine-task-shell {
      width: 100%;
    }

    textarea[data-part='task-input'][data-size='hero'],
    textarea[data-part='task-input'][data-size='balanced'],
    textarea[data-part='task-input'][data-size='compact'],
    kefine-task-placeholder[data-size='hero'],
    kefine-task-placeholder[data-size='balanced'],
    kefine-task-placeholder[data-size='compact'] {
      font-size: 0.68rem;
      line-height: 1.08;
    }

    kefine-submit-popover {
      left: 0.28rem;
      right: 0.28rem;
    }

    lef-service-card {
      width: 100%;
      min-height: 0;
    }
  }
</style>
