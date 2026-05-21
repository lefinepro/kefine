<script lang="ts">
  import {
    bodyFromFields,
    createBodyFields,
    parseBodyFields,
    parseResponseFields,
    type SolutionBodyField
  } from './solution-testing-body';

  type Method = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  type BodyMode = 'form' | 'json';

  let {
    endpoint = '/',
    sampleBody = '{\n  "ping": "hello"\n}',
    sampleResponse = '{\n  "ok": true,\n  "message": "proxy ready"\n}',
    sampleTestTitle = 'POST / returns proxy ready',
    sampleTestDetail = 'ping=hello expects 200 with proxy ready'
  }: {
    endpoint?: string;
    sampleBody?: string;
    sampleResponse?: string;
    sampleTestTitle?: string;
    sampleTestDetail?: string;
  } = $props();

  let method = $state<Method>('POST');
  let methodOpen = $state(false);
  let methodRef = $state<HTMLElement | null>(null);

  function selectMethod(m: Method) {
    method = m;
    methodOpen = false;
  }

  $effect(() => {
    if (!methodOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (methodRef && !methodRef.contains(e.target as Node)) {
        methodOpen = false;
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  });

  const methodColors: Record<Method, string> = {
    GET: '#22c55e',
    POST: '#eab308',
    PUT: '#3b82f6',
    PATCH: '#a855f7',
    DELETE: '#ef4444'
  };

  const methodBgColors: Record<Method, string> = {
    GET: 'color-mix(in oklab, #22c55e 14%, var(--kef-bg-card))',
    POST: 'color-mix(in oklab, #eab308 14%, var(--kef-bg-card))',
    PUT: 'color-mix(in oklab, #3b82f6 14%, var(--kef-bg-card))',
    PATCH: 'color-mix(in oklab, #a855f7 14%, var(--kef-bg-card))',
    DELETE: 'color-mix(in oklab, #ef4444 14%, var(--kef-bg-card))'
  };
  let url = $state('');
  let body = $state('');
  let bodyMode = $state<BodyMode>('form');
  let bodyFields = $state<SolutionBodyField[]>([]);
  let response = $state<string | null>(null);
  let responseMode = $state<BodyMode>('form');
  let isSending = $state(false);
  let status = $state<number | null>(null);

  const responseFields = $derived(parseResponseFields(response));

  $effect(() => {
    url = `http://localhost:9090${endpoint}`;
    body = sampleBody;
    bodyMode = 'form';
    bodyFields = createBodyFields(sampleBody);
    response = sampleResponse;
    responseMode = 'form';
    status = 200;
  });

  function readInput(event: Event) {
    return (event.currentTarget as HTMLInputElement | HTMLTextAreaElement).value;
  }

  function updateBodyField(id: string, patch: Partial<Pick<SolutionBodyField, 'key' | 'value'>>) {
    const nextFields = bodyFields.map(field => (field.id === id ? { ...field, ...patch } : field));
    bodyFields = nextFields;
    body = bodyFromFields(nextFields);
  }

  function handleJsonInput(event: Event) {
    const nextBody = readInput(event);
    body = nextBody;

    const nextFields = parseBodyFields(nextBody);
    if (nextFields) {
      bodyFields = nextFields;
    }
  }

  function handleSend(event: Event) {
    event.preventDefault();
    if (isSending) return;
    isSending = true;
    response = null;
    status = null;
    setTimeout(() => {
      status = 200;
      response = sampleResponse;
      isSending = false;
    }, 650);
  }

  const methods: Method[] = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'];
</script>

<lef-testing-panel>
  <form class="lef-testing-form" onsubmit={handleSend}>
    <lef-testing-row>
      <lef-method-select bind:this={methodRef}>
        <button
          type="button"
          class="method-trigger"
          style="color: {methodColors[method]}; background: {methodBgColors[method]};"
          onclick={() => (methodOpen = !methodOpen)}
          aria-label="HTTP method"
          aria-expanded={methodOpen}
        >
          <span class="method-label">{method}</span>
          <span class="method-chevron" class:open={methodOpen}>▾</span>
        </button>
        {#if methodOpen}
          <ul class="method-dropdown" role="listbox">
            {#each methods as m (m)}
              <li
                role="option"
                aria-selected={m === method}
                class:active={m === method}
                style="color: {methodColors[m]}"
                onclick={() => selectMethod(m)}
              >
                <span class="method-dot" style="background: {methodColors[m]}"></span>
                {m}
              </li>
            {/each}
          </ul>
        {/if}
      </lef-method-select>
      <input
        class="lef-url-input"
        type="text"
        bind:value={url}
        aria-label="Request URL"
        spellcheck="false"
      />
      <button type="submit" class="lef-send-btn" disabled={isSending} aria-label="Send request">
        {#if isSending}
          <svg class="rocking-flask" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <path d="M9 3h6"/>
            <path d="M10 3v6.5L4 19.5a1.5 1.5 0 0 0 1.3 2.2h13.4a1.5 1.5 0 0 0 1.3-2.2L14 9.5V3"/>
            <path d="M7 16h10"/>
          </svg>
        {:else}
          <lefine-text>Send</lefine-text>
        {/if}
      </button>
    </lef-testing-row>

    <lef-testing-case>
      <lefine-text>Test 1</lefine-text>
      <strong>{sampleTestTitle}</strong>
      <lefine-text>{sampleTestDetail}</lefine-text>
    </lef-testing-case>

    <lef-testing-split>
      <lef-testing-pane>
        <lef-testing-pane-head>
          <strong>Request body</strong>
          <lef-body-mode role="tablist" aria-label="Request body mode">
            <button
              type="button"
              role="tab"
              aria-selected={bodyMode === 'form'}
              class:lef-body-mode-active={bodyMode === 'form'}
              onclick={() => (bodyMode = 'form')}
            >
              Form
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={bodyMode === 'json'}
              class:lef-body-mode-active={bodyMode === 'json'}
              onclick={() => (bodyMode = 'json')}
            >
              {'{} JSON'}
            </button>
          </lef-body-mode>
        </lef-testing-pane-head>
        {#if bodyMode === 'form'}
          <lef-body-form aria-label="Request body form">
            {#each bodyFields as field (field.id)}
              <lef-body-field>
                <label>
                  <lefine-text>Field</lefine-text>
                  <input
                    type="text"
                    value={field.key}
                    spellcheck="false"
                    aria-label="Request body field name"
                    oninput={(event) => updateBodyField(field.id, { key: readInput(event) })}
                  />
                </label>
                <label>
                  <lefine-text>Value</lefine-text>
                  <input
                    type="text"
                    value={field.value}
                    spellcheck="false"
                    aria-label={`Request body ${field.key || 'field'} value`}
                    oninput={(event) => updateBodyField(field.id, { value: readInput(event) })}
                  />
                </label>
              </lef-body-field>
            {/each}
          </lef-body-form>
        {:else}
          <textarea
            class="lef-body-input"
            value={body}
            spellcheck="false"
            aria-label="Request body JSON"
            oninput={handleJsonInput}
          ></textarea>
        {/if}
      </lef-testing-pane>

      <lef-testing-pane>
        <lef-testing-pane-head>
          <strong>Response</strong>
          <lef-pane-head-right>
            {#if responseFields !== null}
              <lef-body-mode role="tablist" aria-label="Response body mode">
                <button
                  type="button"
                  role="tab"
                  aria-selected={responseMode === 'form'}
                  class:lef-body-mode-active={responseMode === 'form'}
                  onclick={() => (responseMode = 'form')}
                >
                  Form
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={responseMode === 'json'}
                  class:lef-body-mode-active={responseMode === 'json'}
                  onclick={() => (responseMode = 'json')}
                >
                  {'{} JSON'}
                </button>
              </lef-body-mode>
            {/if}
            {#if status !== null}
              <lef-testing-status data-ok={status >= 200 && status < 300}>
                <lefine-text>{status}</lefine-text>
              </lef-testing-status>
            {:else}
              <lefine-text>not run</lefine-text>
            {/if}
          </lef-pane-head-right>
        </lef-testing-pane-head>
        {#if response === null}
          <lef-response-box class="lef-response-box--empty">
            <lefine-text>Press Send to see a sample response.</lefine-text>
          </lef-response-box>
        {:else if responseFields !== null && responseMode === 'form'}
          <lef-body-form aria-label="Response body form">
            {#each responseFields as field (field.id)}
              <lef-body-field>
                <label>
                  <lefine-text>Field</lefine-text>
                  <input
                    type="text"
                    value={field.key}
                    spellcheck="false"
                    aria-label="Response body field name"
                    readonly
                  />
                </label>
                <label>
                  <lefine-text>Value</lefine-text>
                  <input
                    type="text"
                    value={field.value}
                    spellcheck="false"
                    aria-label={`Response body ${field.key || 'field'} value`}
                    readonly
                  />
                </label>
              </lef-body-field>
            {/each}
          </lef-body-form>
        {:else}
          <lef-response-box>
            <pre>{response}</pre>
          </lef-response-box>
        {/if}
      </lef-testing-pane>
    </lef-testing-split>
  </form>
</lef-testing-panel>

<style>
  lef-testing-panel {
    display: flex;
    flex-direction: column;
    background: var(--kef-bg-card);
    border: 1px solid var(--kef-line);
    border-radius: 0.6rem;
    padding: 0.85rem;
    gap: 0.7rem;
  }

  .lef-testing-form {
    display: flex;
    flex-direction: column;
    gap: 0.7rem;
  }

  lef-testing-row {
    display: grid;
    grid-template-columns: auto 1fr auto;
    gap: 0.45rem;
    align-items: stretch;
  }

  lef-testing-case {
    display: grid;
    grid-template-columns: auto minmax(0, 1fr) auto;
    align-items: center;
    gap: 0.55rem;
    min-height: 2.2rem;
    padding: 0.45rem 0.55rem;
    border: 1px solid var(--kef-line-soft);
    border-radius: 0.45rem;
    background: color-mix(in oklab, var(--kef-bg-soft) 70%, var(--kef-bg-card));
    line-height: 1.4;
  }

  lef-testing-case lefine-text:first-child {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 3.1rem;
    padding: 0.18rem 0.45rem;
    border-radius: 0.35rem;
    background: color-mix(in oklab, var(--kef-color-primary, #3a7afe) 12%, var(--kef-bg-card));
    color: var(--kef-color-primary, #3a7afe);
    font-size: 0.78rem;
    font-weight: 700;
    line-height: 1.4;
  }

  lef-testing-case strong {
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    font-size: 0.82rem;
    color: var(--lefine-text);
    line-height: 1.4;
  }

  lef-testing-case lefine-text:last-child {
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    color: var(--lefine-text-soft);
    font-family: 'Fira Mono', 'Fira Code', ui-monospace, monospace;
    font-size: 0.78rem;
    line-height: 1.4;
  }

  lef-method-select {
    position: relative;
    display: flex;
    min-width: 5.7rem;
  }

  .method-trigger {
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 100%;
    padding: 0.45rem 0.55rem 0.45rem 0.7rem;
    border-radius: 0.45rem;
    border: 1px solid var(--kef-line);
    font-family: 'Fira Mono', 'Fira Code', ui-monospace, monospace;
    font-size: 0.82rem;
    font-weight: 700;
    cursor: pointer;
    gap: 0.35rem;
  }

  .method-label {
    flex: 1;
    text-align: left;
  }

  .method-chevron {
    font-size: 0.65rem;
    transition: transform 150ms ease;
    opacity: 0.6;
  }

  .method-chevron.open {
    transform: rotate(180deg);
  }

  .method-dropdown {
    position: absolute;
    top: calc(100% + 0.35rem);
    left: 0;
    right: 0;
    z-index: 10;
    list-style: none;
    margin: 0;
    padding: 0.35rem;
    border-radius: 0.45rem;
    border: 1px solid var(--kef-line);
    background: var(--kef-bg-card);
    box-shadow: 0 8px 20px color-mix(in oklab, var(--lefine-text) 12%, transparent);
  }

  .method-dropdown li {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.45rem 0.65rem;
    border-radius: 0.3rem;
    font-family: 'Fira Mono', 'Fira Code', ui-monospace, monospace;
    font-size: 0.82rem;
    font-weight: 700;
    cursor: pointer;
    transition: background 120ms ease;
  }

  .method-dropdown li:hover {
    background: color-mix(in oklab, var(--kef-bg-soft) 80%, var(--kef-bg-card));
  }

  .method-dropdown li.active {
    background: color-mix(in oklab, currentColor 10%, var(--kef-bg-card));
  }

  .method-dot {
    width: 0.5rem;
    height: 0.5rem;
    border-radius: 999px;
    flex-shrink: 0;
  }

  .lef-url-input {
    appearance: none;
    border: 1px solid var(--kef-line);
    border-radius: 0.45rem;
    background: var(--kef-bg-soft);
    color: var(--lefine-text);
    font-family: 'Fira Mono', 'Fira Code', ui-monospace, monospace;
    font-size: 0.82rem;
    padding: 0.45rem 0.7rem;
    min-width: 0;
  }

  .lef-url-input:focus {
    outline: none;
    border-color: color-mix(in oklab, var(--kef-color-primary, #3a7afe) 60%, var(--kef-line));
  }

  .lef-send-btn {
    appearance: none;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border: none;
    border-radius: 0.45rem;
    padding: 0 1rem;
    background: var(--kef-success, #16a34a);
    color: #ffffff;
    font-weight: 700;
    font-size: 0.85rem;
    line-height: 1;
    cursor: pointer;
    min-width: 4.5rem;
    min-height: 2.15rem;
  }

  .lef-send-btn:disabled {
    opacity: 0.65;
    cursor: progress;
  }

  .rocking-flask {
    transform-origin: 12px 20px;
    animation: flask-rock 0.8s ease-in-out infinite;
  }

  @keyframes flask-rock {
    0%, 100% { transform: rotate(0deg); }
    25% { transform: rotate(18deg); }
    75% { transform: rotate(-18deg); }
  }

  lef-testing-split {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 0.7rem;
  }

  lef-testing-pane {
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
    min-width: 0;
  }

  lef-testing-pane-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.5rem;
    min-height: 1.7rem;
  }

  lef-testing-pane-head strong {
    font-size: 0.72rem;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: var(--lefine-text-soft);
    font-weight: 700;
    line-height: 1.7rem;
  }

  lef-testing-pane-head lefine-text {
    font-size: 0.72rem;
    color: var(--lefine-text-soft);
    line-height: 1.7rem;
  }

  lef-pane-head-right {
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;
  }

  lef-body-mode {
    display: inline-flex;
    align-items: center;
    gap: 0.15rem;
    padding: 0.15rem;
    border: 1px solid var(--kef-line-soft);
    border-radius: 0.4rem;
    background: var(--kef-bg-soft);
  }

  lef-body-mode button {
    appearance: none;
    border: 1px solid transparent;
    border-radius: 0.3rem;
    background: transparent;
    color: var(--lefine-text-soft);
    cursor: pointer;
    font-size: 0.72rem;
    font-weight: 700;
    line-height: 1;
    padding: 0.28rem 0.45rem;
  }

  lef-body-mode button:hover,
  lef-body-mode button.lef-body-mode-active {
    border-color: var(--kef-line);
    background: var(--kef-bg-card);
    color: var(--lefine-text);
  }

  lef-testing-status {
    display: inline-flex;
    align-items: center;
    padding: 0.05rem 0.4rem;
    border-radius: 0.35rem;
    background: color-mix(in oklab, var(--kef-success, #16a34a) 18%, var(--kef-bg-card));
    color: var(--kef-success, #16a34a);
    font-family: 'Fira Mono', 'Fira Code', ui-monospace, monospace;
    font-size: 0.72rem;
    font-weight: 700;
  }

  lef-testing-status[data-ok='false'] {
    background: color-mix(in oklab, var(--kef-error, #c65353) 18%, var(--kef-bg-card));
    color: var(--kef-error, #c65353);
  }

  .lef-body-input {
    appearance: none;
    border: 1px solid var(--kef-line);
    border-radius: 0.45rem;
    background: var(--kef-bg-soft);
    color: var(--lefine-text);
    font-family: 'Fira Mono', 'Fira Code', ui-monospace, monospace;
    font-size: 0.8rem;
    line-height: 1.55;
    padding: 0.55rem 0.7rem;
    min-height: 8rem;
    resize: vertical;
  }

  .lef-body-input:focus {
    outline: none;
    border-color: color-mix(in oklab, var(--kef-color-primary, #3a7afe) 60%, var(--kef-line));
  }

  lef-body-form {
    display: flex;
    flex-direction: column;
    gap: 0.55rem;
    border: 1px solid var(--kef-line);
    border-radius: 0.45rem;
    background: var(--kef-bg-soft);
    padding: 0.65rem;
    min-height: 8rem;
  }

  lef-body-field {
    display: flex;
    flex-direction: column;
    gap: 0.55rem;
  }

  lef-body-field label {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    min-width: 0;
  }

  lef-body-field label lefine-text {
    color: var(--lefine-text-soft);
    font-size: 0.68rem;
    font-weight: 700;
    letter-spacing: 0.06em;
    text-transform: uppercase;
  }

  lef-body-field input {
    appearance: none;
    min-width: 0;
    border: 1px solid var(--kef-line-soft);
    border-radius: 0.35rem;
    background: var(--kef-bg-card);
    color: var(--lefine-text);
    font-family: 'Fira Mono', 'Fira Code', ui-monospace, monospace;
    font-size: 0.8rem;
    line-height: 1.35;
    padding: 0.5rem 0.55rem;
  }

  lef-body-field input:focus {
    outline: none;
    border-color: color-mix(in oklab, var(--kef-color-primary, #3a7afe) 60%, var(--kef-line));
  }

  lef-response-box {
    display: block;
    border: 1px solid var(--kef-line);
    border-radius: 0.45rem;
    background: var(--kef-bg-soft);
    padding: 0.55rem 0.7rem;
    min-height: 8rem;
    font-family: 'Fira Mono', 'Fira Code', ui-monospace, monospace;
    font-size: 0.8rem;
    line-height: 1.55;
    color: var(--lefine-text);
    overflow: auto;
  }

  lef-response-box pre {
    margin: 0;
    white-space: pre-wrap;
    overflow-wrap: anywhere;
  }

  lef-response-box.lef-response-box--empty {
    color: var(--lefine-text-soft);
    font-style: italic;
  }

  lef-body-field input[readonly] {
    background: color-mix(in oklab, var(--kef-bg-card) 65%, var(--kef-bg-soft));
    cursor: default;
  }

  @media (max-width: 720px) {
    lef-testing-row {
      grid-template-columns: 1fr;
    }
    lef-testing-case {
      grid-template-columns: 1fr;
    }
    .lef-send-btn {
      width: 100%;
      min-height: 2.75rem;
      padding: 0.75rem 1rem;
    }
    lef-testing-split {
      grid-template-columns: 1fr;
    }
  }
</style>
