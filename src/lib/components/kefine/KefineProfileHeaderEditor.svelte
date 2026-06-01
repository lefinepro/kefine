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

<lef-profile-header data-setup={isSetup} data-embedded={isEmbedded}>
  <lef-profile-header-copy data-setup={isSetup}>
    {#if isOwner}
      <lef-profile-header-title-row data-setup={isSetup}>
        <lef-profile-header-title-field data-setup={isSetup}>
          <label>
          <input
            type="text"
            data-testid="kefine-profile-first-name"
            bind:value={firstName}
            maxlength="64"
            placeholder={firstNameLabel}
            aria-label={firstNameLabel}
            onkeydown={onFieldKeydown}
          />
          </label>
        </lef-profile-header-title-field>
        <lef-profile-header-title-field data-setup={isSetup}>
          <label>
          <input
            type="text"
            data-testid="kefine-profile-surname"
            bind:value={surname}
            maxlength="64"
            placeholder={surnameLabel}
            aria-label={surnameLabel}
            onkeydown={onFieldKeydown}
          />
          </label>
        </lef-profile-header-title-field>
      </lef-profile-header-title-row>

      <lef-profile-header-handle data-setup={isSetup}>
        <label>
          <lefine-text>@</lefine-text>
          <input
            type="text"
            data-testid="kefine-profile-handle"
            bind:value={username}
            maxlength="48"
            placeholder={usernameLabel}
            aria-label={usernameLabel}
            onkeydown={onFieldKeydown}
          />
        </label>
      </lef-profile-header-handle>
    {:else}
      <h1>{displayName}</h1>
      <p>{canonicalProfilePath}</p>
    {/if}

    {#if bio.trim()}
      <lef-profile-header-bio>{bio.trim()}</lef-profile-header-bio>
    {/if}
  </lef-profile-header-copy>

  {#if !isOwner && followLabel && onFollow}
    <lef-profile-header-actions data-setup={isSetup}>
      <button type="button" data-variant="primary" onclick={onFollow}>{followLabel}</button>
    </lef-profile-header-actions>
  {/if}
</lef-profile-header>

<style>
  lef-profile-header {
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

  lef-profile-header[data-embedded='true'] {
    padding: 0;
    border: 0;
    border-radius: 0;
    background: transparent;
    box-shadow: none;
  }

  lef-profile-header[data-setup='true'] {
    justify-content: space-between;
    align-items: flex-start;
  }

  lef-profile-header-copy {
    display: grid;
    display: grid;
    gap: 0.4rem;
    justify-items: center;
    text-align: center;
    width: 100%;
  }

  lef-profile-header-copy[data-setup='true'] {
    justify-items: start;
    text-align: left;
  }

  lef-profile-header-title-row {
    display: grid;
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 0.85rem;
    width: min(100%, 34rem);
  }

  lef-profile-header-title-row[data-setup='true'] {
    gap: 0.9rem;
    width: min(100%, 100%);
  }

  lef-profile-header-title-field,
  lef-profile-header-title-field label {
    display: grid;
    gap: 0.35rem;
    padding: 0.8rem 0.95rem;
    border-radius: 1rem;
    background: color-mix(in oklab, var(--kef-color-primary) 8%, var(--kef-color-bg-card));
    border: 1px solid color-mix(in oklab, var(--kef-color-primary) 16%, transparent);
    text-align: left;
    min-width: 0;
  }

  lef-profile-header-title-field[data-setup='true'] {
    padding: 0.95rem 1rem;
    border-radius: 1.1rem;
    background: color-mix(in oklab, var(--kef-color-bg) 42%, var(--kef-color-bg-card));
    border-color: color-mix(in oklab, var(--kef-color-primary) 20%, transparent);
    box-shadow: inset 0 1px 0 color-mix(in oklab, white 5%, transparent);
  }

  lef-profile-header-title-field input {
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

  lef-profile-header-title-field input:focus {
    outline: none;
    border: 0;
    background: transparent;
    box-shadow: none;
  }

  lef-profile-header-title-field[data-setup='true'] input {
    font-size: clamp(1.8rem, 3.4vw, 2.6rem);
    line-height: 1;
    letter-spacing: -0.04em;
    font-weight: 700;
  }

  lef-profile-header-title-field[data-setup='true'] input::placeholder {
    color: color-mix(in oklab, var(--kef-color-text) 54%, transparent);
    opacity: 1;
  }

  lef-profile-header-handle,
  lef-profile-header-handle label {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 0.35rem;
    width: fit-content;
    max-width: min(100%, 24rem);
    padding: 0.15rem 0;
    color: var(--kef-color-muted);
  }

  lef-profile-header-handle[data-setup='true'] {
    justify-content: flex-start;
    margin-top: 0.35rem;
    max-width: 100%;
  }

  lef-profile-header-handle lefine-text {
    font-size: 1.45rem;
    line-height: 1;
  }

  lef-profile-header-handle input {
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

  lef-profile-header-handle input:focus {
    outline: none;
    border: 0;
    background: transparent;
    box-shadow: none;
    color: var(--kef-color-text);
  }

  lef-profile-header-copy h1,
  lef-profile-header-copy p,
  lef-profile-header-bio {
    margin: 0;
  }

  lef-profile-header-copy h1 {
    font-size: clamp(2.1rem, 4vw, 3rem);
    line-height: 0.95;
    letter-spacing: -0.05em;
  }

  lef-profile-header-copy p {
    color: var(--kef-color-muted);
  }

  lef-profile-header-bio {
    display: block;
    max-width: 44rem;
    color: var(--kef-color-muted);
  }

  lef-profile-header-actions {
    display: flex;
    display: flex;
    flex-wrap: wrap;
    gap: 0.75rem;
    position: absolute;
    top: 1.25rem;
    right: 1.25rem;
  }

  lef-profile-header-actions[data-setup='true'] {
    position: static;
    justify-content: flex-end;
    align-self: flex-start;
  }

  @media (max-width: 980px) {
    lef-profile-header {
      flex-direction: column;
      align-items: flex-start;
    }

    lef-profile-header-copy {
      justify-items: flex-start;
      text-align: left;
    }

    lef-profile-header-title-row {
      grid-template-columns: 1fr;
      width: 100%;
    }

    lef-profile-header-handle,
    lef-profile-header-handle label {
      justify-content: flex-start;
    }

    lef-profile-header-actions {
      position: static;
    }
  }
</style>
