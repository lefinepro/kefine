<script lang="ts">
  import { goto } from '$app/navigation';
  import KefineChipButton from '$lib/components/kefine/KefineChipButton.svelte';
  import KefineChipEditorRow from '$lib/components/kefine/KefineChipEditorRow.svelte';
  import KefineChipRow from '$lib/components/kefine/KefineChipRow.svelte';
  import KefineSolverCohortDialog from '$lib/components/kefine/KefineSolverCohortDialog.svelte';
  import { getLocaleText, kefineLocale } from '$lib/constants/kefine-locale';
  import { buildCanonicalServicePath, buildProfilePath, normalizeProfileResourceSlug } from '$lib/profile/profile-storage';
  import { readBrowserPublicRuntimeConfig } from '$lib/config/public-config';
  import {
    buildAutoTemplateTranslations,
    resolveTemplateLocalizedContent,
    syncPromptVariables
  } from '$lib/templates/template-content';
  import { deleteTemplateFromCrater, saveTemplateToCrater } from '$lib/templates/template-api';
  import type {
    Profile,
    ProfileTemplate,
    ProfileTemplateBonusMode,
    ProfileTemplateFile,
    ProfileTemplateVariable,
    ProfileTemplateVisibility
  } from '$lib/types/user';

  let {
    profile,
    craterBaseUrl,
    service = null
  }: {
    profile: Profile;
    craterBaseUrl: string;
    service?: ProfileTemplate | null;
  } = $props();

  const localeText = $derived(getLocaleText($kefineLocale));

  let title = $state('');
  let slugInput = $state('');
  let description = $state('');
  let imageDataUrl = $state<string | undefined>(undefined);
  let promptTemplate = $state('');
  let promptVariables = $state<ProfileTemplateVariable[]>([]);
  let prefillEstimatedCost = $state('');
  let prefillCurrency = $state('USD');
  let pricingMode = $state<'fixed' | 'percent'>('fixed');
  let pricingValue = $state('');
  let visibility = $state<ProfileTemplateVisibility>('private');
  let bonusEnabled = $state(false);
  let bonusMode = $state<ProfileTemplateBonusMode>('fixed');
  let bonusValue = $state('');
  let files = $state<ProfileTemplateFile[]>([]);
  let priceEditorOpen = $state(false);
  let visibilityEditorOpen = $state(false);
  let solverDialogOpen = $state(false);
  let tagEditorOpen = $state(false);
  let tagInputValue = $state('');
  let tags = $state<string[]>([]);
  let solverCohortQuery = $state('');
  let preferredSolverIds = $state<string[]>([]);
  let fileInput = $state<HTMLInputElement | null>(null);
  let imageInput = $state<HTMLInputElement | null>(null);
  let hydratedServiceKey = $state<string>('');

  $effect(() => {
    const nextHydratedServiceKey = `${service?.id ?? '__new__'}|${$kefineLocale}`;
    if (hydratedServiceKey === nextHydratedServiceKey) {
      return;
    }

    const localized = service ? resolveTemplateLocalizedContent(service, $kefineLocale) : null;
    hydratedServiceKey = nextHydratedServiceKey;
    title = localized?.title ?? service?.title ?? '';
    slugInput = service?.slug && !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(service.slug) ? service.slug : '';
    description = localized?.description ?? service?.description ?? '';
    imageDataUrl = service?.imageDataUrl;
    promptTemplate = localized?.promptTemplate ?? service?.promptTemplate ?? service?.prefillDescription ?? service?.prefillTitle ?? '';
    promptVariables = syncPromptVariables(
      localized?.promptTemplate ?? service?.promptTemplate ?? service?.prefillDescription ?? service?.prefillTitle ?? '',
      service?.promptVariables ?? []
    );
    prefillEstimatedCost =
      service?.prefillEstimatedCost !== undefined ? String(service.prefillEstimatedCost) : service ? String(service.pricingValue) : '';
    prefillCurrency = service?.prefillCurrency ?? 'USD';
    pricingMode = 'fixed';
    pricingValue = service ? String(service.pricingValue) : '';
    visibility = service?.visibility ?? (service?.isPublished ? 'public' : 'private');
    bonusEnabled = service?.bonusEnabled ?? false;
    bonusMode = service?.bonusMode ?? 'fixed';
    bonusValue = service ? String(service.bonusValue ?? 0) : '';
    files = service?.prefillFiles.map((file) => ({ ...file })) ?? [];
    tags = service?.tags ? [...service.tags] : [];
    priceEditorOpen = false;
    visibilityEditorOpen = false;
    solverDialogOpen = false;
    tagEditorOpen = false;
  });

  const isEditing = $derived(Boolean(service));
  const normalizedSlug = $derived(normalizeProfileResourceSlug(slugInput));
  const canonicalServiceSlug = $derived(normalizedSlug || service?.slug || '');
  const runtimeConfig = $derived(readBrowserPublicRuntimeConfig());
  const canonicalServicePath = $derived(
    canonicalServiceSlug ? buildCanonicalServicePath(profile.primaryHandle, canonicalServiceSlug, runtimeConfig.defaultActor.handle) : ''
  );

  function addFiles(event: Event) {
    const target = event.currentTarget as HTMLInputElement | null;
    if (!target?.files?.length) {
      return;
    }

    const appended = Array.from(target.files).map((file, index) => ({
      id:
        typeof crypto !== 'undefined' && 'randomUUID' in crypto
          ? `service-file-${crypto.randomUUID()}`
          : `service-file-${Date.now()}-${index}`,
      name: file.name,
      size: file.size,
      type: file.type || undefined
    }));

    files = [...files, ...appended];
    target.value = '';
  }

  function removeFile(fileId: string) {
    files = files.filter((file) => file.id !== fileId);
  }

  function changeImage(event: Event) {
    const target = event.currentTarget as HTMLInputElement | null;
    const image = target?.files?.[0];
    if (!image) {
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      imageDataUrl = typeof reader.result === 'string' ? reader.result : undefined;
    };
    reader.readAsDataURL(image);
    target.value = '';
  }

  function updatePromptTemplate(value: string) {
    promptTemplate = value;
    promptVariables = syncPromptVariables(value, promptVariables);
  }

  function updatePromptVariableDefault(key: string, value: string) {
    promptVariables = promptVariables.map((item) => (item.key === key ? { ...item, defaultValue: value } : item));
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

    tags = Array.from(new Set([...tags, normalizedTag]));
    tagInputValue = '';
    tagEditorOpen = false;
  }

  function removeTag(tag: string) {
    tags = tags.filter((item) => item !== tag);
  }

  function handleTagInputKeydown(event: KeyboardEvent) {
    if (event.key === 'Enter' || event.key === ',' || event.key === 'Tab') {
      event.preventDefault();
      commitTag(tagInputValue);
      return;
    }

    if (event.key === 'Backspace' && !tagInputValue && tags.length > 0) {
      event.preventDefault();
      removeTag(tags[tags.length - 1] ?? '');
      return;
    }

    if (event.key === 'Escape') {
      tagInputValue = '';
      tagEditorOpen = false;
    }
  }

  async function closeEditor() {
    await goto(buildProfilePath(profile.primaryHandle));
  }

  async function saveService() {
    const nextSlug = normalizedSlug || service?.slug;
    const normalizedPromptVariables = syncPromptVariables(promptTemplate, promptVariables);
    const translations = buildAutoTemplateTranslations($kefineLocale, {
      title,
      description,
      promptTemplate
    });
    const saved = await saveTemplateToCrater(craterBaseUrl, {
      id: service?.id,
      authorHandle: profile.primaryHandle,
      authorProfileId: profile.id,
      authorDisplayName: profile.displayName,
      slug: nextSlug,
      title,
      description,
      imageDataUrl,
      baseLocale: $kefineLocale,
      promptTemplate,
      promptVariables: normalizedPromptVariables,
      translations,
      prefillTitle: '',
      prefillDescription: promptTemplate,
      prefillEstimatedCost: pricingValue.trim() ? Number(pricingValue) : undefined,
      prefillCurrency,
      prefillFiles: files,
      tags,
      pricingMode: 'fixed',
      pricingValue: Number(pricingValue) || 0,
      visibility,
      isPublished: visibility === 'public',
      bonusEnabled,
      bonusMode,
      bonusValue: Number(bonusValue) || 0
    });

    if (!saved) {
      return;
    }

    await goto(buildCanonicalServicePath(profile.primaryHandle, saved.slug, runtimeConfig.defaultActor.handle), { replaceState: true });
  }

  async function deleteService() {
    if (!service) {
      return;
    }

    const deleted = await deleteTemplateFromCrater(craterBaseUrl, service.id);
    if (!deleted) {
      return;
    }

    await goto(buildProfilePath(profile.primaryHandle), { replaceState: true });
  }
</script>

<section class="service-page" data-part="service-page">
  <header class="service-page__head" data-part="head">
    <lefine-text>Create Service</lefine-text>
    <div class="service-page__headline-row">
      <button
        type="button"
        class="service-page__art service-page__art--compact service-page__art-button"
        data-part="art"
        onclick={() => imageInput?.click()}
        aria-label="Change service image"
      >
        {#if imageDataUrl}
          <img src={imageDataUrl} alt="" class="service-page__art-image" />
        {:else}
          <strong>{(title.trim() || 'S').slice(0, 1).toUpperCase()}</strong>
        {/if}
      </button>
      <label class="service-page__headline-field">
      <span class="service-page__sr-only">{localeText.profile.templateTitle}</span>
      <input bind:value={title} maxlength="80" placeholder={localeText.profile.templateTitle} />
      </label>
    </div>
    <label class="service-page__headline-note">
      <span class="service-page__sr-only">{localeText.profile.templateDescription}</span>
      <textarea bind:value={description} rows="2" placeholder={localeText.profile.templatesSubtitle}></textarea>
    </label>
    <label class="service-page__slug-field">
      <lefine-text>{localeText.profile.templateSlug}</lefine-text>
      <input bind:value={slugInput} maxlength="64" placeholder="service-name-or-uuid" />
      <small>
        {localeText.profile.templateSlugHint}
        {#if canonicalServicePath}
          <span>{canonicalServicePath}</span>
        {/if}
      </small>
    </label>
  </header>

  <section class="service-page__layout" data-part="layout">
    <article class="service-page__form" data-part="form">
      <label class="service-page__field">
        <textarea
          bind:value={promptTemplate}
          rows="18"
          placeholder={localeText.profile.templatePrompt}
          oninput={(event) => updatePromptTemplate((event.currentTarget as HTMLTextAreaElement).value)}
        ></textarea>
      </label>

      <p class="service-page__localization-hint">{localeText.profile.templateLocalizationHint}</p>

      {#if promptVariables.length > 0}
        <section class="service-page__variables" data-part="variables">
          <strong>{localeText.profile.templateVariables}</strong>
          <div class="service-page__grid">
            {#each promptVariables as variable (variable.key)}
              <label class="service-page__field">
                <lefine-text>:{variable.key}</lefine-text>
                <input
                  value={variable.defaultValue ?? ''}
                  placeholder={localeText.profile.templateVariableDefault}
                  oninput={(event) => updatePromptVariableDefault(variable.key, (event.currentTarget as HTMLInputElement).value)}
                />
              </label>
            {/each}
          </div>
        </section>
      {/if}

      <KefineChipRow ariaLabel={localeText.profile.templatePricingMode}>
        <KefineChipButton onclick={() => fileInput?.click()}>
          <lefine-text>Files</lefine-text>
          {#if files.length > 0}
            <strong>{files.length}</strong>
          {/if}
        </KefineChipButton>

        {#if priceEditorOpen}
          <KefineChipEditorRow>
            <input bind:value={pricingValue} min="0" step="0.01" type="number" placeholder={localeText.profile.templatePrice} />
            <input bind:value={prefillCurrency} maxlength="8" placeholder={localeText.labels.amount} />
          </KefineChipEditorRow>
          <p class="service-page__chip-help">
            Set the adjustment amount and currency. Use a higher amount for an extra fee, or a lower amount to make the service cheaper.
          </p>
        {:else}
          <KefineChipButton onclick={() => { priceEditorOpen = true; }}>
            <lefine-text>{localeText.profile.templatePricingMode}</lefine-text>
          </KefineChipButton>
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
          <KefineChipButton dashed={true} onclick={() => { tagEditorOpen = true; }}>
            <lefine-text>+ tag</lefine-text>
          </KefineChipButton>
        {/if}

        <KefineChipButton dashed={true} onclick={() => { solverDialogOpen = true; }}>
          <lefine-text>{preferredSolverIds.length > 0 ? `solver: ${solverCohortQuery || 'cohort'} · ${preferredSolverIds.length}` : '+ solver'}</lefine-text>
        </KefineChipButton>

        {#if visibilityEditorOpen}
          <KefineChipButton onclick={() => { visibility = 'private'; visibilityEditorOpen = false; }}>
            <lefine-text>{localeText.profile.templatePrivate}</lefine-text>
          </KefineChipButton>
          <KefineChipButton onclick={() => { visibility = 'public'; visibilityEditorOpen = false; }}>
            <lefine-text>{localeText.profile.templatePublic}</lefine-text>
          </KefineChipButton>
        {:else}
          <KefineChipButton onclick={() => { visibilityEditorOpen = true; }}>
            <lefine-text>{localeText.profile.templateVisibility}: {visibility === 'public' ? localeText.profile.templatePublic : localeText.profile.templatePrivate}</lefine-text>
          </KefineChipButton>
        {/if}

        <input bind:this={fileInput} data-part="file-input" type="file" multiple onchange={addFiles} />
        <input bind:this={imageInput} data-part="file-input" type="file" accept="image/*" onchange={changeImage} />
      </KefineChipRow>

      <KefineChipRow>
        {#each tags as tag (`tag-${tag}`)}
          <KefineChipButton onclick={() => removeTag(tag)} ariaLabel={`Remove ${tag} tag`}>
            <lefine-text>#{tag}</lefine-text>
            <strong>×</strong>
          </KefineChipButton>
        {/each}
        {#if files.length > 0}
          {#each files as file (file.id)}
            <KefineChipButton onclick={() => removeFile(file.id)}>
              <lefine-text>{file.name}</lefine-text>
              <strong>×</strong>
            </KefineChipButton>
          {/each}
        {/if}
      </KefineChipRow>

      {#if files.length > 0}
        <div class="service-page__files" data-part="files">
          {#each files as file (file.id)}
            <button type="button" data-variant="ghost" onclick={() => removeFile(file.id)}>{file.name}</button>
          {/each}
        </div>
      {/if}
      <footer class="service-page__actions">
        <button type="button" data-variant="ghost" onclick={closeEditor}>{localeText.buttons.cancel}</button>
        {#if isEditing}
          <button type="button" data-variant="ghost" onclick={deleteService}>{localeText.profile.templateDelete}</button>
        {/if}
        <button type="button" data-variant="primary" onclick={saveService}>{isEditing ? localeText.profile.save : localeText.profile.createTemplate}</button>
      </footer>
    </article>
  </section>
</section>

<KefineSolverCohortDialog
  open={solverDialogOpen}
  closeLabel={localeText.buttons.closeDialog}
  title="Solver cohort"
  description="Find a cohort and pick solvers."
  searchLabel="Search"
  searchPlaceholder="vpn, devops, wireguard..."
  cohortQuery={solverCohortQuery}
  selectedSolverIds={preferredSolverIds}
  onClose={() => { solverDialogOpen = false; }}
  onApply={({ cohortQuery, solverIds }) => {
    solverCohortQuery = cohortQuery;
    preferredSolverIds = solverIds;
    solverDialogOpen = false;
  }}
/>

<style>
  .service-page {
    width: min(72rem, calc(100vw - 2rem));
    margin: 0 auto;
    padding: 5.5rem 0 3rem;
    display: grid;
    gap: 1.5rem;
  }

  .service-page__head,
  .service-page__form,
  .service-page__variables,
  .service-page__field,
  .service-page__theme,
  .service-page__headline-field,
  .service-page__headline-note,
  .service-page__slug-field {
    display: grid;
    gap: 0.6rem;
  }

  .service-page__headline-row {
    display: grid;
    grid-template-columns: auto minmax(0, 1fr);
    gap: 1.2rem;
    align-items: center;
  }

  .service-page__head lefine-text,
  .service-page__theme strong,
  .service-page__variables strong {
    color: color-mix(in oklab, var(--kef-color-text) 58%, transparent);
    margin: 0;
  }

  .service-page__headline-field input {
    margin: 0;
    width: 100%;
    padding: 0;
    border: 0;
    border-radius: 0;
    background: transparent;
    box-shadow: none;
    font-size: clamp(2.9rem, 6vw, 4.9rem);
    line-height: 0.92;
    letter-spacing: -0.055em;
    font-weight: 700;
    color: color-mix(in oklab, #e9d8b4 86%, white 14%);
  }

  .service-page__headline-field input::placeholder {
    color: color-mix(in oklab, var(--kef-color-text) 84%, transparent);
    opacity: 1;
  }

  .service-page__headline-note textarea {
    width: 100%;
    min-height: 3.25rem;
    padding: 0;
    border: 0;
    border-radius: 0;
    background: transparent;
    box-shadow: none;
    resize: none;
    color: color-mix(in oklab, var(--kef-color-text) 58%, transparent);
    line-height: 1.45;
  }

  .service-page__headline-note textarea::placeholder {
    color: color-mix(in oklab, var(--kef-color-text) 58%, transparent);
    opacity: 1;
  }

  .service-page__slug-field lefine-text,
  .service-page__slug-field small {
    color: color-mix(in oklab, var(--kef-color-text) 58%, transparent);
    margin: 0;
  }

  .service-page__slug-field input {
    width: min(100%, 28rem);
    padding: 0.8rem 1rem;
    border-radius: 0.9rem;
    border: 1px solid color-mix(in oklab, var(--kef-color-text) 12%, transparent);
    background: color-mix(in oklab, var(--kef-color-bg-card) 90%, transparent);
    color: inherit;
    font: inherit;
  }

  .service-page__slug-field small span {
    display: block;
    margin-top: 0.25rem;
    color: color-mix(in oklab, var(--kef-color-text) 72%, transparent);
  }

  .service-page__layout {
    display: block;
  }

  .service-page__art {
    min-height: 10rem;
    border-radius: 1.4rem;
    display: grid;
    place-items: center;
    background:
      radial-gradient(circle at center, color-mix(in oklab, #bfe0ff 82%, white) 0 12%, transparent 42%),
      radial-gradient(circle at center, color-mix(in oklab, #c99cff 70%, white) 0 30%, transparent 38%),
      linear-gradient(145deg, #0e2a78, #35217b 52%, #171d56);
    box-shadow:
      0 0 0 1px color-mix(in oklab, #c6b07f 18%, transparent),
      0 18px 36px color-mix(in oklab, black 28%, transparent);
  }

  .service-page__art-button {
    padding: 0;
    border: 0;
    cursor: pointer;
    overflow: hidden;
  }

  .service-page__art strong {
    font-size: clamp(2.8rem, 7vw, 4.5rem);
    line-height: 1;
    color: white;
    text-shadow: 0 0 30px color-mix(in oklab, #ff9df6 60%, transparent);
  }

  .service-page__art--compact {
    width: 4rem;
    min-height: 4rem;
    border-radius: 1.15rem;
    box-shadow:
      0 0 0 1px color-mix(in oklab, #d2b77a 20%, transparent),
      0 12px 28px color-mix(in oklab, black 18%, transparent);
  }

  .service-page__art--compact strong {
    font-size: 2.15rem;
    text-shadow: none;
  }

  .service-page__art-image {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
  }

  .service-page__visibility,
  .service-page__actions,
  .service-page__files {
    display: flex;
    gap: 0.75rem;
    align-items: center;
    flex-wrap: wrap;
  }

  .service-page__form {
    padding: 0;
    background: transparent;
    border: 0;
    align-content: start;
    width: min(100%, 58rem);
  }

  .service-page__theme,
  .service-page__variables {
    padding: 0;
    border: 0;
    background: transparent;
    box-shadow: none;
  }

  .service-page__field lefine-text {
    color: color-mix(in oklab, var(--kef-color-text) 58%, transparent);
    font-size: 0.94rem;
    letter-spacing: -0.01em;
  }

  .service-page__localization-hint {
    margin: 0;
    color: color-mix(in oklab, var(--kef-color-text) 52%, transparent);
  }

  .service-page__chip-help {
    margin: -0.15rem 0 0;
    color: color-mix(in oklab, var(--kef-color-text) 54%, transparent);
    font-size: 0.88rem;
    line-height: 1.45;
  }

  .service-page__grid {
    display: grid;
    gap: 1.1rem;
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .service-page__field input,
  .service-page__field textarea {
    width: 100%;
    border-left: 0;
    border-right: 0;
    border-top: 0;
    border-radius: 0;
    padding-left: 0;
    padding-right: 0;
    background: transparent;
    box-shadow: none;
  }

  .service-page__field textarea {
    min-height: 32rem;
    font-size: 1.08rem;
    line-height: 1.6;
    padding-top: 0.65rem;
    padding-bottom: 0.65rem;
  }

  .service-page__field textarea::placeholder {
    color: color-mix(in oklab, #d8c296 62%, transparent);
    opacity: 1;
  }

  .service-page__sr-only {
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

  .service-page__files button {
    display: inline-flex;
    align-items: center;
    min-height: 2.1rem;
    padding: 0.35rem 0.75rem;
    border-radius: 999px;
    background: color-mix(in oklab, var(--kef-color-bg-card) 78%, transparent);
    border: 0;
  }

  input[data-part='tag-input'] {
    min-height: 2.2rem;
    padding: 0.4rem 0.82rem;
    border-radius: 999px;
    border: 1px dashed color-mix(in oklab, var(--kef-color-text) 22%, transparent);
    background: color-mix(in oklab, var(--kef-color-bg-card) 88%, transparent);
    color: inherit;
    font: inherit;
  }

  input[data-part='tag-input']:focus {
    outline: none;
    border-color: color-mix(in oklab, var(--kef-color-text) 36%, transparent);
  }

  input[data-part='file-input'] {
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

  @media (max-width: 980px) {
    .service-page__grid {
      grid-template-columns: 1fr;
    }
  }
</style>
