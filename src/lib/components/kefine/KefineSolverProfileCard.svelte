<script lang="ts">
  import Icon from '@iconify/svelte';

  interface SolverProfileText {
    solverProfileTitle: string;
    solverProfileSubtitle: string;
    solverProfileConnection: string;
    solverProfileWorkspace: string;
    solverProfileLocalSolver: string;
    solverProfileConnectText: string;
    solverProfileNotConnected: string;
    solverProfileConnected: string;
    createSolverProfile: string;
    solverProfileToken: string;
    solverProfileEndpoint: string;
    solverProfileHeader: string;
    solverProfilePending: string;
    solverProfileTokenHint: string;
    copySolverToken: string;
    solverTokenCopied: string;
  }

  interface Props {
    text: SolverProfileText;
    workspaceHandle: string;
    solverHandle: string;
    token: string;
    endpoint: string;
    authHeader: string;
    created: boolean;
    copied: boolean;
    onCreate: () => void;
    onCopy: () => void;
  }

  let {
    text,
    workspaceHandle,
    solverHandle,
    token,
    endpoint,
    authHeader,
    created,
    copied,
    onCreate,
    onCopy
  }: Props = $props();
</script>

<!--
  Single OAuth-style solver connection card. The connection visual mirrors the
  /oauth/authorize screen (two badges joined by a dashed link), so creating a
  solver profile feels like authorising an OAuth app: connect, get a token,
  copy it. The local solver is created automatically with a random handle.
-->
<lefine-box class="solver-card" data-active={created} data-testid="kefine-solver-profile-panel">
  <lefine-box class="solver-card__head">
    <lefine-box>
      <strong>{text.solverProfileTitle}</strong>
      <p>{text.solverProfileSubtitle}</p>
    </lefine-box>
    <lefine-box class="solver-card__status" data-active={created}>
      <Icon icon={created ? 'lucide:check' : 'lucide:plug'} aria-hidden="true" />
      <lefine-text>{created ? text.solverProfileConnected : text.solverProfileNotConnected}</lefine-text>
    </lefine-box>
  </lefine-box>

  <lefine-box class="solver-connection" aria-label={text.solverProfileConnection}>
    <lefine-box class="solver-connection__node">
      <lefine-box class="solver-connection__badge" aria-hidden="true">
        <Icon icon="lucide:user-round" />
      </lefine-box>
      <lefine-text>{text.solverProfileWorkspace}</lefine-text>
      <strong>@{workspaceHandle}</strong>
    </lefine-box>

    <lefine-box class="solver-connection__link" aria-hidden="true">
      <Icon icon="lucide:shield-check" />
    </lefine-box>

    <lefine-box class="solver-connection__node">
      <lefine-box class="solver-connection__badge" aria-hidden="true">
        <Icon icon="lucide:cpu" />
      </lefine-box>
      <lefine-text>{text.solverProfileLocalSolver}</lefine-text>
      <strong data-testid="kefine-solver-profile-handle">
        {#if created}@{solverHandle}{:else}{text.solverProfilePending}{/if}
      </strong>
    </lefine-box>
  </lefine-box>

  <p class="solver-card__copy">{text.solverProfileConnectText}</p>

  {#if created}
    <lefine-box class="solver-token-grid">
      <label class="solver-field">
        <lefine-text>{text.solverProfileToken}</lefine-text>
        <input
          data-testid="kefine-solver-profile-token"
          value={token}
          readonly
          aria-label={text.solverProfileToken}
        />
      </label>
      <button
        type="button"
        data-variant="primary"
        data-testid="kefine-solver-profile-copy"
        onclick={onCopy}
        aria-label={copied ? text.solverTokenCopied : text.copySolverToken}
      >
        <Icon icon={copied ? 'lucide:check' : 'lucide:copy'} aria-hidden="true" />
        <lefine-text>{copied ? text.solverTokenCopied : text.copySolverToken}</lefine-text>
      </button>
    </lefine-box>

    <lefine-box class="solver-config" data-testid="kefine-solver-profile-inbox">
      <lefine-text>{text.solverProfileEndpoint}</lefine-text>
      <code>{endpoint}</code>
    </lefine-box>
    <lefine-box class="solver-config">
      <lefine-text>{text.solverProfileHeader}</lefine-text>
      <code>{authHeader}</code>
    </lefine-box>
  {:else}
    <lefine-box class="solver-create-row">
      <button
        type="button"
        data-variant="primary"
        data-testid="kefine-solver-profile-create"
        onclick={onCreate}
      >
        <Icon icon="lucide:key-round" aria-hidden="true" />
        <lefine-text>{text.createSolverProfile}</lefine-text>
      </button>
      <small>{text.solverProfileTokenHint}</small>
    </lefine-box>
  {/if}
</lefine-box>

<style>
  .solver-card,
  .solver-card__head,
  .solver-token-grid,
  .solver-create-row,
  .solver-config {
    display: grid;
    gap: 0.85rem;
  }

  .solver-card {
    padding: 1rem;
    border-radius: 1rem;
    border: 1px solid color-mix(in oklab, var(--kef-color-primary) 18%, transparent);
    background: color-mix(in oklab, var(--kef-color-bg) 38%, var(--kef-color-bg-card));
    box-shadow: inset 0 1px 0 color-mix(in oklab, white 7%, transparent);
  }

  .solver-card[data-active='true'] {
    border-color: color-mix(in oklab, var(--kef-color-primary) 32%, transparent);
    background: color-mix(in oklab, var(--kef-color-primary) 8%, var(--kef-color-bg-card));
  }

  .solver-card__head {
    grid-template-columns: minmax(0, 1fr) auto;
    align-items: start;
  }

  .solver-card__head strong,
  .solver-card__head p,
  .solver-card__copy {
    margin: 0;
  }

  .solver-card__head p,
  .solver-card__copy,
  .solver-create-row small {
    color: var(--kef-color-muted);
  }

  .solver-card__status,
  .solver-token-grid button,
  .solver-create-row button {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 0.55rem;
  }

  .solver-card__status {
    min-height: 2.25rem;
    padding: 0.45rem 0.7rem;
    border-radius: 999px;
    border: 1px solid color-mix(in oklab, var(--kef-color-text) 10%, transparent);
    background: color-mix(in oklab, var(--kef-color-bg-card) 76%, transparent);
    color: var(--kef-color-muted);
    white-space: nowrap;
  }

  .solver-card__status[data-active='true'] {
    border-color: color-mix(in oklab, var(--kef-color-primary) 28%, transparent);
    background: color-mix(in oklab, var(--kef-color-primary) 14%, transparent);
    color: var(--kef-color-text);
  }

  .solver-card__status :global(svg),
  .solver-token-grid button :global(svg),
  .solver-create-row button :global(svg),
  .solver-connection__badge :global(svg),
  .solver-connection__link :global(svg) {
    width: 1rem;
    height: 1rem;
    flex: 0 0 auto;
  }

  /* OAuth-style connection visual: two nodes joined by a dashed link. */
  .solver-connection {
    position: relative;
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto minmax(0, 1fr);
    align-items: center;
    gap: 0.75rem;
  }

  .solver-connection::before {
    content: '';
    position: absolute;
    top: 1.6rem;
    left: 18%;
    right: 18%;
    height: 1px;
    background: repeating-linear-gradient(
      to right,
      color-mix(in oklab, var(--kef-color-text) 24%, transparent) 0,
      color-mix(in oklab, var(--kef-color-text) 24%, transparent) 4px,
      transparent 4px,
      transparent 9px
    );
    z-index: 0;
  }

  .solver-connection__node {
    position: relative;
    z-index: 1;
    display: grid;
    justify-items: center;
    gap: 0.3rem;
    min-width: 0;
    padding: 0.4rem;
    text-align: center;
  }

  .solver-connection__badge {
    display: grid;
    place-items: center;
    width: 3.2rem;
    aspect-ratio: 1;
    border-radius: 0.9rem;
    background: color-mix(in oklab, var(--kef-color-bg-card) 88%, transparent);
    border: 1px solid color-mix(in oklab, var(--kef-color-text) 10%, transparent);
    color: var(--kef-color-text);
  }

  .solver-connection__badge :global(svg) {
    width: 1.4rem;
    height: 1.4rem;
  }

  .solver-connection__link {
    position: relative;
    z-index: 1;
    display: grid;
    place-items: center;
    width: 2rem;
    aspect-ratio: 1;
    border-radius: 999px;
    background: var(--kef-color-bg-card);
    border: 1px solid color-mix(in oklab, var(--kef-color-primary) 24%, transparent);
    color: var(--kef-color-primary);
  }

  .solver-connection__node lefine-text {
    color: var(--kef-color-muted);
    font-size: 0.82rem;
  }

  .solver-connection__node strong,
  .solver-config code,
  .solver-token-grid input {
    min-width: 0;
    overflow-wrap: anywhere;
  }

  .solver-connection__node strong {
    display: block;
  }

  .solver-token-grid {
    grid-template-columns: minmax(0, 1fr) auto;
    align-items: end;
  }

  .solver-field {
    display: grid;
    gap: 0.4rem;
  }

  .solver-field lefine-text,
  .solver-config lefine-text {
    color: var(--kef-color-muted);
    font-size: 0.82rem;
  }

  .solver-token-grid input,
  .solver-config {
    border-radius: 0.85rem;
    border: 1px solid color-mix(in oklab, var(--kef-color-text) 8%, transparent);
    background: color-mix(in oklab, var(--kef-color-bg-card) 82%, transparent);
  }

  .solver-token-grid input {
    width: 100%;
    min-height: 2.75rem;
    padding: 0 0.85rem;
    color: var(--kef-color-text);
    font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', monospace;
    font-size: 0.86rem;
  }

  .solver-token-grid button,
  .solver-create-row button {
    min-height: 2.75rem;
  }

  .solver-config {
    gap: 0.35rem;
    padding: 0.75rem 0.85rem;
  }

  .solver-config code {
    color: var(--kef-color-text);
    font-size: 0.84rem;
  }

  @media (max-width: 640px) {
    .solver-card__head,
    .solver-token-grid {
      grid-template-columns: 1fr;
    }

    .solver-card__status {
      width: fit-content;
    }

    .solver-connection {
      grid-template-columns: 1fr;
    }

    .solver-connection::before {
      display: none;
    }

    .solver-connection__link {
      transform: rotate(90deg);
    }
  }
</style>
