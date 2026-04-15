<script lang="ts">
  import KefineModal from '$lib/components/kefine/KefineModal.svelte';

  let {
    open,
    title,
    description = '',
    value,
    helperText = '',
    placeholder,
    submitLabel,
    generateLabel = '',
    closeLabel,
    onClose,
    onInput,
    onSubmit,
    onGenerate
  }: {
    open: boolean;
    title: string;
    description?: string;
    value: string;
    helperText?: string;
    placeholder: string;
    submitLabel: string;
    generateLabel?: string;
    closeLabel: string;
    onClose: () => void;
    onInput: (value: string) => void;
    onSubmit: () => void;
    onGenerate?: () => void;
  } = $props();
</script>

<KefineModal open={open} onClose={onClose} closeLabel={closeLabel} width="medium">
  <lef-privatekey-dialog>
    {#if description.trim()}
      <lef-privatekey-header>
        <h2>{title}</h2>
        <p>{description}</p>
      </lef-privatekey-header>
    {:else}
      <lef-privatekey-title>{title}</lef-privatekey-title>
    {/if}

    <lef-privatekey-field>
      <label>
      <textarea
        data-testid="kefine-privatekey-input"
        placeholder={placeholder}
        autocomplete="off"
        spellcheck="false"
        oninput={(event) => onInput((event.currentTarget as HTMLTextAreaElement).value)}
      >{value}</textarea>
      </label>
    </lef-privatekey-field>

    {#if helperText.trim()}
      <lef-privatekey-helper>{helperText}</lef-privatekey-helper>
    {/if}

    <lef-privatekey-actions>
      {#if generateLabel.trim() && onGenerate}
        <button type="button" data-variant="ghost" data-testid="kefine-privatekey-generate" onclick={onGenerate}>
          {generateLabel}
        </button>
      {/if}
      <button type="button" data-testid="kefine-privatekey-submit" onclick={onSubmit}>
        {submitLabel}
      </button>
    </lef-privatekey-actions>
  </lef-privatekey-dialog>
</KefineModal>

<style>
  lef-privatekey-dialog {
    display: grid;
    gap: 1rem;
    padding: 1.25rem;
  }

  lef-privatekey-header h2,
  lef-privatekey-header p {
    margin: 0;
  }

  lef-privatekey-title {
    display: block;
    margin: 0;
  }

  lef-privatekey-header {
    display: grid;
    gap: 0.4rem;
  }

  lef-privatekey-header p {
    opacity: 0.72;
  }

  lef-privatekey-field,
  lef-privatekey-field label {
    display: grid;
    gap: 0.5rem;
  }

  lef-privatekey-field textarea {
    width: 100%;
    min-height: 10rem;
    border: 1px solid color-mix(in oklab, var(--lefine-text, #2e2317) 14%, transparent);
    border-radius: 0.85rem;
    padding: 0.9rem 1rem;
    background: color-mix(in oklab, var(--kef-bg, #f0e5d4) 82%, white);
    color: var(--lefine-text, #2e2317);
    font: inherit;
    font-size: 0.95rem;
    letter-spacing: 0.01em;
    line-height: 1.45;
    resize: vertical;
    white-space: pre-wrap;
    overflow-wrap: anywhere;
  }

  lef-privatekey-actions {
    display: flex;
    flex-wrap: wrap;
    gap: 0.75rem;
  }

  lef-privatekey-dialog button {
    border: 0;
    border-radius: 0.85rem;
    padding: 0.85rem 1rem;
    background: var(--kef-primary, #6f5540);
    color: white;
    font: inherit;
    font-weight: 600;
  }

  lef-privatekey-dialog button[data-variant='ghost'] {
    background: color-mix(in oklab, var(--kef-bg, #f0e5d4) 72%, white);
    color: var(--lefine-text, #2e2317);
  }

  lef-privatekey-helper {
    display: block;
    margin: -0.25rem 0 0;
    opacity: 0.72;
    font-size: 0.92rem;
  }
</style>
