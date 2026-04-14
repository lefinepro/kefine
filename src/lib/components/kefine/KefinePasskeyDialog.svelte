<script lang="ts">
  import KefineModal from '$lib/components/kefine/KefineModal.svelte';
  import PasskeyLogin from '$lib/components/passkeys/PasskeyLogin.svelte';
  import type { PasskeyAuthSuccess } from '$lib/auth/routes';

  let {
    open,
    title,
    onClose,
    onSuccess,
    onError
  }: {
    open: boolean;
    title: string;
    onClose: () => void;
    onSuccess: (session: PasskeyAuthSuccess) => void;
    onError: (error: Error | string) => void;
  } = $props();

</script>

<KefineModal open={open} onClose={onClose} showClose={false} width="medium">
  <PasskeyLogin
    title={title}
    description="Enter your handle once. If a passkey already exists, sign in. If the server is unavailable, a local passkey profile will be saved."
    onSuccess={onSuccess}
    onError={(error) => {
      onError(error instanceof Error ? error.message : error);
    }}
  />
</KefineModal>
