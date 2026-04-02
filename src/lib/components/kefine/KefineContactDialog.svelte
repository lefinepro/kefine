<script lang="ts">
  import KefineModal from '$lib/components/kefine/KefineModal.svelte';

  let {
    open,
    title,
    description,
    nameLabel,
    emailLabel,
    messageLabel,
    nameValue,
    emailValue,
    messageValue,
    namePlaceholder,
    emailPlaceholder,
    messagePlaceholder,
    submitLabel,
    closeLabel,
    onClose,
    onNameInput,
    onEmailInput,
    onMessageInput,
    onSubmit
  }: {
    open: boolean;
    title: string;
    description: string;
    nameLabel: string;
    emailLabel: string;
    messageLabel: string;
    nameValue: string;
    emailValue: string;
    messageValue: string;
    namePlaceholder: string;
    emailPlaceholder: string;
    messagePlaceholder: string;
    submitLabel: string;
    closeLabel: string;
    onClose: () => void;
    onNameInput: (value: string) => void;
    onEmailInput: (value: string) => void;
    onMessageInput: (value: string) => void;
    onSubmit: () => void;
  } = $props();

</script>

<KefineModal open={open} onClose={onClose} closeLabel={closeLabel} width="min(30rem, calc(100vw - 2rem))">
  <header class="kefine-contact-dialog__header">
    <lefine-box>
      <h2>{title}</h2>
      <p>{description}</p>
    </lefine-box>
  </header>

  <form
    class="kefine-contact-dialog__form"
    onsubmit={(event) => {
      event.preventDefault();
      onSubmit();
    }}
  >
    <label class="kefine-contact-dialog__field">
      <lefine-text>{nameLabel}</lefine-text>
      <input
        type="text"
        value={nameValue}
        placeholder={namePlaceholder}
        oninput={(event) => onNameInput((event.currentTarget as HTMLInputElement).value)}
      />
    </label>

    <label class="kefine-contact-dialog__field">
      <lefine-text>{emailLabel}</lefine-text>
      <input
        type="email"
        value={emailValue}
        placeholder={emailPlaceholder}
        oninput={(event) => onEmailInput((event.currentTarget as HTMLInputElement).value)}
      />
    </label>

    <label class="kefine-contact-dialog__field">
      <lefine-text>{messageLabel}</lefine-text>
      <textarea
        rows="5"
        placeholder={messagePlaceholder}
        oninput={(event) => onMessageInput((event.currentTarget as HTMLTextAreaElement).value)}
      >{messageValue}</textarea>
    </label>

    <footer class="kefine-contact-dialog__footer">
      <button type="button" data-variant="ghost" onclick={onClose}>{closeLabel}</button>
      <button type="submit" data-variant="primary">{submitLabel}</button>
    </footer>
  </form>
</KefineModal>

<style>
  .kefine-contact-dialog__header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 1rem;
    padding: 1.15rem 1.15rem 0;
  }

  .kefine-contact-dialog__header h2 {
    margin: 0 0 0.3rem;
  }

  .kefine-contact-dialog__header p {
    margin: 0;
    opacity: 0.72;
  }

  .kefine-contact-dialog__form {
    display: grid;
    gap: 0.9rem;
    padding: 1.15rem;
  }

  .kefine-contact-dialog__field {
    display: grid;
    gap: 0.35rem;
  }

  .kefine-contact-dialog__field lefine-text {
    font-size: 0.92rem;
    font-weight: 600;
  }

  .kefine-contact-dialog__footer {
    display: flex;
    justify-content: flex-end;
    gap: 0.65rem;
    flex-wrap: wrap;
  }
</style>
