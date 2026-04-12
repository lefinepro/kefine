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
    closeLabel,
    onClose,
    onInput,
    onSubmit
  }: {
    open: boolean;
    title: string;
    description?: string;
    value: string;
    helperText?: string;
    placeholder: string;
    submitLabel: string;
    closeLabel: string;
    onClose: () => void;
    onInput: (value: string) => void;
    onSubmit: () => void;
  } = $props();
</script>

<KefineModal open={open} onClose={onClose} closeLabel={closeLabel} width="min(32rem, calc(100vw - 2rem))">
  <section class="publickey-dialog">
    {#if description.trim()}
      <header class="publickey-dialog__header">
        <h2>{title}</h2>
        <p>{description}</p>
      </header>
    {:else}
      <h2 class="publickey-dialog__title">{title}</h2>
    {/if}

    <label class="publickey-dialog__field">
      <input
        type="text"
        data-testid="kefine-publickey-input"
        value={value}
        placeholder={placeholder}
        autocomplete="off"
        spellcheck="false"
        oninput={(event) => onInput((event.currentTarget as HTMLInputElement).value)}
      />
    </label>

    {#if helperText.trim()}
      <p class="publickey-dialog__helper">{helperText}</p>
    {/if}

    <button type="button" class="publickey-dialog__submit" data-testid="kefine-publickey-submit" onclick={onSubmit}>
      {submitLabel}
    </button>
  </section>
</KefineModal>

<style>
  .publickey-dialog {
    display: grid;
    gap: 1rem;
    padding: 1.25rem;
  }

  .publickey-dialog__header h2,
  .publickey-dialog__header p {
    margin: 0;
  }

  .publickey-dialog__title {
    margin: 0;
  }

  .publickey-dialog__header {
    display: grid;
    gap: 0.4rem;
  }

  .publickey-dialog__header p {
    opacity: 0.72;
  }

  .publickey-dialog__field {
    display: grid;
    gap: 0.5rem;
  }

  .publickey-dialog__field input {
    width: 100%;
    border: 1px solid color-mix(in oklab, var(--lefine-text, #2e2317) 14%, transparent);
    border-radius: 0.85rem;
    padding: 0.9rem 1rem;
    background: color-mix(in oklab, var(--kef-bg, #f0e5d4) 82%, white);
    color: var(--lefine-text, #2e2317);
    font: inherit;
    font-size: 0.95rem;
    letter-spacing: 0.01em;
  }

  .publickey-dialog__submit {
    border: 0;
    border-radius: 0.85rem;
    padding: 0.85rem 1rem;
    background: var(--kef-primary, #6f5540);
    color: white;
    font: inherit;
    font-weight: 600;
  }

  .publickey-dialog__helper {
    margin: -0.25rem 0 0;
    opacity: 0.72;
    font-size: 0.92rem;
  }
</style>
