<script lang="ts">
  let {
    message,
    retryLabel,
    onRetry
  }: {
    message: string;
    retryLabel: string;
    onRetry: () => void;
  } = $props();
</script>

<article class="kefine-card kefine-card--wide">
  <p role="alert">{message}</p>
  <footer>
    <button type="button" data-variant="primary" onclick={onRetry}>{retryLabel}</button>
  </footer>
</article>
