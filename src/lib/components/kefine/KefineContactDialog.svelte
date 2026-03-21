<script lang="ts">
  let dialogEl: HTMLDialogElement | undefined = $state();

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

  $effect(() => {
    if (!dialogEl) return;

    if (open && !dialogEl.open) {
      dialogEl.showModal();
      return;
    }

    if (!open && dialogEl.open) {
      dialogEl.close();
    }
  });
</script>

<dialog class="kefine-contact-dialog" bind:this={dialogEl} onclose={onClose}>
  <header class="kefine-contact-dialog__header">
    <div>
      <h2>{title}</h2>
      <p>{description}</p>
    </div>
    <button type="button" data-variant="close" aria-label={closeLabel} onclick={onClose}>✕</button>
  </header>

  <form
    class="kefine-contact-dialog__form"
    onsubmit={(event) => {
      event.preventDefault();
      onSubmit();
    }}
  >
    <label class="kefine-contact-dialog__field">
      <span>{nameLabel}</span>
      <input
        type="text"
        value={nameValue}
        placeholder={namePlaceholder}
        oninput={(event) => onNameInput((event.currentTarget as HTMLInputElement).value)}
      />
    </label>

    <label class="kefine-contact-dialog__field">
      <span>{emailLabel}</span>
      <input
        type="email"
        value={emailValue}
        placeholder={emailPlaceholder}
        oninput={(event) => onEmailInput((event.currentTarget as HTMLInputElement).value)}
      />
    </label>

    <label class="kefine-contact-dialog__field">
      <span>{messageLabel}</span>
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
</dialog>

<style>
  .kefine-contact-dialog {
    width: min(30rem, calc(100vw - 2rem));
    border: none;
    border-radius: 0.72rem;
    padding: 0;
    margin: auto;
    background: color-mix(in oklab, var(--kef-bg-card, #f4ead8) 96%, white);
    color: var(--kef-text, #2e2317);
    box-shadow: 0 1rem 2.5rem rgba(17, 24, 39, 0.18);
  }

  .kefine-contact-dialog::backdrop {
    background: rgba(15, 23, 42, 0.24);
    backdrop-filter: blur(2px);
  }

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

  .kefine-contact-dialog__field span {
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
