<script lang="ts">
  type Method = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

  let {
    endpoint = '/',
    sampleBody = '{\n  "ping": "hello"\n}',
    sampleResponse = '{\n  "ok": true,\n  "message": "proxy ready"\n}'
  }: {
    endpoint?: string;
    sampleBody?: string;
    sampleResponse?: string;
  } = $props();

  let method = $state<Method>('POST');
  let url = $state('');
  let body = $state('');
  let response = $state<string | null>(null);
  let isSending = $state(false);
  let status = $state<number | null>(null);

  $effect(() => {
    url = `http://localhost:9090${endpoint}`;
    body = sampleBody;
    response = null;
    status = null;
  });

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

    <lef-testing-split>
      <lef-testing-pane>
        <lef-testing-pane-head>
          <strong>Request body</strong>
          <lefine-text>application/json</lefine-text>
        </lef-testing-pane-head>
        <textarea
          class="lef-body-input"
          bind:value={body}
          spellcheck="false"
          aria-label="Request body"
        ></textarea>
      </lef-testing-pane>

      <lef-testing-pane>
        <lef-testing-pane-head>
          <strong>Response</strong>
          {#if status !== null}
            <lef-testing-status data-ok={status >= 200 && status < 300}>
              <lefine-text>{status}</lefine-text>
            </lef-testing-status>
          {:else}
            <lefine-text>not run</lefine-text>
          {/if}
        </lef-testing-pane-head>
        <lef-response-box class:lef-response-box--empty={response === null}>
          {#if response === null}
            <lefine-text>Press Send to see a sample response.</lefine-text>
          {:else}
            <pre>{response}</pre>
          {/if}
        </lef-response-box>
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
    align-items: baseline;
    justify-content: space-between;
    gap: 0.5rem;
  }

  lef-testing-pane-head strong {
    font-size: 0.72rem;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: var(--lefine-text-soft);
    font-weight: 700;
  }

  lef-testing-pane-head lefine-text {
    font-size: 0.72rem;
    color: var(--lefine-text-soft);
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

  @media (max-width: 720px) {
    lef-testing-row {
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
