<script lang="ts">
  let {
    currentStep,
    steps = [1, 2, 3],
    onSelect
  }: {
    currentStep: number;
    steps?: number[];
    onSelect?: (step: number) => void;
  } = $props();

  function handleSelect(step: number) {
    onSelect?.(step);
  }
</script>

<lefine-box class="profile-setup-dots" aria-label="Profile setup progress">
  {#each steps as step}
    <button
      type="button"
      class="profile-setup-dots__dot"
      data-active={step === currentStep}
      aria-label={`Step ${step}`}
      aria-current={step === currentStep ? 'step' : undefined}
      aria-disabled={!onSelect}
      onclick={() => handleSelect(step)}
    ></button>
  {/each}
</lefine-box>

<style>
  .profile-setup-dots {
    display: inline-flex;
    align-items: center;
    gap: 0.6rem;
  }

  .profile-setup-dots__dot {
    width: 0.72rem;
    height: 0.72rem;
    border: 0;
    border-radius: 999px;
    padding: 0;
    background: color-mix(in oklab, var(--kef-color-text) 16%, transparent);
    box-shadow:
      inset 0 1px 0 color-mix(in oklab, white 12%, transparent),
      0 0 0 1px color-mix(in oklab, var(--kef-color-text) 8%, transparent);
    cursor: pointer;
    transition:
      transform var(--kef-motion-fast) var(--kef-ease-soft),
      background-color var(--kef-motion-fast) var(--kef-ease-soft),
      box-shadow var(--kef-motion-fast) var(--kef-ease-soft);
  }

  .profile-setup-dots__dot[data-active='true'] {
    background: var(--kef-color-primary);
    transform: scale(1.15);
    box-shadow:
      inset 0 1px 0 color-mix(in oklab, white 18%, transparent),
      0 0 0 1px color-mix(in oklab, var(--kef-color-primary) 24%, transparent),
      0 8px 18px color-mix(in oklab, var(--kef-color-primary) 20%, transparent);
  }

  .profile-setup-dots__dot[aria-disabled='true'] {
    cursor: default;
  }
</style>
