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
      <lef-method-select>
        <select bind:value={method} aria-label="HTTP method">
          {#each methods as m (m)}
            <option value={m}>{m}</option>
          {/each}
        </select>
      </lef-method-select>
      <input
        class="lef-url-input"
        type="text"
        bind:value={url}
        aria-label="Request URL"
        spellcheck="false"
      />
      <button type="submit" class="lef-send-btn" disabled={isSending} aria-label="Send request">
        <lefine-text>{isSending ? 'Sending…' : 'Send'}</lefine-text>
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
    color: var(--kef-color-primary, var(--kef-primary));
  }

  lef-method-select::before {
    content: '';
    position: absolute;
    top: 0.45rem;
    right: 1.85rem;
    bottom: 0.45rem;
    width: 1px;
    background: color-mix(in oklab, var(--kef-color-primary, #3a7afe) 34%, var(--kef-line));
    pointer-events: none;
  }

  lef-method-select::after {
    content: '';
    position: absolute;
    top: 50%;
    right: 0.75rem;
    width: 0.42rem;
    height: 0.42rem;
    border-right: 2px solid currentColor;
    border-bottom: 2px solid currentColor;
    transform: translateY(-68%) rotate(45deg);
    pointer-events: none;
  }

  lef-method-select select {
    appearance: none;
    width: 100%;
    height: 100%;
    padding: 0.45rem 2.35rem 0.45rem 0.7rem;
    border-radius: 0.45rem;
    border: 1px solid var(--kef-line);
    background: var(--kef-bg-soft);
    color: currentColor;
    font-family: 'Fira Mono', 'Fira Code', ui-monospace, monospace;
    font-size: 0.82rem;
    font-weight: 700;
    cursor: pointer;
  }

  lef-method-select select:focus {
    outline: none;
    border-color: color-mix(in oklab, var(--kef-color-primary, #3a7afe) 60%, var(--kef-line));
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
