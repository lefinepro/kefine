<script lang="ts">
  import { browser } from '$app/environment';
  import type { DraftOrder, OrderView, TemplatePresentation } from './kefine-workflow';
  import { scheduleAfter } from '$lib/utils/helpers';
  import KefineOrderListItem from '$lib/components/kefine/KefineOrderListItem.svelte';
  import { createEditor, type NodeJSON } from 'prosekit/core';
  import { ProseKit } from 'prosekit/svelte';
  import { defineBasicExtension } from 'prosekit/basic';
  import { onMount } from 'svelte';
  import hljs from 'highlight.js/lib/core';
  import rust from 'highlight.js/lib/languages/rust';
  import 'highlight.js/styles/xcode.css';
  // TODO: Add BlockHandle and DropIndicator if available

  hljs.registerLanguage('rust', rust);

  const PLACEHOLDER_TYPE_DELAY_MS = 58;
  const PLACEHOLDER_DELETE_DELAY_MS = 34;
  const PLACEHOLDER_PAUSE_MS = 1150;
  const PLACEHOLDER_NEXT_DELAY_MS = 250;

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
    solverLabel,
    matchedOrders,
    isSearching,
    matchedTasksLabel,
    addFileLabel,
    addExecutionEstimateLabel,
    fileCountLabel,
    composerHints,
    openTaskLabel,
    relatedItemsLabel,
    createServiceLabel = 'Transform to service',
    deleteTaskLabel,
    backgroundOrders = [],
    onSubmit,
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
    onExecutionEstimateChange
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
    solverLabel: string;
    matchedOrders: OrderView[];
    isSearching: boolean;
    matchedTasksLabel: string;
    addFileLabel: string;
    addExecutionEstimateLabel: string;
    fileCountLabel: (count: number) => string;
    composerHints: string;
    openTaskLabel: string;
    relatedItemsLabel: string;
    createServiceLabel?: string;
    deleteTaskLabel: string;
    backgroundOrders?: OrderView[];
    onSubmit: () => void;
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
  } = $props();

  let animatedPlaceholder = $state('');
  let placeholderVisible = $state(false);
  let placeholderFocused = $state(false);
  let inputMetaOpen = $state(false);
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
  const stopHoldTimers = new Map<string, ReturnType<typeof setTimeout>>();
  let placeholderVariantIndex = $state(0);
  let placeholderCharIndex = $state(0);
  let placeholderDeleting = $state(false);
  let taskEditorOpen = $state(false);
  let taskCompleted = $state(false);

  const sampleContent: NodeJSON = {
    type: 'doc',
    content: [
      {
        type: 'heading',
        attrs: { level: 1 },
        content: [{ type: 'text', text: 'Task Editor' }]
      },
      {
        type: 'paragraph',
        content: [{ type: 'text', text: 'Edit your task here...' }]
      }
    ]
  };

  let editor = $state(createEditor({ extension: defineBasicExtension(), defaultContent: sampleContent }));

  const mockSolutions = $state([
    {
      id: '1',
      solver: 'Basic Rust Dev',
      avatar: 'https://via.placeholder.com/40/4CAF50/FFFFFF?text=BR',
      title: 'Simple Hello World without comments',
      description: 'Minimal implementation with just the basics',
      diffs: [
        { file: 'src/main.rs', added: 3, removed: 0 }
      ],
      finalCode: `fn main() {
    println!("Hello, world!");
}`
    },
    {
      id: '2',
      solver: 'Commented Rust Expert',
      avatar: 'https://via.placeholder.com/40/2196F3/FFFFFF?text=CE',
      title: 'Hello World with detailed comments',
      description: 'Educational version with explanations for each line',
      diffs: [
        { file: 'src/main.rs', added: 10, removed: 0 }
      ],
      finalCode: `// This is the main function - entry point of every Rust program
fn main() {
    // Print a greeting message to the console
    // println! is a macro that prints to stdout with a newline
    println!("Hello, world!");

    // The program will exit here
    // Rust automatically returns () (unit type) from functions
}`
    },
    {
      id: '3',
      solver: 'Interactive Rust',
      avatar: 'https://via.placeholder.com/40/FF9800/FFFFFF?text=IR',
      title: 'Interactive Hello World with user input',
      description: 'Reads user input and responds accordingly',
      diffs: [
        { file: 'src/main.rs', added: 12, removed: 0 }
      ],
      finalCode: `use std::io;

fn main() {
    println!("Hello, world!");

    println!("What's your name?");
    let mut name = String::new();
    io::stdin().read_line(&mut name).expect("Failed to read line");

    println!("Hello, {}!", name.trim());
}`
    },
    {
      id: '4',
      solver: 'Modern Rust Patterns',
      avatar: 'https://via.placeholder.com/40/9C27B0/FFFFFF?text=MP',
      title: 'Hello World using modern Rust patterns',
      description: 'Uses Result handling and modern syntax',
      diffs: [
        { file: 'src/main.rs', added: 15, removed: 0 }
      ],
      finalCode: `use std::io::{self, Write};

fn main() -> Result<(), Box<dyn std::error::Error>> {
    println!("Hello, world!");

    print!("Enter your name: ");
    io::stdout().flush()?;

    let mut name = String::new();
    io::stdin().read_line(&mut name)?;

    println!("Hello, {}!", name.trim());
    Ok(())
}`
    }
  ]);
  const isMultilineDraft = $derived(draft.description.includes('\n'));
  const afeIntroCard = $derived(afe.cards[0] ?? null);
  const afeStepCards = $derived(afe.cards.slice(1));

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

    taskTextarea.style.height = '0px';
    taskTextarea.style.height = `${Math.min(Math.max(taskTextarea.scrollHeight, 104), 288)}px`;
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
    if (solverSearchActive && solverSearchText.trim() === "Нужен hello world на rust") {
      const timer = setTimeout(() => {
        // Simulate task completion
        taskCompleted = true;
        taskEditorOpen = false;
      }, 5000);
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

  onMount(() => {
    hljs.highlightAll();
  });



  function handleTaskInputKeydown(event: KeyboardEvent) {
    if (event.key !== 'Enter') {
      return;
    }

    if (event.shiftKey) {
      return;
    }

    if (event.altKey) {
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
    onSubmit();
  }

  function handleQueueTaskClick() {
    queuePopoverOpen = false;
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
    placeholderFocused = true;
    stopPlaceholderAnimation({ hide: true });
  }

  function handleCreateFocusOut(event: FocusEvent) {
    const currentTarget = event.currentTarget as HTMLElement;

    queueMicrotask(() => {
      if (!currentTarget.contains(document.activeElement)) {
        inputMetaOpen = false;
      }
    });
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

{#if afeIntroCard}
  <h1 class="lefine-title">Lefine</h1>
  <p class="lefine-subtitle">{afeIntroCard.detail}</p>
{/if}

<article class="kefine-card kefine-card--wide" data-kefine-create onfocusout={handleCreateFocusOut}>
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

  {#if inputMetaOpen}
    <kefine-input-meta data-part="input-meta">
      <kefine-composer-strip aria-label={composerHints}>
        <button type="button" data-part="composer-chip" title={backgroundExecuteAria} onclick={() => fileInput?.click()}>
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
          <button type="button" data-part="composer-chip" onclick={() => { executionEditorOpen = true; }}>
            <lefine-text>{addExecutionEstimateLabel}</lefine-text>
          </button>
        {/if}
        {#if tagEditorOpen}
          <input
            bind:this={tagInput}
            bind:value={tagInputValue}
            data-part="tag-input"
            placeholder="tag"
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
          <button type="button" data-part="composer-chip" data-part-tag="true" onclick={() => { tagEditorOpen = true; }}>
            <lefine-text>+ tag</lefine-text>
          </button>
        {/if}
      </kefine-composer-strip>

      {#if (draft.tags?.length ?? 0) > 0}
        <kefine-tag-strip data-has-tags="true">
          {#each draft.tags ?? [] as tag (`tag-${tag}`)}
            <button type="button" data-part="tag-pill" onclick={() => removeTag(tag)} aria-label={`Remove ${tag} tag`}>
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
            <button type="button" data-part="file-pill" onclick={() => onRemoveFile(index)}>
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
</article>

{#if isSearching && matchedOrders.length > 0}
  <section class="kefine-task-history" aria-label={isSearching ? matchedTasksLabel : solverLabel}>
    <kefine-recent-title>{matchedTasksLabel}</kefine-recent-title>
    <ul data-part="recent-list" data-compact="true" data-testid="kefine-search-results">
      {#each matchedOrders as order (order.id)}
        <KefineOrderListItem
          {order}
          {openTaskLabel}
          {relatedItemsLabel}
          {createServiceLabel}
          {deleteTaskLabel}
          showCreateService={false}
          showDelete={true}
          itemTestId={`kefine-search-order-${order.id}`}
          openTestId={`kefine-open-search-order-${order.id}`}
          deleteTestId={`kefine-delete-search-order-${order.id}`}
          onOpen={() => onOpenOrder(order)}
          onCreateService={(event) => onCreateServiceFromOrder?.(order, event)}
          onOpenKeydown={(event) => handleOpenOrderKeydown(order, event)}
          onDelete={(event) => handleDeleteClick(order, event)}
        />
      {/each}
    </ul>
  </section>
{/if}

{#if backgroundOrders.length > 0}
  <section class="kefine-task-history" aria-label={openTaskLabel}>
    <ul data-part="recent-list" data-compact="true">
      {#each backgroundOrders as order (order.id)}
        <li
          data-order-id={order.id}
          data-status={order.status}
        >
          <kefine-order-row>
            <kefine-order-mark aria-hidden="true" data-status={order.status}>
              <task-dot></task-dot>
            </kefine-order-mark>
            <kefine-order-copy>
              <kefine-order-title>{order.title}</kefine-order-title>
              {#if order.executionEstimate}
                <kefine-order-eta data-testid={`kefine-order-eta-${order.id}`}>{order.executionEstimate}</kefine-order-eta>
              {/if}
            </kefine-order-copy>
            <kefine-order-actions>
              <button
                type="button"
                data-part="status-toggle"
                data-testid={`kefine-stop-order-${order.id}`}
                data-status={order.status}
                onpointerdown={(e) => {
                  stopHoldTimers.set(order.id, setTimeout(() => {
                    stopHoldTimers.delete(order.id);
                    onStopOrder?.(order, e);
                  }, 500));
                }}
                onpointerup={() => {
                  const t = stopHoldTimers.get(order.id);
                  if (t !== undefined) {
                    clearTimeout(t);
                    stopHoldTimers.delete(order.id);
                  }
                }}
                onpointerleave={() => {
                  const t = stopHoldTimers.get(order.id);
                  if (t !== undefined) {
                    clearTimeout(t);
                    stopHoldTimers.delete(order.id);
                  }
                }}
                onpointercancel={() => {
                  const t = stopHoldTimers.get(order.id);
                  if (t !== undefined) {
                    clearTimeout(t);
                    stopHoldTimers.delete(order.id);
                  }
                }}
                onclick={(e) => onStopOrder?.(order, e)}
              >
                <status-mark aria-hidden="true" data-status={order.status}><task-dot></task-dot></status-mark>
                <lefine-text>{deleteTaskLabel}</lefine-text>
              </button>
              <button
                type="button"
                data-part="open-task"
                data-testid={`kefine-open-order-${order.id}`}
                onclick={() => onOpenOrder(order)}
              >
                <lefine-text>{openTaskLabel}</lefine-text>
              </button>
            </kefine-order-actions>
          </kefine-order-row>
        </li>
      {/each}
    </ul>
  </section>
{/if}

{#if pinnedServices.length > 0}
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

 {#if solverSearchActive && solverSearchText.trim()}
   <section data-part="tasks-list">
     <kefine-task-item data-part="task-item" onclick={() => { taskEditorOpen = !taskEditorOpen; }}>
        {#if taskEditorOpen}
          <lefine-box class="task-notebook" onclick={(e: MouseEvent) => { e.stopPropagation(); }}>
            <header class="task-notebook__header">
              <lefine-box class="task-notebook__title-row">
                <lefine-text class="task-notebook__icon" aria-hidden="true">{taskCompleted ? '✓' : '◎'}</lefine-text>
                <h2 class="task-notebook__title">{taskCompleted ? 'Task Results' : 'Task Editor'}</h2>
              </lefine-box>
              <button
                type="button"
                class="task-notebook__close"
                onclick={(e: MouseEvent) => { e.stopPropagation(); taskEditorOpen = false; }}
                aria-label="Close"
              >✕</button>
            </header>

            <lefine-box class="task-notebook__body" onclick={(e: MouseEvent) => e.stopPropagation()}>
              <lefine-box class="task-notebook__editor">
                <ProseKit {editor}>
                  <lefine-box {@attach editor.mount} class="task-notebook__prose ProseMirror">
                    {#if taskCompleted}
                      <p>Task completed successfully!</p>
                    {/if}
                  </lefine-box>
                </ProseKit>
              </lefine-box>

              {#if taskCompleted}
                <section class="task-notebook__results">
                  <h3 class="task-notebook__section-title">Solutions</h3>
                  <lefine-box class="solutions-scroll">
                    {#each mockSolutions as solution (solution.id)}
                      <article class="solution-card">
                        <header class="solution-card__header">
                          <lefine-box class="solution-card__avatar" aria-hidden="true">{solution.solver.slice(0, 2)}</lefine-box>
                          <lefine-box class="solution-card__meta">
                            <strong>{solution.solver}</strong>
                            <lefine-text>{solution.title}</lefine-text>
                          </lefine-box>
                        </header>
                        <p class="solution-card__description">{solution.description}</p>
                        <lefine-box class="diff-summary">
                          {#each solution.diffs as diff}
                            <lefine-text class="diff-file">
                              {diff.file}
                              <lefine-text class="diff-added">+{diff.added}</lefine-text>
                              {#if diff.removed > 0}<lefine-text class="diff-removed">-{diff.removed}</lefine-text>{/if}
                            </lefine-text>
                          {/each}
                        </lefine-box>
                        <lefine-box class="code-diff">
                          <pre><code>{solution.finalCode}</code></pre>
                        </lefine-box>
                      </article>
                    {/each}
                  </lefine-box>
                </section>
              {/if}
            </lefine-box>
          </lefine-box>
        {:else}
          <kefine-solver-search-row aria-live="polite">
            <lefine-text>{solverSearchText}</lefine-text>
            <kefine-solver-search-indicator aria-label={taskCompleted ? 'Completed' : solverSearchLabel} title={taskCompleted ? 'Completed' : solverSearchLabel} data-completed={taskCompleted}>
              <kefine-solver-search-dot aria-hidden="true"></kefine-solver-search-dot>
            </kefine-solver-search-indicator>
          </kefine-solver-search-row>
        {/if}
     </kefine-task-item>
   </section>
 {/if}

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

<style>
  [data-kefine-create] {
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
  }

  [data-part='task-item'] {
    cursor: pointer;
  }

  /* Notebook-style post-execution task view */
  .task-notebook {
    display: grid;
    border: var(--kef-border-width-soft) solid var(--kef-line);
    border-radius: 0.85rem;
    background: var(--kef-bg-card);
    box-shadow:
      0 8px 24px color-mix(in oklab, var(--lefine-text) 4%, transparent),
      0 2px 6px color-mix(in oklab, var(--lefine-text) 2%, transparent);
    overflow: hidden;
    cursor: default;
  }

  .task-notebook__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0.75rem 1rem;
    background: color-mix(in oklab, var(--kef-bg) 72%, var(--kef-bg-card) 28%);
    border-bottom: var(--kef-border-width-soft) solid var(--kef-line);
    gap: 0.75rem;
  }

  .task-notebook__title-row {
    display: flex;
    align-items: center;
    gap: 0.55rem;
    min-width: 0;
  }

  .task-notebook__icon {
    font-size: 1rem;
    color: var(--kef-primary);
    flex: 0 0 auto;
  }

  .task-notebook__title {
    margin: 0;
    font-size: 0.98rem;
    font-weight: 650;
    color: var(--lefine-text);
    letter-spacing: -0.01em;
  }

  .task-notebook__close {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 1.8rem;
    height: 1.8rem;
    border-radius: 999px;
    border: var(--kef-border-width-soft) solid var(--kef-line);
    background: transparent;
    color: var(--lefine-text-soft);
    font-size: 0.75rem;
    cursor: pointer;
    flex: 0 0 auto;
    transition: background var(--kef-motion-fast) var(--kef-ease-soft);
  }

  .task-notebook__close:hover {
    background: color-mix(in oklab, var(--kef-bg) 80%, var(--kef-bg-card) 20%);
    color: var(--lefine-text);
  }

  .task-notebook__body {
    display: grid;
    gap: 0;
  }

  .task-notebook__editor {
    min-height: 8rem;
    padding: 1rem 1.2rem;
    border-bottom: var(--kef-border-width-soft) solid var(--kef-line);
  }

  .task-notebook__prose {
    min-height: 6rem;
    outline: none;
    font-size: 0.92rem;
    line-height: 1.6;
    color: var(--lefine-text);
    caret-color: var(--kef-primary);
  }

  .task-notebook__prose p {
    margin: 0 0 0.5em;
  }

  .task-notebook__results {
    padding: 0.85rem 1rem 1rem;
    display: grid;
    gap: 0.65rem;
  }

  .task-notebook__section-title {
    margin: 0;
    font-size: 0.82rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.07em;
    color: var(--lefine-text-soft);
  }

  /* Horizontal solutions scroll */
  .solutions-scroll {
    display: flex;
    flex-direction: row;
    gap: 0.75rem;
    overflow-x: auto;
    overflow-y: hidden;
    padding-bottom: 0.5rem;
    scroll-snap-type: x mandatory;
    -webkit-overflow-scrolling: touch;
    scrollbar-width: thin;
    scrollbar-color: color-mix(in oklab, var(--kef-line) 60%, transparent) transparent;
  }

  .solutions-scroll::-webkit-scrollbar {
    height: 3px;
  }

  .solutions-scroll::-webkit-scrollbar-track {
    background: transparent;
  }

  .solutions-scroll::-webkit-scrollbar-thumb {
    background: color-mix(in oklab, var(--kef-line) 60%, transparent);
    border-radius: 999px;
  }

  /* Solution card (diff view) */
  .solution-card {
    flex: 0 0 auto;
    width: min(22rem, 80vw);
    display: grid;
    gap: 0.7rem;
    border: var(--kef-border-width-soft) solid var(--kef-line);
    border-radius: 0.75rem;
    padding: 0.85rem;
    background: color-mix(in oklab, var(--kef-bg-card) 96%, var(--kef-bg-soft) 4%);
    scroll-snap-align: start;
  }

  .solution-card__header {
    display: flex;
    align-items: center;
    gap: 0.65rem;
    min-width: 0;
  }

  .solution-card__avatar {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 2.2rem;
    height: 2.2rem;
    border-radius: 999px;
    background: linear-gradient(135deg, var(--kef-primary), color-mix(in oklab, var(--kef-primary) 72%, black 28%));
    color: color-mix(in oklab, white 92%, var(--kef-primary) 8%);
    font-size: 0.78rem;
    font-weight: 700;
    flex: 0 0 auto;
  }

  .solution-card__meta {
    display: grid;
    gap: 0.12rem;
    min-width: 0;
  }

  .solution-card__meta strong {
    font-size: 0.9rem;
    color: var(--lefine-text);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .solution-card__meta span {
    font-size: 0.8rem;
    color: var(--lefine-text-soft);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .solution-card__description {
    margin: 0;
    font-size: 0.84rem;
    color: var(--lefine-text-soft);
    line-height: 1.45;
  }

  /* Diff view */
  .diff-summary {
    display: flex;
    flex-wrap: wrap;
    gap: 0.4rem;
  }

  .diff-file {
    display: inline-flex;
    align-items: center;
    gap: 0.35rem;
    font-size: 0.76rem;
    font-family: monospace;
    background: color-mix(in oklab, var(--kef-bg) 88%, var(--kef-bg-soft) 12%);
    padding: 0.22rem 0.55rem;
    border-radius: 0.35rem;
    color: var(--lefine-text-soft);
    border: var(--kef-border-width-soft) solid var(--kef-line);
  }

  .diff-added {
    color: #22c55e;
    font-weight: 700;
  }

  .diff-removed {
    color: #ef4444;
    font-weight: 700;
  }

  .code-diff {
    background: color-mix(in oklab, var(--kef-bg) 88%, black 12%);
    border-radius: 0.55rem;
    overflow-x: auto;
    font-size: 0.82rem;
    border: var(--kef-border-width-soft) solid color-mix(in oklab, var(--kef-line) 70%, transparent);
  }

  .code-diff pre {
    margin: 0;
    padding: 0.75rem 0.9rem;
  }

  .code-diff code {
    font-family: ui-monospace, 'Cascadia Code', 'Source Code Pro', Menlo, Consolas, monospace;
    color: var(--lefine-text);
    white-space: pre;
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
    grid-template-columns: minmax(0, 1fr) auto;
    align-items: center;
    gap: 0.72rem;
    min-height: 2.85rem;
    padding: 0.42rem 0.5rem 0.42rem 0.78rem;
    border-radius: 0.38rem;
    background: color-mix(in oklab, var(--kef-bg-card) 96%, var(--kef-bg));
    box-shadow: none;
  }

  kefine-solver-search-row lefine-text {
    min-width: 0;
    overflow: hidden;
    color: color-mix(in oklab, var(--lefine-text) 92%, transparent);
    font-size: 0.92rem;
    font-weight: 650;
    line-height: 1.15;
    text-overflow: ellipsis;
    white-space: nowrap;
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
    background: color-mix(in oklab, #22c55e 9%, var(--kef-bg-card));
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
    overflow-x: auto;
    overflow-y: hidden;
    padding-inline: clamp(0.72rem, 2.5vw, 0.92rem);
    padding-top: max(0.48rem, calc((clamp(3.3rem, 7vw, 4rem) - 1.04em) / 2));
    padding-bottom: max(0.48rem, calc((clamp(3.3rem, 7vw, 4rem) - 1.04em) / 2));
    overflow-wrap: normal;
    white-space: nowrap;
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
    padding-inline: clamp(0.72rem, 2.5vw, 0.92rem);
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
    border: 0;
    background: color-mix(in oklab, var(--kef-bg-card) 90%, var(--kef-bg-soft) 10%);
    color: var(--lefine-text);
    font: inherit;
    box-shadow: none;
  }

  button[data-part='composer-chip'] {
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;
    letter-spacing: -0.01em;
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

  .kefine-task-history {
    display: grid;
    gap: 0.65rem;
    min-height: 0;
  }

  .kefine-task-history {
    width: min(100%, calc(100vw - 7rem));
    max-width: 64rem;
    justify-self: center;
    margin-inline: auto;
    margin-top: var(--kef-space-3);
    padding: 0.85rem 1rem;
    border-radius: var(--kef-radius-ui);
    background: color-mix(in oklab, var(--kef-bg-card) 88%, var(--kef-bg-soft) 12%);
    border: var(--kef-border-width-soft) solid var(--kef-line);
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

  lef-services-showcase {
    margin-top: var(--kef-space-3);
  }

  lef-afe-showcase {
    margin-top: 0.45rem;
  }

  @media (min-width: 960px) {
    [data-kefine-create] {
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
      padding-inline: 1rem;
      padding-top: calc((4.5rem - 1.02em) / 2);
      padding-bottom: calc((4.5rem - 1.02em) / 2);
    }

    kefine-task-placeholder {
      padding-inline: 1rem;
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

    textarea[data-part='task-input'],
    kefine-task-placeholder {
      padding-inline: 0.78rem;
    }

    kefine-submit-popover {
      left: 0.28rem;
      right: 0.28rem;
    }

    lef-service-card {
      width: 100%;
      min-height: 0;
    }

    .solution-card {
      width: min(17rem, 78vw);
    }
  }
</style>
