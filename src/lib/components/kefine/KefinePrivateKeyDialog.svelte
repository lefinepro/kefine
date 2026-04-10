<script lang="ts">
  import KefineModal from '$lib/components/kefine/KefineModal.svelte';

  let {
    open,
    title,
    description,
    value,
    placeholder,
    submitLabel,
    closeLabel,
    onClose,
    onInput,
    onSubmit
  }: {
    open: boolean;
    title: string;
    description: string;
    value: string;
    placeholder: string;
    submitLabel: string;
    closeLabel: string;
    onClose: () => void;
    onInput: (value: string) => void;
    onSubmit: () => void;
  } = $props();
</script>

<KefineModal open={open} onClose={onClose} closeLabel={closeLabel} width="min(32rem, calc(100vw - 2rem))">
  <section class="privatekey-dialog">
    <header class="privatekey-dialog__header">
      <h2>{title}</h2>
      <p>{description}</p>
    </header>

    <label class="privatekey-dialog__field">
      <span>{title}</span>
      <textarea
        rows="8"
        value={value}
        placeholder={placeholder}
        oninput={(event) => onInput((event.currentTarget as HTMLTextAreaElement).value)}
      ></textarea>
    </label>

    <button type="button" class="privatekey-dialog__submit" onclick={onSubmit}>
      {submitLabel}
    </button>
  </section>
</KefineModal>

<style>
  .privatekey-dialog {
    display: grid;
    gap: 1rem;
    padding: 1.25rem;
  }

  .privatekey-dialog__header h2,
  .privatekey-dialog__header p {
    margin: 0;
  }

  .privatekey-dialog__header {
    display: grid;
    gap: 0.4rem;
  }

  .privatekey-dialog__header p {
    opacity: 0.72;
  }

  .privatekey-dialog__field {
    display: grid;
    gap: 0.5rem;
  }

  .privatekey-dialog__field span {
    font-size: 0.95rem;
    font-weight: 600;
  }

  .privatekey-dialog__field textarea {
    width: 100%;
    min-height: 11rem;
    resize: vertical;
    border: 1px solid color-mix(in oklab, var(--lefine-text, #2e2317) 14%, transparent);
    border-radius: 0.85rem;
    padding: 0.9rem 1rem;
    background: color-mix(in oklab, var(--kef-bg, #f0e5d4) 82%, white);
    color: var(--lefine-text, #2e2317);
    font: inherit;
  }

  .privatekey-dialog__submit {
    border: 0;
    border-radius: 0.85rem;
    padding: 0.85rem 1rem;
    background: var(--kef-primary, #6f5540);
    color: white;
    font: inherit;
    font-weight: 600;
  }
</style>
