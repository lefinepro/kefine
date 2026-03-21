<script lang="ts">
  import AuthButton from '$lib/components/auth/AuthButton.svelte';
  import PasskeyLogin from '$lib/components/federation/PasskeyLogin.svelte';
  import type { PasskeyAuthSuccess } from '$lib/auth/routes';

  let {
    isAuthenticated,
    reownLabel,
    passkeyLabel,
    passkeyErrorLabel,
    continueAuthenticatedLabel,
    connectLabel,
    signedInMessage,
    onContinue,
    onPasskeyLogin,
    onPasskeyError
  }: {
    isAuthenticated: boolean;
    reownLabel: string;
    passkeyLabel: string;
    passkeyErrorLabel: string;
    continueAuthenticatedLabel: string;
    connectLabel: string;
    signedInMessage: string;
    onContinue: () => void;
    onPasskeyLogin: (session: PasskeyAuthSuccess) => void;
    onPasskeyError: (error: Error | string) => void;
  } = $props();
</script>

<article class="kefine-card kefine-card--wide">
  <section class="kefine-auth-methods">
    <fieldset>
      <p>{reownLabel}</p>
      <AuthButton />
    </fieldset>

    <fieldset>
      <p>{passkeyLabel}</p>
      <PasskeyLogin
        onSuccess={onPasskeyLogin}
        onError={(error) => {
          onPasskeyError(error instanceof Error ? error.message : passkeyErrorLabel);
        }}
      />
    </fieldset>
  </section>

  <footer>
    <button type="button" data-variant={isAuthenticated ? 'primary' : 'ghost'} disabled={!isAuthenticated} onclick={onContinue}>
      {isAuthenticated ? continueAuthenticatedLabel : connectLabel}
    </button>
  </footer>

  {#if isAuthenticated}
    <p class="kefine-status">{signedInMessage}</p>
  {/if}
</article>
