<script lang="ts">
  let {
    isOwner,
    isSetup,
    isEmbedded = false,
    displayName,
    canonicalProfilePath,
    firstName = $bindable(''),
    surname = $bindable(''),
    username = $bindable(''),
    bio = '',
    firstNameLabel,
    surnameLabel,
    usernameLabel,
    followLabel = '',
    onFollow,
    onFieldKeydown
  }: {
    isOwner: boolean;
    isSetup: boolean;
    isEmbedded?: boolean;
    displayName: string;
    canonicalProfilePath: string;
    firstName: string;
    surname: string;
    username: string;
    bio?: string;
    firstNameLabel: string;
    surnameLabel: string;
    usernameLabel: string;
    followLabel?: string;
    onFollow?: () => void;
    onFieldKeydown?: (event: KeyboardEvent) => void;
  } = $props();
</script>

<article class="profile-header" data-setup={isSetup} data-embedded={isEmbedded}>
  <lefine-box class="profile-header__copy" data-setup={isSetup}>
    {#if isOwner}
      <lefine-box class="profile-header__title-row" data-setup={isSetup}>
        <label class="profile-header__title-field" data-setup={isSetup}>
          <input
            type="text"
            bind:value={firstName}
            maxlength="64"
            placeholder={firstNameLabel}
            aria-label={firstNameLabel}
            onkeydown={onFieldKeydown}
          />
        </label>
        <label class="profile-header__title-field" data-setup={isSetup}>
          <input
            type="text"
            bind:value={surname}
            maxlength="64"
            placeholder={surnameLabel}
            aria-label={surnameLabel}
            onkeydown={onFieldKeydown}
          />
        </label>
      </lefine-box>

      <label class="profile-header__handle" data-setup={isSetup}>
        <lefine-text>@</lefine-text>
        <input
          type="text"
          bind:value={username}
          maxlength="48"
          placeholder="localhost"
          aria-label={usernameLabel}
          onkeydown={onFieldKeydown}
        />
      </label>
    {:else}
      <h1>{displayName}</h1>
      <p>{canonicalProfilePath}</p>
    {/if}

    {#if bio.trim()}
      <p class="profile-header__bio">{bio.trim()}</p>
    {/if}
  </lefine-box>

  {#if !isOwner && followLabel && onFollow}
    <lefine-box class="profile-header__actions" data-setup={isSetup}>
      <button type="button" data-variant="primary" onclick={onFollow}>{followLabel}</button>
    </lefine-box>
  {/if}
</article>

<style>
  .profile-header {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.75rem;
    padding: 1.25rem;
    border-radius: 1.1rem;
    background: color-mix(in oklab, var(--kef-color-bg-card) 97%, var(--kef-color-bg));
    border: 1px solid color-mix(in oklab, var(--kef-color-text) 8%, transparent);
    box-shadow: 0 18px 40px color-mix(in oklab, black 18%, transparent);
  }

  .profile-header[data-embedded='true'] {
    padding: 0;
    border: 0;
    border-radius: 0;
    background: transparent;
    box-shadow: none;
  }

  .profile-header[data-setup='true'] {
    justify-content: space-between;
    align-items: flex-start;
  }

  .profile-header__copy {
    display: grid;
    gap: 0.4rem;
    justify-items: center;
    text-align: center;
    width: 100%;
  }

  .profile-header__copy[data-setup='true'] {
    justify-items: start;
    text-align: left;
  }

  .profile-header__title-row {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 0.85rem;
    width: min(100%, 34rem);
  }

  .profile-header__title-row[data-setup='true'] {
    gap: 0.9rem;
    width: min(100%, 100%);
  }

  .profile-header__title-field {
    display: grid;
    gap: 0.35rem;
    padding: 0.8rem 0.95rem;
    border-radius: 1rem;
    background: color-mix(in oklab, var(--kef-color-primary) 8%, var(--kef-color-bg-card));
    border: 1px solid color-mix(in oklab, var(--kef-color-primary) 16%, transparent);
    text-align: left;
    min-width: 0;
  }

  .profile-header__title-field[data-setup='true'] {
    padding: 0.95rem 1rem;
    border-radius: 1.1rem;
    background: color-mix(in oklab, var(--kef-color-bg) 42%, var(--kef-color-bg-card));
    border-color: color-mix(in oklab, var(--kef-color-primary) 20%, transparent);
    box-shadow: inset 0 1px 0 color-mix(in oklab, white 5%, transparent);
  }

  .profile-header__title-field input {
    width: 100%;
    min-width: 0;
    padding: 0;
    border: 0;
    border-radius: 0;
    background: transparent;
    color: var(--kef-color-text);
    box-shadow: none;
    font-size: clamp(1.25rem, 2vw, 1.7rem);
    line-height: 1.1;
  }

  .profile-header__title-field input:focus {
    outline: none;
    border: 0;
    background: transparent;
    box-shadow: none;
  }

  .profile-header__title-field[data-setup='true'] input {
    font-size: clamp(1.8rem, 3.4vw, 2.6rem);
    line-height: 1;
    letter-spacing: -0.04em;
    font-weight: 700;
  }

  .profile-header__title-field[data-setup='true'] input::placeholder {
    color: color-mix(in oklab, var(--kef-color-text) 54%, transparent);
    opacity: 1;
  }

  .profile-header__handle {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 0.35rem;
    width: fit-content;
    max-width: min(100%, 24rem);
    padding: 0.15rem 0;
    color: var(--kef-color-muted);
  }

  .profile-header__handle[data-setup='true'] {
    justify-content: flex-start;
    margin-top: 0.35rem;
    max-width: 100%;
  }

  .profile-header__handle lefine-text {
    font-size: 1.45rem;
    line-height: 1;
  }

  .profile-header__handle input {
    min-width: 0;
    width: min(100%, 22rem);
    padding: 0;
    border: 0;
    border-radius: 0;
    background: transparent;
    color: var(--kef-color-muted);
    font-size: 1.45rem;
    line-height: 1.1;
    box-shadow: none;
  }

  .profile-header__handle input:focus {
    outline: none;
    border: 0;
    background: transparent;
    box-shadow: none;
    color: var(--kef-color-text);
  }

  .profile-header__copy h1,
  .profile-header__copy p {
    margin: 0;
  }

  .profile-header__copy h1 {
    font-size: clamp(2.1rem, 4vw, 3rem);
    line-height: 0.95;
    letter-spacing: -0.05em;
  }

  .profile-header__copy p {
    color: var(--kef-color-muted);
  }

  .profile-header__bio {
    max-width: 44rem;
    color: var(--kef-color-muted);
  }

  .profile-header__actions {
    display: flex;
    flex-wrap: wrap;
    gap: 0.75rem;
    position: absolute;
    top: 1.25rem;
    right: 1.25rem;
  }

  .profile-header__actions[data-setup='true'] {
    position: static;
    justify-content: flex-end;
    align-self: flex-start;
  }

  @media (max-width: 980px) {
    .profile-header {
      flex-direction: column;
      align-items: flex-start;
    }

    .profile-header__copy {
      justify-items: flex-start;
      text-align: left;
    }

    .profile-header__title-row {
      grid-template-columns: 1fr;
      width: 100%;
    }

    .profile-header__handle {
      justify-content: flex-start;
    }

    .profile-header__actions {
      position: static;
    }
  }
</style>
