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
  <lef-contact-header>
    <lef-contact-copy>
      <h2>{title}</h2>
      <p>{description}</p>
    </lef-contact-copy>
  </lef-contact-header>

  <form
    onsubmit={(event: SubmitEvent) => {
      event.preventDefault();
      onSubmit();
    }}
  >
    <lef-contact-field>
      <label>
      <lefine-text>{nameLabel}</lefine-text>
      <input
        type="text"
        value={nameValue}
        placeholder={namePlaceholder}
        oninput={(event) => onNameInput((event.currentTarget as HTMLInputElement).value)}
      />
      </label>
    </lef-contact-field>

    <lef-contact-field>
      <label>
      <lefine-text>{emailLabel}</lefine-text>
      <input
        type="email"
        value={emailValue}
        placeholder={emailPlaceholder}
        oninput={(event) => onEmailInput((event.currentTarget as HTMLInputElement).value)}
      />
      </label>
    </lef-contact-field>

    <lef-contact-field>
      <label>
      <lefine-text>{messageLabel}</lefine-text>
      <textarea
        rows="5"
        placeholder={messagePlaceholder}
        oninput={(event) => onMessageInput((event.currentTarget as HTMLTextAreaElement).value)}
      >{messageValue}</textarea>
      </label>
    </lef-contact-field>

    <lef-contact-footer>
      <button type="button" data-variant="ghost" onclick={onClose}>{closeLabel}</button>
      <button type="submit" data-variant="primary">{submitLabel}</button>
    </lef-contact-footer>
  </form>
</KefineModal>

<style>
  lef-contact-header {
    display: block;
  }

  lef-contact-header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 1rem;
    padding: 1.15rem 1.15rem 0;
  }

  lef-contact-header h2 {
    margin: 0 0 0.3rem;
  }

  lef-contact-header p {
    margin: 0;
    opacity: 0.72;
  }

  form {
    display: grid;
    gap: 0.9rem;
    padding: 1.15rem;
  }

  lef-contact-field,
  lef-contact-field label {
    display: grid;
    gap: 0.35rem;
  }

  lef-contact-field lefine-text {
    font-size: 0.92rem;
    font-weight: 600;
  }

  lef-contact-footer {
    display: flex;
    justify-content: flex-end;
    gap: 0.65rem;
    flex-wrap: wrap;
  }
</style>
