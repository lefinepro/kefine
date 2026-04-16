<script lang="ts">
  import Icon from '@iconify/svelte';
  import { browser } from '$app/environment';
  import type { Editor } from 'prosekit/core';
  import { createEditor } from 'prosekit/core';
  import { defineBasicExtension } from 'prosekit/basic';
  import 'prosekit/basic/style.css';
  import 'prosekit/basic/typography.css';
  import {
    AutocompleteEmpty,
    AutocompleteItem,
    AutocompleteList,
    AutocompletePopover
  } from 'prosekit/svelte/autocomplete';

  type EditorMode = 'visual' | 'source';
  type SlashCommand = {
    id: string;
    label: string;
    hint: string;
    run: (editor: Editor) => void;
  };
  type AttachmentRef = {
    name: string;
    size?: number;
    type?: string;
  };

  let {
    open,
    value,
    description,
    onApply,
    placeholder = '',
    compact = false,
    enableMeta = false,
    autoOpenTagEditor = false,
    autoOpenFilePicker = false
  }: {
    open: boolean;
    value: string;
    description: string;
    onApply: (value: string) => void;
    placeholder?: string;
    compact?: boolean;
    enableMeta?: boolean;
    autoOpenTagEditor?: boolean;
    autoOpenFilePicker?: boolean;
  } = $props();

  let editorHost: HTMLDivElement | null = $state(null);
  let editor: Editor | null = $state(null);
  let editorMode = $state<EditorMode>('visual');
  let editorReady = $state(false);
  let editorLoading = $state(false);
  let editorLoadError = $state('');
  let detachEditorListeners: (() => void) | null = null;
  let sourceDraft = $state('');
  let slashQuery = $state('');
  let tagEditorOpen = $state(false);
  let tagInputValue = $state('');
  let tagInput: HTMLInputElement | null = $state(null);
  let fileInput: HTMLInputElement | null = $state(null);
  let tagDrafts = $state<string[]>([]);
  let attachmentDrafts = $state<AttachmentRef[]>([]);
  let hydratedValue = $state<string | null>(null);
  let autoOpenedTagEditor = $state(false);
  let autoOpenedFilePicker = $state(false);

  const slashRegex = /(?:^|\s)\/([^\s/]*)$/u;
  const slashCommands: SlashCommand[] = [
    {
      id: 'paragraph',
      label: 'Paragraph',
      hint: 'Plain text block',
      run: (instance) => {
        (instance.commands as any).unsetBlockType();
      }
    },
    {
      id: 'heading-1',
      label: 'Heading 1',
      hint: 'Large section heading',
      run: (instance) => {
        (instance.commands as any).setHeading({ level: 1 });
      }
    },
    {
      id: 'heading-2',
      label: 'Heading 2',
      hint: 'Secondary heading',
      run: (instance) => {
        (instance.commands as any).setHeading({ level: 2 });
      }
    },
    {
      id: 'bullet-list',
      label: 'Bullet list',
      hint: 'List with bullets',
      run: (instance) => {
        (instance.commands as any).toggleList({ kind: 'bullet' });
      }
    },
    {
      id: 'ordered-list',
      label: 'Ordered list',
      hint: 'Numbered list',
      run: (instance) => {
        (instance.commands as any).toggleList({ kind: 'ordered' });
      }
    },
    {
      id: 'quote',
      label: 'Quote',
      hint: 'Indented quote block',
      run: (instance) => {
        (instance.commands as any).toggleBlockquote();
      }
    },
    {
      id: 'code-block',
      label: 'Code block',
      hint: 'Multi-line code',
      run: (instance) => {
        (instance.commands as any).toggleCodeBlock();
      }
    }
  ];

  const filteredSlashCommands = $derived.by(() => {
    const query = slashQuery.trim().toLowerCase();
    if (!query) {
      return slashCommands;
    }

    return slashCommands.filter((command) =>
      [command.label, command.hint, command.id].some((value) => value.toLowerCase().includes(query))
    );
  });

  function normalizeTag(tag: string): string {
    return tag.trim().replace(/^#+/, '').toLowerCase();
  }

  function formatFileSize(size?: number): string {
    if (!size || size <= 0) {
      return '1 KB';
    }

    if (size >= 1024 * 1024) {
      return `${Math.max(1, Math.round((size / (1024 * 1024)) * 10) / 10)} MB`;
    }

    return `${Math.max(1, Math.round(size / 1024))} KB`;
  }

  function parseMetaSections(input: string): {
    body: string;
    tags: string[];
    files: AttachmentRef[];
  } {
    if (!enableMeta) {
      return {
        body: input,
        tags: [],
        files: []
      };
    }

    let body = input.replace(/\r\n/g, '\n').replace(/\r/g, '\n').trim();
    let files: AttachmentRef[] = [];
    let tags: string[] = [];

    const filesMatch = body.match(/\n\n#\+files:\n((?:- .+(?:\n|$))+)$/i);
    if (filesMatch) {
      files = (filesMatch[1] ?? '')
        .split('\n')
        .map((line) => line.trim())
        .filter(Boolean)
        .map((line) => {
          const match = line.match(/^- (.+?)(?: \((.+)\))?$/);
          return {
            name: match?.[1]?.trim() ?? line.replace(/^- /, '').trim(),
            size: undefined,
            type: undefined
          };
        });
      body = body.slice(0, filesMatch.index).trimEnd();
    }

    const tagsMatch = body.match(/\n\n#\+tags:\s+([^\n]+)$/i);
    if (tagsMatch) {
      tags = (tagsMatch[1] ?? '')
        .split(/\s+/)
        .map((tag) => normalizeTag(tag))
        .filter(Boolean);
      body = body.slice(0, tagsMatch.index).trimEnd();
    }

    return { body, tags, files };
  }

  function serializeMetaSections(body: string, tags: string[], files: AttachmentRef[]): string {
    const chunks = [body.trim()].filter(Boolean);
    const nextTags = Array.from(new Set(tags.map(normalizeTag).filter(Boolean)));
    const nextFiles = files.filter((file) => file.name.trim());

    if (enableMeta && nextTags.length > 0) {
      chunks.push(`#+tags: ${nextTags.map((tag) => `#${tag}`).join(' ')}`);
    }

    if (enableMeta && nextFiles.length > 0) {
      chunks.push(
        ['#+files:', ...nextFiles.map((file) => `- ${file.name}${file.size ? ` (${formatFileSize(file.size)})` : ''}`)].join('\n')
      );
    }

    return chunks.join('\n\n').trim();
  }

  function escapeHtml(input: string): string {
    return input
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#39;');
  }

  function inlineToHtml(line: string): string {
    return escapeHtml(line)
      .replace(/(^|[\s(])\*([^*\n]+)\*(?=[\s).,!?:;]|$)/g, '$1<strong>$2</strong>')
      .replace(/(^|[\s(])\/([^/\n]+)\/(?=[\s).,!?:;]|$)/g, '$1<em>$2</em>')
      .replace(/(^|[\s(])[~=]([^~=\n]+)[~=](?=[\s).,!?:;]|$)/g, '$1<code>$2</code>');
  }

  function sourceToHtml(input: string): string {
    const normalized = input.replace(/\r\n/g, '\n').replace(/\r/g, '\n').trim();
    if (!normalized) {
      return '<p></p>';
    }

    const lines = normalized.split('\n');
    const blocks: string[] = [];
    let index = 0;

    while (index < lines.length) {
      const line = lines[index] ?? '';
      const trimmed = line.trim();

      if (!trimmed) {
        index += 1;
        continue;
      }

      if (/^#\+begin_src\b/i.test(trimmed)) {
        const language = trimmed.replace(/^#\+begin_src\b/i, '').trim();
        index += 1;
        const codeLines: string[] = [];
        while (index < lines.length && !/^#\+end_src\b/i.test((lines[index] ?? '').trim())) {
          codeLines.push(lines[index] ?? '');
          index += 1;
        }
        if (index < lines.length && /^#\+end_src\b/i.test((lines[index] ?? '').trim())) {
          index += 1;
        }
        blocks.push(
          `<pre><code${language ? ` data-language="${escapeHtml(language)}"` : ''}>${escapeHtml(codeLines.join('\n'))}</code></pre>`
        );
        continue;
      }

      if (/^-{5,}$/.test(trimmed)) {
        blocks.push('<hr>');
        index += 1;
        continue;
      }

      const headingMatch = trimmed.match(/^(\*{1,6})\s+(.+)$/);
      if (headingMatch) {
        const level = headingMatch[1]?.length ?? 1;
        blocks.push(`<h${level}>${inlineToHtml(headingMatch[2] ?? '')}</h${level}>`);
        index += 1;
        continue;
      }

      if (/^#\+begin_quote\b/i.test(trimmed)) {
        const quoteLines: string[] = [];
        index += 1;
        while (index < lines.length && !/^#\+end_quote\b/i.test((lines[index] ?? '').trim())) {
          quoteLines.push(lines[index] ?? '');
          index += 1;
        }
        if (index < lines.length && /^#\+end_quote\b/i.test((lines[index] ?? '').trim())) {
          index += 1;
        }
        blocks.push(`<blockquote><p>${quoteLines.map(inlineToHtml).join('<br>')}</p></blockquote>`);
        continue;
      }

      if (/^[-+]\s+/.test(trimmed)) {
        const items: string[] = [];
        while (index < lines.length && /^[-+]\s+/.test((lines[index] ?? '').trim())) {
          items.push(`<li><p>${inlineToHtml((lines[index] ?? '').trim().replace(/^[-+]\s+/, ''))}</p></li>`);
          index += 1;
        }
        blocks.push(`<ul>${items.join('')}</ul>`);
        continue;
      }

      if (/^\d+\.\s+/.test(trimmed)) {
        const items: string[] = [];
        while (index < lines.length && /^\d+\.\s+/.test((lines[index] ?? '').trim())) {
          items.push(`<li><p>${inlineToHtml((lines[index] ?? '').trim().replace(/^\d+\.\s+/, ''))}</p></li>`);
          index += 1;
        }
        blocks.push(`<ol>${items.join('')}</ol>`);
        continue;
      }

      const paragraphLines = [line];
      index += 1;
      while (index < lines.length) {
        const next = lines[index] ?? '';
        const nextTrimmed = next.trim();
        if (
          !nextTrimmed ||
          /^#\+begin_src\b/i.test(nextTrimmed) ||
          /^-{5,}$/.test(nextTrimmed) ||
          /^(\*{1,6})\s+/.test(nextTrimmed) ||
          /^#\+begin_quote\b/i.test(nextTrimmed) ||
          /^[-+]\s+/.test(nextTrimmed) ||
          /^\d+\.\s+/.test(nextTrimmed)
        ) {
          break;
        }

        paragraphLines.push(next);
        index += 1;
      }

      blocks.push(`<p>${paragraphLines.map(inlineToHtml).join('<br>')}</p>`);
    }

    return blocks.join('');
  }

  function nodeToSource(node: Element): string {
    const tag = node.tagName.toLowerCase();

    if (tag === 'h1' || tag === 'h2' || tag === 'h3' || tag === 'h4' || tag === 'h5' || tag === 'h6') {
      const level = Number(tag.slice(1));
      return `${'*'.repeat(level)} ${node.textContent?.trim() ?? ''}`;
    }

    if (tag === 'blockquote') {
      const lines = (node.textContent ?? '')
        .split('\n')
        .map((line) => line.trim())
        .filter(Boolean);
      return ['#+begin_quote', ...lines, '#+end_quote'].join('\n');
    }

    if (tag === 'ul') {
      return Array.from(node.querySelectorAll(':scope > li'))
        .map((item) => `- ${(item.textContent ?? '').trim()}`)
        .join('\n');
    }

    if (tag === 'ol') {
      return Array.from(node.querySelectorAll(':scope > li'))
        .map((item, itemIndex) => `${itemIndex + 1}. ${(item.textContent ?? '').trim()}`)
        .join('\n');
    }

    if (tag === 'pre') {
      const code = node.querySelector('code');
      const language = code?.getAttribute('data-language')?.trim() ?? '';
      return `#+begin_src${language ? ` ${language}` : ''}\n${code?.textContent ?? node.textContent ?? ''}\n#+end_src`;
    }

    if (tag === 'hr') {
      return '-----';
    }

    return (node.textContent ?? '').trim();
  }

  function htmlToSource(input: string): string {
    if (!browser) {
      return input.replace(/<br\s*\/?>/gi, '\n').replace(/<[^>]+>/g, '').trim();
    }

    const documentNode = new DOMParser().parseFromString(input, 'text/html');
    const blocks = Array.from(documentNode.body.children)
      .map((child) => nodeToSource(child))
      .filter(Boolean);

    return blocks.join('\n\n').trim();
  }

  async function ensureEditor(): Promise<Editor | null> {
    if (!browser) {
      return null;
    }

    if (editor) {
      return editor;
    }

    editorLoading = true;
    editorLoadError = '';

    try {
      const instance = createEditor({
        extension: defineBasicExtension(),
        defaultContent: sourceToHtml(value)
      });

      editor = instance;
      editorReady = true;
      return instance;
    } catch {
      editorLoadError = 'Failed to load the editor.';
      editorReady = false;
      return null;
    } finally {
      editorLoading = false;
    }
  }

  function bindEditorListeners(instance: Editor): void {
    if (!instance.view?.dom) {
      return;
    }

    detachEditorListeners?.();

    const sync = () => syncVisualToSource();
    const events = ['input', 'keyup', 'paste', 'blur'];
    for (const eventName of events) {
      instance.view.dom.addEventListener(eventName, sync);
    }

    detachEditorListeners = () => {
      for (const eventName of events) {
        instance.view.dom?.removeEventListener(eventName, sync);
      }
      detachEditorListeners = null;
    };
  }

  function publishDraft(nextSource: string): void {
    sourceDraft = nextSource;
    onApply(serializeMetaSections(nextSource, tagDrafts, attachmentDrafts));
  }

  function syncVisualToSource(): void {
    if (!editor) {
      return;
    }

    const nextSource = htmlToSource(editor.getDocHTML());
    publishDraft(nextSource);
  }

  function handleEditorKeydown(event: KeyboardEvent): void {
    if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
      event.preventDefault();
      syncVisualToSource();
    }
  }

  function handleSourceInput(nextValue: string): void {
    publishDraft(nextValue);
  }

  function setEditorMode(nextMode: EditorMode): void {
    if (editorMode === nextMode) {
      return;
    }

    if (nextMode === 'source') {
      syncVisualToSource();
      editorMode = nextMode;
      return;
    }

    editorMode = nextMode;
    if (editor) {
      editor.setContent(sourceToHtml(sourceDraft), 'end');
      editor.focus();
    }
  }

  function applySlashCommand(commandId: string): void {
    if (!editor) {
      return;
    }

    const command = slashCommands.find((item) => item.id === commandId);
    if (!command) {
      return;
    }

    command.run(editor);
    editor.focus();
    syncVisualToSource();
  }

  function hydrateFromValue(nextValue: string): void {
    const parsed = parseMetaSections(nextValue);
    sourceDraft = parsed.body;
    tagDrafts = parsed.tags;
    attachmentDrafts = parsed.files;
    hydratedValue = nextValue;
  }

  function addTag(tag: string): void {
    const normalized = normalizeTag(tag);
    if (!normalized) {
      return;
    }

    tagDrafts = Array.from(new Set([...tagDrafts, normalized]));
    onApply(serializeMetaSections(sourceDraft, tagDrafts, attachmentDrafts));
    tagInputValue = '';
    tagEditorOpen = false;
  }

  function removeTag(tag: string): void {
    tagDrafts = tagDrafts.filter((item) => item !== tag);
    onApply(serializeMetaSections(sourceDraft, tagDrafts, attachmentDrafts));
  }

  function handleTagKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter' || event.key === ',') {
      event.preventDefault();
      addTag(tagInputValue);
      return;
    }

    if (event.key === 'Escape') {
      tagInputValue = '';
      tagEditorOpen = false;
    }
  }

  function handleFileChange(event: Event): void {
    const target = event.currentTarget as HTMLInputElement;
    const files = Array.from(target.files ?? []).map((file) => ({
      name: file.name,
      size: file.size,
      type: file.type || undefined
    }));

    if (files.length === 0) {
      return;
    }

    attachmentDrafts = [...attachmentDrafts, ...files];
    onApply(serializeMetaSections(sourceDraft, tagDrafts, attachmentDrafts));
    target.value = '';
  }

  function removeAttachment(index: number): void {
    attachmentDrafts = attachmentDrafts.filter((_, itemIndex) => itemIndex !== index);
    onApply(serializeMetaSections(sourceDraft, tagDrafts, attachmentDrafts));
  }

  $effect(() => {
    if (!open) {
      detachEditorListeners?.();
      editor?.unmount();
      return;
    }

    let cancelled = false;

    void ensureEditor().then((instance) => {
      if (cancelled || !instance || !editorHost || editorMode !== 'visual' || compact) {
        return;
      }

      if (!instance.mounted) {
        instance.mount(editorHost);
      }

      bindEditorListeners(instance);
      instance.focus();
    });

    return () => {
      cancelled = true;
    };
  });

  $effect(() => {
    if (!open) {
      return;
    }

    if (hydratedValue !== value) {
      hydrateFromValue(value);
      if (editor && editorMode === 'visual' && !compact) {
        editor.setContent(sourceToHtml(sourceDraft), 'end');
      }
    }
  });

  $effect(() => {
    if (!tagEditorOpen || !tagInput) {
      return;
    }

    queueMicrotask(() => tagInput?.focus());
  });

  $effect(() => {
    if (compact && editorMode === 'visual') {
      editorMode = 'source';
    }
  });

  $effect(() => {
    if (!open || !enableMeta) {
      autoOpenedTagEditor = false;
      autoOpenedFilePicker = false;
      return;
    }

    if (autoOpenTagEditor && !autoOpenedTagEditor) {
      tagEditorOpen = true;
      autoOpenedTagEditor = true;
    }

    if (!autoOpenTagEditor) {
      autoOpenedTagEditor = false;
    }
  });

  $effect(() => {
    if (!open || !enableMeta) {
      return;
    }

    if (autoOpenFilePicker && !autoOpenedFilePicker) {
      autoOpenedFilePicker = true;
      queueMicrotask(() => fileInput?.click());
    }

    if (!autoOpenFilePicker) {
      autoOpenedFilePicker = false;
    }
  });
</script>

{#if open}
  <kefine-rich-editor data-compact={compact}>
    <kefine-rich-editor-toolbar>
      <kefine-rich-editor-modes>
        {#if !compact}
          <button type="button" data-active={editorMode === 'visual'} onclick={() => setEditorMode('visual')}>
            Visual
          </button>
        {/if}
        <button type="button" data-active={editorMode === 'source'} onclick={() => setEditorMode('source')}>
          Org
        </button>
      </kefine-rich-editor-modes>
      {#if !compact}
        <kefine-rich-editor-hint>{description}</kefine-rich-editor-hint>
      {/if}
      {#if enableMeta && !compact}
        <kefine-rich-editor-strip>
          <button type="button" data-part="meta-action" aria-label="Add file" onclick={() => fileInput?.click()}>
            <Icon icon="mdi:paperclip" width="17" height="17" aria-hidden="true" />
            <span>Add file</span>
          </button>
          {#if tagEditorOpen}
            <input
              bind:this={tagInput}
              data-part="tag-input"
              value={tagInputValue}
              placeholder="tag"
              oninput={(event) => {
                tagInputValue = (event.currentTarget as HTMLInputElement).value;
              }}
              onkeydown={handleTagKeydown}
            />
          {:else}
            <button type="button" data-part="meta-action" aria-label="Add tag" onclick={() => { tagEditorOpen = true; }}>
              <Icon icon="mdi:tag-plus-outline" width="17" height="17" aria-hidden="true" />
              <span>Add tag</span>
            </button>
          {/if}
          <input bind:this={fileInput} data-part="file-input" type="file" multiple onchange={handleFileChange} />
        </kefine-rich-editor-strip>
      {:else if enableMeta}
        <input bind:this={fileInput} data-part="file-input" type="file" multiple onchange={handleFileChange} />
      {/if}
    </kefine-rich-editor-toolbar>

    <kefine-rich-editor-surface data-mode={editorMode}>
      {#if editorLoadError}
        <kefine-rich-editor-state data-state="error">{editorLoadError}</kefine-rich-editor-state>
      {:else if editorLoading && !editorReady}
        <kefine-rich-editor-state data-state="loading">Loading editor...</kefine-rich-editor-state>
      {/if}

      {#if editorMode === 'visual' && !compact}
        <div
          bind:this={editorHost}
          data-part="editor-host"
          data-ready={editorReady}
          role="textbox"
          tabindex="0"
          aria-multiline="true"
          data-placeholder={placeholder}
          onkeydown={handleEditorKeydown}
        ></div>

        {#if editor}
          <AutocompletePopover
            editor={editor}
            regex={slashRegex}
            on:queryChange={(event: CustomEvent<string>) => {
              slashQuery = event.detail;
            }}
          >
            <kefine-slash-menu>
              <AutocompleteList
                editor={editor}
                on:valueChange={(event: CustomEvent<string>) => {
                  applySlashCommand(event.detail);
                }}
              >
                {#each filteredSlashCommands as command}
                  <AutocompleteItem value={command.id}>
                    <kefine-slash-item>
                      <strong>{command.label}</strong>
                      <span>{command.hint}</span>
                    </kefine-slash-item>
                  </AutocompleteItem>
                {/each}
                <AutocompleteEmpty>
                  <kefine-slash-empty>No matching blocks</kefine-slash-empty>
                </AutocompleteEmpty>
              </AutocompleteList>
            </kefine-slash-menu>
          </AutocompletePopover>
        {/if}
      {:else}
        <textarea
          data-part="source"
          rows={compact ? 6 : 16}
          value={sourceDraft}
          placeholder={placeholder || 'Write with * headings, - lists, #+begin_quote, #+begin_src'}
          oninput={(event) => handleSourceInput((event.currentTarget as HTMLTextAreaElement).value)}
        ></textarea>
      {/if}
    </kefine-rich-editor-surface>

    {#if enableMeta}
      <kefine-rich-editor-meta>
        {#if tagDrafts.length > 0}
          <kefine-rich-editor-tag-strip>
            {#each tagDrafts as tag (`tag-${tag}`)}
              <button type="button" data-part="tag-pill" onclick={() => removeTag(tag)} aria-label={`Remove ${tag} tag`}>
                <span>#{tag}</span>
                <strong>×</strong>
              </button>
            {/each}
          </kefine-rich-editor-tag-strip>
        {/if}

        {#if attachmentDrafts.length > 0}
          <kefine-rich-editor-file-strip>
            {#each attachmentDrafts as file, index (`${file.name}-${index}`)}
              <button type="button" data-part="file-pill" onclick={() => removeAttachment(index)} aria-label={`Remove ${file.name}`}>
                <Icon icon="mdi:file-outline" width="15" height="15" aria-hidden="true" />
                <span>{file.name}</span>
                <strong>{formatFileSize(file.size)}</strong>
              </button>
            {/each}
          </kefine-rich-editor-file-strip>
        {/if}
      </kefine-rich-editor-meta>
    {/if}
  </kefine-rich-editor>
{/if}

<style>
  kefine-rich-editor {
    display: grid;
    gap: 0.8rem;
    padding: 0.2rem 0 0;
  }

  kefine-rich-editor-toolbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.8rem;
    flex-wrap: wrap;
  }

  kefine-rich-editor-modes {
    display: inline-flex;
    align-items: center;
    gap: 0.35rem;
    padding: 0.2rem;
    border-radius: 999px;
    background: color-mix(in oklab, var(--kef-bg-soft, #f0e5d4) 84%, white 16%);
    border: 1px solid color-mix(in oklab, var(--kef-line-strong, #b69a77) 20%, transparent);
  }

  kefine-rich-editor-modes button {
    min-height: 1.95rem;
    padding: 0.32rem 0.8rem;
    border-radius: 999px;
    border: 0;
    background: transparent;
    color: var(--lefine-text-soft, #6d5a49);
    font: inherit;
    font-weight: 600;
  }

  kefine-rich-editor-modes button[data-active='true'] {
    background: color-mix(in oklab, var(--kef-bg-card, #fff8ef) 92%, white 8%);
    color: var(--lefine-text, #2e2317);
    box-shadow: 0 0.25rem 0.8rem color-mix(in oklab, #8d6b42 10%, transparent);
  }

  kefine-rich-editor-hint {
    color: var(--lefine-text-soft, #6d5a49);
    font-size: 0.84rem;
  }

  kefine-rich-editor-surface {
    position: relative;
    display: block;
    min-height: 22rem;
    border-radius: 1rem;
    border: 1px solid color-mix(in oklab, var(--kef-line-strong, #b69a77) 40%, transparent);
    background: color-mix(in oklab, var(--kef-bg-card, #fff8ef) 94%, white 6%);
    overflow: hidden;
  }

  kefine-rich-editor[data-compact='true'] kefine-rich-editor-surface {
    min-height: 12rem;
  }

  kefine-rich-editor-state {
    padding: 0.85rem 1rem 0;
    color: var(--lefine-text-soft, #6d5a49);
    font-size: 0.9rem;
  }

  div[data-part='editor-host'] {
    min-height: 22rem;
    padding: 1rem 1.05rem;
  }

  kefine-rich-editor[data-compact='true'] div[data-part='editor-host'] {
    min-height: 10rem;
  }

  div[data-part='editor-host']:empty::before {
    content: attr(data-placeholder);
    color: color-mix(in oklab, var(--lefine-text-soft, #6d5a49) 70%, transparent);
  }

  textarea[data-part='source'] {
    width: 100%;
    min-height: 100%;
    padding: 1rem 1.05rem;
    border: 0;
    background: transparent;
    color: var(--lefine-text, #2e2317);
    font: 0.95rem/1.6 'Fira Mono', monospace;
    resize: vertical;
    box-sizing: border-box;
  }

  kefine-slash-menu {
    display: block;
    min-width: 14rem;
    padding: 0.3rem;
    border: 1px solid color-mix(in oklab, var(--kef-line-strong, #b69a77) 36%, transparent);
    border-radius: 0.95rem;
    background: color-mix(in oklab, var(--kef-bg-card, #fff8ef) 98%, white 2%);
    box-shadow: 0 0.9rem 2rem color-mix(in oklab, #8d6b42 16%, transparent);
  }

  kefine-slash-item {
    display: grid;
    gap: 0.1rem;
    padding: 0.5rem 0.65rem;
  }

  kefine-slash-item strong {
    font-size: 0.9rem;
  }

  kefine-slash-item span,
  kefine-slash-empty {
    color: var(--lefine-text-soft, #6d5a49);
    font-size: 0.8rem;
  }

  :global(div[data-part='editor-host'] .ProseMirror) {
    min-height: inherit;
    outline: none;
    color: var(--lefine-text, #2e2317);
    line-height: 1.6;
  }

  :global(div[data-part='editor-host'] .ProseMirror p) {
    margin: 0 0 0.7rem;
  }

  kefine-rich-editor-meta {
    display: grid;
    gap: 0.65rem;
  }

  kefine-rich-editor-strip,
  kefine-rich-editor-tag-strip,
  kefine-rich-editor-file-strip {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0.5rem;
  }

  kefine-rich-editor-strip {
    margin-left: auto;
  }

  button[data-part='meta-action'],
  button[data-part='tag-pill'],
  button[data-part='file-pill'] {
    display: inline-flex;
    align-items: center;
    gap: 0.45rem;
    min-height: 2.1rem;
    padding: 0.42rem 0.78rem;
    border-radius: 999px;
    border: 1px solid color-mix(in oklab, var(--kef-line-strong, #b69a77) 28%, transparent);
    background: color-mix(in oklab, var(--kef-bg-soft, #f0e5d4) 80%, white 20%);
    color: var(--lefine-text, #2e2317);
    font: inherit;
  }

  button[data-part='meta-action'] {
    justify-content: center;
  }

  button[data-part='meta-action'] span {
    font-size: 0.82rem;
  }

  button[data-part='tag-pill'] strong,
  button[data-part='file-pill'] strong {
    color: var(--lefine-text-soft, #6d5a49);
    font-size: 0.78rem;
  }

  input[data-part='tag-input'] {
    min-height: 2.1rem;
    min-width: 8rem;
    padding: 0.42rem 0.1rem;
    border: 0;
    border-bottom: 1px solid color-mix(in oklab, var(--kef-line-strong, #b69a77) 35%, transparent);
    background: transparent;
    color: var(--lefine-text, #2e2317);
    font: inherit;
    outline: none;
  }

  input[data-part='file-input'] {
    display: none;
  }
</style>
