<script lang="ts">
  import KefineModal from '$lib/components/kefine/KefineModal.svelte';

  let {
    open,
    title,
    description = '',
    emailValue,
    codeValue,
    statusMessage = '',
    emailLabel,
    codeLabel,
    emailPlaceholder,
    codePlaceholder,
    sendCodeLabel,
    resendCodeLabel,
    verifyCodeLabel,
    backLabel,
    closeLabel,
    codeRequested = false,
    isSubmitting = false,
    onClose,
    onEmailInput,
    onCodeInput,
    onRequestCode,
    onVerifyCode,
    onBack
  }: {
    open: boolean;
    title: string;
    description?: string;
    emailValue: string;
    codeValue: string;
    statusMessage?: string;
    emailLabel: string;
    codeLabel: string;
    emailPlaceholder: string;
    codePlaceholder: string;
    sendCodeLabel: string;
    resendCodeLabel: string;
    verifyCodeLabel: string;
    backLabel: string;
    closeLabel: string;
    codeRequested?: boolean;
    isSubmitting?: boolean;
    onClose: () => void;
    onEmailInput: (value: string) => void;
    onCodeInput: (value: string) => void;
    onRequestCode: () => void;
    onVerifyCode: () => void;
    onBack: () => void;
  } = $props();

  function handleSubmit(event: SubmitEvent) {
    event.preventDefault();
    if (codeRequested) {
      onVerifyCode();
      return;
    }

    onRequestCode();
  }
</script>

<KefineModal open={open} onClose={onClose} closeLabel={closeLabel} width="medium">
  <lef-email-code-dialog>
    <lef-email-code-header>
      <h2>{title}</h2>
      {#if description.trim()}
        <p>{description}</p>
      {/if}
    </lef-email-code-header>

    <form onsubmit={handleSubmit}>
      <lef-email-code-fields>
        <label>
<<<<<<< HEAD
          <span>{emailLabel}</span>
=======
          <lef-email-code-label>{emailLabel}</lef-email-code-label>
>>>>>>> 219cb79b77ef7afbfb8946a823e7508d11b35a34
          <input
            data-testid="kefine-email-code-email-input"
            type="email"
            inputmode="email"
            autocomplete="email"
            placeholder={emailPlaceholder}
            value={emailValue}
            disabled={codeRequested}
            oninput={(event) => onEmailInput((event.currentTarget as HTMLInputElement).value)}
          />
        </label>

        {#if codeRequested}
          <label>
<<<<<<< HEAD
            <span>{codeLabel}</span>
=======
            <lef-email-code-label>{codeLabel}</lef-email-code-label>
>>>>>>> 219cb79b77ef7afbfb8946a823e7508d11b35a34
            <input
              data-testid="kefine-email-code-otp-input"
              type="text"
              inputmode="numeric"
              autocomplete="one-time-code"
              maxlength="6"
              placeholder={codePlaceholder}
              value={codeValue}
              oninput={(event) => onCodeInput((event.currentTarget as HTMLInputElement).value)}
            />
          </label>
        {/if}
      </lef-email-code-fields>

      {#if statusMessage.trim()}
        <lef-email-code-status>{statusMessage}</lef-email-code-status>
      {/if}

      <lef-email-code-actions>
        {#if codeRequested}
          <button type="button" data-variant="ghost" onclick={onBack} disabled={isSubmitting}>
            {backLabel}
          </button>
          <button type="button" data-variant="ghost" onclick={onRequestCode} disabled={isSubmitting}>
            {resendCodeLabel}
          </button>
        {/if}

        <button
          type="submit"
          data-testid={codeRequested ? 'kefine-email-code-verify' : 'kefine-email-code-send'}
          disabled={isSubmitting}
        >
          {codeRequested ? verifyCodeLabel : sendCodeLabel}
        </button>
      </lef-email-code-actions>
    </form>
  </lef-email-code-dialog>
</KefineModal>

<style>
  lef-email-code-dialog {
    display: grid;
    gap: 1rem;
    padding: 1.25rem;
  }

  lef-email-code-header {
    display: grid;
    gap: 0.35rem;
  }

  lef-email-code-header h2,
  lef-email-code-header p {
    margin: 0;
  }

  lef-email-code-header p,
  lef-email-code-status {
    color: color-mix(in oklab, var(--kef-color-text, #2e2317) 68%, transparent);
  }

  lef-email-code-dialog form,
  lef-email-code-fields {
    display: grid;
    gap: 0.9rem;
  }

  lef-email-code-fields label {
    display: grid;
    gap: 0.4rem;
  }

<<<<<<< HEAD
  lef-email-code-fields span {
=======
  lef-email-code-label {
>>>>>>> 219cb79b77ef7afbfb8946a823e7508d11b35a34
    font-size: 0.92rem;
    color: color-mix(in oklab, var(--kef-color-text, #2e2317) 76%, transparent);
  }

  lef-email-code-fields input {
    width: 100%;
    border: 1px solid color-mix(in oklab, var(--kef-color-text, #2e2317) 14%, transparent);
    border-radius: 0.85rem;
    padding: 0.9rem 1rem;
    background: color-mix(in oklab, var(--kef-color-bg, #f0e5d4) 82%, white);
    color: var(--kef-color-text, #2e2317);
    font: inherit;
  }

  lef-email-code-fields input:disabled {
    opacity: 0.7;
  }

  lef-email-code-actions {
    display: flex;
    flex-wrap: wrap;
    gap: 0.75rem;
    justify-content: flex-end;
  }

  lef-email-code-dialog button {
    cursor: pointer;
    border: 0;
    border-radius: 0.85rem;
    padding: 0.85rem 1rem;
    background: var(--kef-color-primary, #7a4b2a);
    color: var(--kef-color-on-primary, #f7edd8);
    font: inherit;
    font-weight: 600;
  }

  lef-email-code-dialog button[data-variant='ghost'] {
    background: color-mix(in oklab, var(--kef-color-bg, #f0e5d4) 72%, white);
    color: var(--kef-color-text, #2e2317);
  }

  lef-email-code-dialog button:disabled {
    opacity: 0.65;
    cursor: wait;
  }
</style>
