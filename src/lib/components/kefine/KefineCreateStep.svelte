<script lang="ts">
  import type { DraftOrder, OrderView, TemplatePresentation } from './kefine-workflow';
  import { scheduleAfter } from '$lib/utils/helpers';
  import KefineOrderListItem from '$lib/components/kefine/KefineOrderListItem.svelte';

  const PLACEHOLDER_TYPE_DELAY_MS = 58;
  const PLACEHOLDER_DELETE_DELAY_MS = 34;
  const PLACEHOLDER_PAUSE_MS = 1150;
  const PLACEHOLDER_NEXT_DELAY_MS = 250;

  let {
    draft,
    template,
    pinnedServices,
    pinnedServicesTitle,
    pinnedServicesSubtitle,
    titleFontSize,
    title,
    subtitle,
    afe,
    placeholder,
    placeholderVariants,
    executeAria,
    backgroundExecuteAria,
    solverLabel,
    recentOrders,
    matchedOrders,
    isSearching,
    totalOrders,
    hasMoreOrders,
    matchedTasksLabel,
    addFileLabel,
    addPriceLabel,
    fileCountLabel,
    composerHints,
    timeLeftLabel,
    priceLabel,
    statusLabel,
    stopTaskLabel,
    onSubmit,
    onQueueTask,
    onAttachFiles,
    onRemoveFile,
    onStopOrder,
    onOpenOrder,
    onLoadMoreOrders,
    onDescriptionChange,
    onTemplateVariableChange,
    onTagsChange,
    onCostChange,
    onCurrencyChange
  }: {
    draft: DraftOrder;
    template: TemplatePresentation | null;
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
    subtitle: string;
    afe: {
      title: string;
      cards: Array<{
        title: string;
        detail: string;
      }>;
    };
    placeholder: string;
    placeholderVariants: readonly string[];
    executeAria: string;
    backgroundExecuteAria: string;
    solverLabel: string;
    recentOrders: OrderView[];
    matchedOrders: OrderView[];
    isSearching: boolean;
    totalOrders: number;
    hasMoreOrders: boolean;
    matchedTasksLabel: string;
    addFileLabel: string;
    addPriceLabel: string;
    fileCountLabel: (count: number) => string;
    composerHints: string;
    timeLeftLabel: string;
    priceLabel: string;
    statusLabel: string;
    stopTaskLabel: string;
    onSubmit: () => void;
    onQueueTask: () => Promise<void> | void;
    onAttachFiles: (files: File[]) => void;
    onRemoveFile: (index: number) => void;
    onStopOrder: (order: OrderView, event: Event) => void;
    onOpenOrder: (order: OrderView) => void;
    onLoadMoreOrders: () => void;
    onDescriptionChange?: (value: string) => void;
    onTemplateVariableChange?: (key: string, value: string) => void;
    onTagsChange?: (tags: string[]) => void;
    onCostChange?: (value: string) => void;
    onCurrencyChange?: (value: string) => void;
  } = $props();

  let animatedPlaceholder = $state('');
  let placeholderVisible = $state(false);
  let placeholderFocused = $state(false);
  let isLoadingMore = $state(false);
  let priceEditorOpen = $state(false);
  let tagEditorOpen = $state(false);
  let tagInputValue = $state('');
  let taskTextarea = $state<HTMLTextAreaElement | null>(null);
  let fileInput = $state<HTMLInputElement | null>(null);
  let filePreviews = $state<Map<number, string>>(new Map());
  let touchStopTimers = new Map<string, () => void>();
  let touchStopTriggered = new Set<string>();
  let cancelPlaceholderTick: (() => void) | null = null;
  let placeholderVariantIndex = $state(0);
  let placeholderCharIndex = $state(0);
  let placeholderDeleting = $state(false);
  const isMultilineDraft = $derived(draft.description.includes('\n'));
  const afeIntroCard = $derived(afe.cards[0] ?? null);
  const afeStepCards = $derived(afe.cards.slice(1));

  function getServiceInitial(title: string): string {
    const normalized = title.trim();
    if (!normalized) {
      return 'S';
    }

    const match = normalized.match(/[A-Za-zА-Яа-яԱ-Ֆա-ֆ0-9]/u);
    return (match?.[0] ?? normalized[0] ?? 'S').toUpperCase();
  }

  function getServiceAccent(title: string): string {
    const seed = Array.from(title.trim()).reduce((sum, char) => sum + char.charCodeAt(0), 0);
    const hue = seed % 360;
    return `hsl(${hue} 70% 54%)`;
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
    return () => {
      cancelPlaceholderTick?.();
      cancelPlaceholderTick = null;

      for (const cancelTimer of touchStopTimers.values()) {
        cancelTimer();
      }

      touchStopTimers = new Map();
      touchStopTriggered = new Set();
    };
  });



  function handleTaskInputKeydown(event: KeyboardEvent) {
    if (event.key !== 'Enter') {
      return;
    }

    event.preventDefault();

    if (event.shiftKey) {
      void onQueueTask();
      return;
    }

    if (event.altKey) {
      void onQueueTask();
      return;
    }

    onSubmit();
  }

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

  function handleRecentOrdersScroll(event: Event) {
    if (!hasMoreOrders || isLoadingMore) return;

    const target = event.currentTarget as HTMLDivElement | null;
    if (!target) return;

    const nearBottom = target.scrollHeight - target.scrollTop - target.clientHeight <= 36;
    if (!nearBottom) return;

    isLoadingMore = true;
    onLoadMoreOrders();
    requestAnimationFrame(() => {
      isLoadingMore = false;
    });
  }

  function startStopPress(order: OrderView, event: PointerEvent) {
    if (event.pointerType === 'mouse') {
      return;
    }

    clearStopPress(order.id);
    event.preventDefault();
    event.stopPropagation();

    const cancelTimer = scheduleAfter(550, () => {
      touchStopTriggered = new Set([...touchStopTriggered, order.id]);
      onStopOrder(order, event);
      clearStopPress(order.id);
    });

    touchStopTimers = new Map(touchStopTimers).set(order.id, cancelTimer);
  }

  function clearStopPress(orderId: string) {
    const cancelTimer = touchStopTimers.get(orderId);
    if (cancelTimer) {
      cancelTimer();
      const nextTimers = new Map(touchStopTimers);
      nextTimers.delete(orderId);
      touchStopTimers = nextTimers;
    }
  }

  function handleStopClick(order: OrderView, event: MouseEvent) {
    const wasTouchTriggered = touchStopTriggered.has(order.id);
    if (wasTouchTriggered) {
      const nextTriggered = new Set(touchStopTriggered);
      nextTriggered.delete(order.id);
      touchStopTriggered = nextTriggered;
      event.preventDefault();
      event.stopPropagation();
      return;
    }

    onStopOrder(order, event);
  }

  function handleOpenOrderKeydown(order: OrderView, event: KeyboardEvent) {
    if (event.key !== 'Enter' && event.key !== ' ') {
      return;
    }

    event.preventDefault();
    onOpenOrder(order);
  }

  function handleTaskInputFocus() {
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
    placeholderFocused = true;
    stopPlaceholderAnimation({ hide: true });
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

<article class="kefine-card kefine-card--wide" data-kefine-create>
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

  {#if template && (draft.templateVariables?.length ?? 0) > 0}
    <section data-part="template-variables">
      {#each draft.templateVariables ?? [] as variable (`template-var-${variable.key}`)}
        <label data-part="template-variable-field">
          <lefine-text>:{variable.key}</lefine-text>
          <input
            value={draft.templateVariableValues?.[variable.key] ?? variable.defaultValue ?? ''}
            placeholder={`:${variable.key}`}
            oninput={(event) => onTemplateVariableChange?.(variable.key, (event.currentTarget as HTMLInputElement).value)}
          />
        </label>
      {/each}
    </section>
  {/if}

  <h2>{title}</h2>
  <p data-part="subtitle">{subtitle}</p>

  <form
    data-part="form"
    onsubmit={(event) => {
      event.preventDefault();
      onSubmit();
    }}
  >
    <fieldset data-part="exec-row" data-testid="kefine-create-form">
      <kefine-task-shell>
        <textarea
          id="order-title"
          bind:this={taskTextarea}
          value={draft.description}
          data-part="task-input"
          data-empty={!draft.description.trim()}
          data-multiline={isMultilineDraft}
          readonly={Boolean(template && draft.templatePromptTemplate)}
          data-testid="kefine-task-input"
          style={`--kef-task-font-size: ${titleFontSize}rem;`}
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
            style={`--kef-task-font-size: ${titleFontSize}rem;`}
            aria-hidden="true"
          >
            {animatedPlaceholder}
          </kefine-task-placeholder>
        {/if}
      </kefine-task-shell>
      <button
        type="submit"
        data-variant="primary"
        data-part="exec-button"
        data-testid="kefine-submit-task"
        aria-label={executeAria}
      >
        <kefine-exec-arrow aria-hidden="true">➵</kefine-exec-arrow>
      </button>
    </fieldset>

    <kefine-composer-strip aria-label={composerHints}>
      <button type="button" data-part="composer-chip" title={backgroundExecuteAria} onclick={() => fileInput?.click()}>
        <lefine-text>{addFileLabel}</lefine-text>
        {#if draft.files.length > 0}
          <strong>{fileCountLabel(draft.files.length)}</strong>
        {/if}
      </button>
      {#if priceEditorOpen}
        <kefine-price-editor>
          <input 
            value={draft.estimatedCost} 
            data-part="price-input" 
            inputmode="decimal"
            oninput={(e) => onCostChange?.((e.currentTarget as HTMLInputElement).value)}
          />
          <input 
            value={draft.currency} 
            data-part="currency-input" 
            maxlength="8"
            oninput={(e) => onCurrencyChange?.((e.currentTarget as HTMLInputElement).value)}
          />
        </kefine-price-editor>
      {:else}
        <button type="button" data-part="composer-chip" onclick={() => { priceEditorOpen = true; }}>
          <lefine-text>{addPriceLabel}</lefine-text>
        </button>
      {/if}
      {#if tagEditorOpen}
        <input
          bind:value={tagInputValue}
          data-part="tag-input"
          placeholder="tag"
          maxlength="32"
          autofocus
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
      <input bind:this={fileInput} data-part="file-input" type="file" multiple onchange={handleFileChange} />
    </kefine-composer-strip>

    <kefine-tag-strip data-has-tags={(draft.tags?.length ?? 0) > 0}>
      {#each draft.tags ?? [] as tag (`tag-${tag}`)}
        <button type="button" data-part="tag-pill" onclick={() => removeTag(tag)} aria-label={`Remove ${tag} tag`}>
          <lefine-text>#{tag}</lefine-text>
          <strong>×</strong>
        </button>
      {/each}
    </kefine-tag-strip>

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

    <p data-part="composer-hints">{composerHints}</p>
  </form>

  {#if (isSearching && matchedOrders.length > 0) || totalOrders > 0}
    <section data-part="recent" aria-label={isSearching ? matchedTasksLabel : solverLabel}>
      {#if isSearching && matchedOrders.length > 0}
        <kefine-recent-title>{matchedTasksLabel}</kefine-recent-title>
        <ul data-part="recent-list" data-compact="true" data-testid="kefine-search-results">
          {#each matchedOrders as order (order.id)}
            <KefineOrderListItem
              {order}
              {statusLabel}
              {timeLeftLabel}
              {priceLabel}
              itemTestId={`kefine-search-order-${order.id}`}
              openTestId={`kefine-open-search-order-${order.id}`}
              etaTestId={`kefine-order-eta-${order.id}`}
              onOpen={() => onOpenOrder(order)}
              onOpenKeydown={(event) => handleOpenOrderKeydown(order, event)}
            />
          {/each}
        </ul>
      {:else if totalOrders > 0}
        <section data-part="recent-scroll" data-testid="kefine-recent-scroll" onscroll={handleRecentOrdersScroll}>
          <ul data-part="recent-list" data-testid="kefine-recent-list">
            {#each recentOrders as order (order.id)}
              <KefineOrderListItem
                {order}
                {statusLabel}
                {timeLeftLabel}
                {priceLabel}
                {stopTaskLabel}
                showStop={true}
                itemTestId={`kefine-order-item-${order.id}`}
                openTestId={`kefine-open-order-${order.id}`}
                etaTestId={`kefine-order-eta-${order.id}`}
                stopTestId={`kefine-stop-order-${order.id}`}
                onOpen={() => onOpenOrder(order)}
                onOpenKeydown={(event) => handleOpenOrderKeydown(order, event)}
                onStop={(event) => handleStopClick(order, event)}
                onStopPointerDown={(event) => startStopPress(order, event)}
                onStopPointerUp={() => clearStopPress(order.id)}
                onStopPointerLeave={() => clearStopPress(order.id)}
                onStopPointerCancel={() => clearStopPress(order.id)}
              />
            {/each}
          </ul>
        </section>
      {/if}
    </section>
  {/if}
</article>

{#if pinnedServices.length > 0}
  <section class="kefine-services-showcase" data-part="pinned-services">
    <lefine-box class="kefine-services-head">
      <strong>{pinnedServicesTitle}</strong>
      <p>{pinnedServicesSubtitle}</p>
    </lefine-box>

    <lefine-box class="kefine-services-list">
      {#each pinnedServices as service (service.id)}
        <a class="kefine-service-card" href={service.href}>
          {#if service.imageDataUrl}
            <img class="kefine-service-card__image" src={service.imageDataUrl} alt="" />
          {:else}
            <lefine-box
              class="kefine-service-card__icon"
              style={`--service-accent: ${getServiceAccent(service.title)};`}
              aria-hidden="true"
            >
              <span>{getServiceInitial(service.title)}</span>
            </lefine-box>
          {/if}

          <lefine-box class="kefine-service-card__copy">
            <strong>{service.title}</strong>
            <p>{service.description}</p>
            <lefine-text>@{service.authorHandle}</lefine-text>
          </lefine-box>
        </a>
      {/each}
    </lefine-box>
  </section>
{/if}

<section class="kefine-afe-showcase" data-part="below-fold">
  <lefine-box class="kefine-afe-layout">
    {#if afeIntroCard}
      <article class="kefine-afe-intro">
        <p class="kefine-afe-intro__eyebrow">{afeIntroCard.title}</p>
        <h3>{afeIntroCard.detail}</h3>
      </article>
    {/if}

    <lefine-box class="kefine-afe-steps">
      <lefine-box class="kefine-section-head">
        <p>{afe.title}</p>
      </lefine-box>

      <lefine-box class="kefine-afe-grid kefine-afe-grid--executing">
        {#each afeStepCards as card}
          <article class="kefine-afe-card kefine-afe-card--executing">
            <strong>{card.title}</strong>
            <p>{card.detail}</p>
          </article>
        {/each}
      </lefine-box>
    </lefine-box>
  </lefine-box>
</section>

<style>
  [data-kefine-create] {
    grid-template-rows: auto auto auto minmax(0, auto);
    align-content: start;
    width: min(100%, calc(100vw - 7rem));
    max-width: 64rem;
    justify-self: center;
    margin-inline: auto;
  }

  .kefine-afe-showcase {
    width: min(100%, calc(100vw - 7rem));
    max-width: 64rem;
    justify-self: center;
    margin-inline: auto;
  }

  .kefine-services-showcase {
    width: min(100%, calc(100vw - 7rem));
    max-width: 64rem;
    justify-self: center;
    margin-inline: auto;
    display: grid;
    gap: 0.7rem;
    padding: 0.95rem 1rem 1rem;
    border-radius: var(--kef-radius-ui);
    background: color-mix(in oklab, var(--kef-bg-card) 90%, var(--kef-bg-soft) 10%);
    border: 1px solid color-mix(in oklab, var(--kef-line-strong) 82%, transparent);
    box-shadow: none;
  }

  .kefine-services-head,
  .kefine-services-list,
  .kefine-service-card,
  .kefine-service-card__copy {
    display: grid;
    gap: 0.75rem;
  }

  .kefine-services-head {
    gap: 0.28rem;
  }

  .kefine-services-head strong {
    font-size: clamp(0.98rem, 1.3vw, 1.1rem);
    letter-spacing: -0.02em;
  }

  .kefine-services-head p,
  .kefine-services-head strong,
  .kefine-service-card__copy p,
  .kefine-service-card__copy strong,
  .kefine-service-card__copy lefine-text {
    margin: 0;
  }

  .kefine-services-head p,
  .kefine-service-card__copy p,
  .kefine-service-card__copy lefine-text {
    color: var(--lefine-text-soft);
  }

  .kefine-services-head p {
    max-width: 28rem;
    font-size: 0.8rem;
  }

  .kefine-services-list {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 0.8rem;
    justify-items: start;
  }

  .kefine-service-card {
    grid-template-columns: auto minmax(0, 1fr);
    align-items: start;
    gap: 0.6rem;
    width: min(100%, 18rem);
    min-height: 7.4rem;
    padding: 0.85rem 0.9rem;
    border-radius: var(--kef-radius-ui);
    background: color-mix(in oklab, var(--kef-bg-card) 94%, var(--kef-bg) 6%);
    border: 1px solid color-mix(in oklab, var(--kef-line-strong) 72%, transparent);
    box-shadow: none;
    color: inherit;
    text-decoration: none;
  }

  .kefine-service-card__image,
  .kefine-service-card__icon {
    width: 2.1rem;
    height: 2.1rem;
    border-radius: var(--kef-radius-ui);
    flex: 0 0 auto;
  }

  .kefine-service-card__image {
    object-fit: cover;
  }

  .kefine-service-card__icon {
    display: grid;
    place-items: center;
    background:
      linear-gradient(180deg, color-mix(in oklab, var(--service-accent) 72%, var(--kef-bg-soft)), color-mix(in oklab, var(--service-accent) 84%, black 16%));
    color: color-mix(in oklab, white 88%, var(--kef-bg-card));
    border: 1px solid color-mix(in oklab, var(--service-accent) 34%, transparent);
  }

  .kefine-service-card__icon span {
    font-size: 0.8rem;
    font-weight: 700;
    line-height: 1;
  }

  .kefine-service-card__copy {
    min-width: 0;
  }

  .kefine-service-card__copy strong {
    font-size: 0.92rem;
    letter-spacing: -0.01em;
  }

  .kefine-service-card__copy p {
    line-height: 1.35;
    font-size: 0.82rem;
    line-clamp: 2;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  .kefine-service-card:hover {
    border-color: color-mix(in oklab, var(--kef-primary) 22%, transparent);
    background: color-mix(in oklab, var(--kef-bg-card) 88%, var(--kef-bg-soft));
  }

  [data-kefine-create] h2 {
    font-size: clamp(1.35rem, 2vw, 1.75rem);
    margin: 0;
  }

  p[data-part='subtitle'] {
    margin: 0;
    max-width: 42rem;
    color: var(--lefine-text-soft);
  }

  section[data-part='template-banner'] {
    display: flex;
    justify-content: space-between;
    gap: 0.9rem;
    padding: 0.85rem 1rem;
    border-radius: 0.6rem;
    background: color-mix(in oklab, var(--kef-primary) 10%, var(--kef-bg-card));
    border: 1px solid color-mix(in oklab, var(--kef-primary) 28%, transparent);
  }

  section[data-part='template-variables'] {
    display: grid;
    gap: 0.75rem;
    grid-template-columns: repeat(auto-fit, minmax(10rem, 1fr));
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
    border: 1px solid color-mix(in oklab, var(--kef-border) 78%, transparent);
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

  button[data-part='tag-add'],
  button[data-part='tag-pill'] {
    display: inline-flex;
    align-items: center;
    gap: 0.45rem;
    min-height: 2rem;
    padding: 0.35rem 0.75rem;
    border-radius: 999px;
    border: 1px solid color-mix(in oklab, var(--kef-border) 80%, transparent);
    background: color-mix(in oklab, var(--kef-bg-card) 92%, white 8%);
    color: var(--lefine-text);
    flex: 0 0 auto;
  }

  button[data-part='tag-add'] {
    border-style: dashed;
    color: var(--lefine-text-soft);
  }

  button[data-part='composer-chip'][data-part-tag='true'] {
    border-style: dashed;
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
    border: 1px dashed color-mix(in oklab, var(--kef-primary) 45%, transparent);
    background: color-mix(in oklab, var(--kef-bg-card) 94%, white 6%);
    color: var(--lefine-text);
    flex: 0 0 auto;
  }

  input[data-part='tag-input']:focus {
    outline: none;
    border-color: color-mix(in oklab, var(--kef-primary) 80%, transparent);
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

  form[data-part='form'] {
    display: grid;
    gap: 0.75rem;
  }

  fieldset[data-part='exec-row'] {
    display: grid;
    grid-template-columns: minmax(0, 1fr) 4.05rem;
    gap: clamp(0.45rem, 2vw, 0.75rem);
    align-items: center;
    border-radius: 0.38rem;
    padding: 0.28rem;
    margin: 0;
    border: 0;
    min-inline-size: 0;
    background: color-mix(in oklab, var(--kef-bg-card) 98%, var(--kef-bg));
    box-shadow: inset 0 0 0 1px color-mix(in oklab, var(--kef-bg) 42%, transparent);
  }

  fieldset[data-part='exec-row']:focus-within {
    box-shadow: inset 0 0 0 1px color-mix(in oklab, var(--kef-bg-card) 78%, transparent), var(--kef-ring-focus);
  }

  kefine-task-shell {
    margin: 0;
    display: grid;
    gap: 0.5rem;
    min-width: 0;
    position: relative;
  }

  textarea[data-part='task-input'] {
    min-height: clamp(3.3rem, 7vw, 4rem);
    height: clamp(3.3rem, 7vw, 4rem);
    max-height: 18rem;
    font-size: var(--kef-task-font-size, clamp(1.15rem, 2.7vw, 2.2rem));
    font-weight: 740;
    line-height: 1.04;
    letter-spacing: -0.02em;
    text-align: left;
    color: var(--kef-on-primary);
    background: var(--kef-primary);
    border: var(--kef-border-width-strong) solid var(--kef-line-strong);
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
    box-shadow: 0 16px 24px color-mix(in oklab, var(--kef-primary) 14%, transparent);
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
    min-height: clamp(3.3rem, 7vw, 4rem);
    padding-inline: clamp(0.72rem, 2.5vw, 0.92rem);
    padding-top: max(0.48rem, calc((clamp(3.3rem, 7vw, 4rem) - 1.04em) / 2));
    padding-bottom: max(0.48rem, calc((clamp(3.3rem, 7vw, 4rem) - 1.04em) / 2));
    color: color-mix(in oklab, var(--kef-on-primary) 78%, transparent);
    font-size: var(--kef-task-font-size, clamp(1.15rem, 2.7vw, 2.2rem));
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

  kefine-composer-strip {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    align-items: center;
    padding: 0.05rem 0 0.2rem;
    border-bottom: 1px dashed color-mix(in oklab, var(--kef-line) 52%, transparent);
  }

  button[data-part='composer-chip'],
  input[data-part='price-input'],
  input[data-part='currency-input'],
  button[data-part='file-pill'] {
    min-height: 2.35rem;
    padding: 0.5rem 0.95rem;
    border-radius: 999px;
    border: 1px solid color-mix(in oklab, var(--kef-on-primary) 10%, transparent);
    background: color-mix(in oklab, var(--kef-bg) 76%, black 24%);
    color: var(--lefine-text);
    font: inherit;
    box-shadow: inset 0 1px 0 color-mix(in oklab, white 3%, transparent);
  }

  button[data-part='composer-chip'] {
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;
    letter-spacing: -0.01em;
  }

  kefine-price-editor {
    display: flex;
    gap: 0.5rem;
    align-items: center;
  }

  input[data-part='price-input'] {
    width: 7rem;
  }

  input[data-part='currency-input'] {
    width: 5.5rem;
    text-transform: uppercase;
  }

  input[data-part='price-input'],
  input[data-part='currency-input'] {
    background: color-mix(in oklab, var(--kef-bg-card) 70%, black 30%);
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

  section[data-part='recent-scroll'] {
    border: 0;
    border-radius: 0.35rem;
    height: auto;
    max-height: min(40vh, 24rem);
    overflow: auto;
    padding: clamp(0.3rem, 2vw, 0.5rem);
    background: transparent;
  }

  .kefine-services-showcase,
  section[data-part='below-fold'] {
    margin-top: var(--kef-space-3);
  }

  @media (min-width: 960px) {
    [data-kefine-create] {
      width: min(64rem, calc(100vw - 8rem));
    }

    .kefine-afe-showcase {
      width: min(64rem, calc(100vw - 8rem));
    }

    .kefine-services-showcase {
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

    .kefine-afe-showcase {
      width: min(100%, calc(100vw - 2rem));
    }

    .kefine-services-showcase {
      width: min(100%, calc(100vw - 2rem));
    }

    .kefine-services-list {
      grid-template-columns: 1fr;
    }

    fieldset[data-part='exec-row'] {
      grid-template-columns: minmax(0, 1fr);
    }

    textarea[data-part='task-input'] {
      font-size: min(var(--kef-task-font-size, 1rem), 0.82rem);
    }

    kefine-task-placeholder {
      font-size: min(var(--kef-task-font-size, 1rem), 0.82rem);
    }

    p[data-part='composer-hints'] {
      display: none;
    }

    .kefine-service-card {
      width: 100%;
      min-height: 0;
    }
  }
</style>
