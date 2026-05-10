<script lang="ts">
  type Comment = {
    id: string;
    text: string;
    timestamp: number;
    pending?: boolean;
  };

  let {
    title,
    description,
    comments,
    isCorrectingTask,
    onSubmitCorrection
  }: {
    title: string;
    description: string;
    comments: Comment[];
    isCorrectingTask: boolean;
    onSubmitCorrection: (text: string) => void;
  } = $props();

  let draftCorrection = $state('');

  function handleSubmit(event: Event) {
    event.preventDefault();
    const text = draftCorrection.trim();
    if (!text || isCorrectingTask) return;
    onSubmitCorrection(text);
    draftCorrection = '';
  }

  function formatTime(ts: number): string {
    const date = new Date(ts);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
</script>

<lef-task-panel>
  <lef-task-card>
    <lef-task-head>
      <strong>Task</strong>
      {#if comments.length > 0}
        <lefine-text>{comments.length} {comments.length === 1 ? 'comment' : 'comments'}</lefine-text>
      {/if}
    </lef-task-head>
    {#if description && description !== title}
      <p class="lef-task-description">{description}</p>
    {:else}
      <p class="lef-task-description">{title}</p>
    {/if}

    {#if comments.length > 0}
      <lef-comments-list>
        {#each comments as comment (comment.id)}
          <lef-comment-row class:lef-comment-row--pending={comment.pending}>
            <lef-comment-bubble>
              <p>{comment.text}</p>
              <lef-comment-meta>
                <lefine-text>{formatTime(comment.timestamp)}</lefine-text>
                {#if comment.pending}
                  <lef-correction-arrow aria-label="Correction in progress" title="Correction is being applied">
                    <lef-arrow-track>
                      <lef-arrow-tip>➵</lef-arrow-tip>
                    </lef-arrow-track>
                    <lefine-text>applying…</lefine-text>
                  </lef-correction-arrow>
                {/if}
              </lef-comment-meta>
            </lef-comment-bubble>
          </lef-comment-row>
        {/each}
      </lef-comments-list>
    {/if}

    <form class="lef-correction-form" onsubmit={handleSubmit}>
      <textarea
        class="lef-correction-input"
        placeholder="Send a correction…"
        bind:value={draftCorrection}
        rows="1"
        disabled={isCorrectingTask}
        aria-label="Send a correction"
      ></textarea>
      <button
        type="submit"
        class="lef-correction-submit"
        disabled={isCorrectingTask || !draftCorrection.trim()}
        aria-label="Submit correction"
      >
        {#if isCorrectingTask}
          <lef-correction-arrow aria-hidden="true">
            <lef-arrow-track>
              <lef-arrow-tip>➵</lef-arrow-tip>
            </lef-arrow-track>
          </lef-correction-arrow>
        {:else}
          <lefine-text>Send</lefine-text>
        {/if}
      </button>
    </form>
  </lef-task-card>
</lef-task-panel>

<style>
  lef-task-panel {
    display: flex;
    flex-direction: column;
    gap: 0.6rem;
  }

  lef-task-card {
    display: flex;
    flex-direction: column;
    gap: 0.55rem;
    padding: 0.7rem 0.95rem 0.85rem;
    background: var(--kef-bg-card);
    border: 1px solid var(--kef-line);
    border-radius: 0.6rem;
  }

  lef-task-head {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: 0.5rem;
  }

  lef-task-head strong {
    font-size: 0.72rem;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: var(--lefine-text-soft);
    font-weight: 700;
  }

  lef-task-head lefine-text {
    font-size: 0.72rem;
    color: var(--lefine-text-soft);
  }

  .lef-task-description {
    margin: 0;
    font-size: 0.84rem;
    color: var(--lefine-text-soft);
    line-height: 1.45;
    white-space: pre-wrap;
  }

  lef-comments-list {
    display: flex;
    flex-direction: column;
    gap: 0.45rem;
  }

  lef-comment-row {
    display: flex;
    flex-direction: column;
    animation: lef-comment-appear 280ms cubic-bezier(0.22, 1, 0.36, 1) both;
  }

  @keyframes lef-comment-appear {
    0% { opacity: 0; transform: translateY(4px); }
    100% { opacity: 1; transform: translateY(0); }
  }

  lef-comment-bubble {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    padding: 0.55rem 0.75rem 0.5rem;
    background: color-mix(in oklab, var(--kef-color-primary, #3a7afe) 8%, var(--kef-bg-soft));
    border: 1px solid color-mix(in oklab, var(--kef-color-primary, #3a7afe) 25%, transparent);
    border-radius: 0.5rem 0.5rem 0.5rem 0.15rem;
    align-self: flex-end;
    max-width: 90%;
  }

  lef-comment-bubble p {
    margin: 0;
    font-size: 0.86rem;
    color: var(--lefine-text);
    white-space: pre-wrap;
    overflow-wrap: break-word;
  }

  lef-comment-meta {
    display: inline-flex;
    align-items: center;
    gap: 0.45rem;
    font-size: 0.7rem;
    color: var(--lefine-text-soft);
  }

  .lef-correction-form {
    display: grid;
    grid-template-columns: 1fr auto;
    gap: 0.4rem;
    align-items: stretch;
    margin-top: 0.35rem;
  }

  .lef-correction-input {
    appearance: none;
    border: 1px solid var(--kef-line);
    border-radius: 0.5rem;
    padding: 0.5rem 0.7rem;
    background: var(--kef-bg-soft);
    color: var(--lefine-text);
    font-family: inherit;
    font-size: 0.86rem;
    line-height: 1.35;
    resize: vertical;
    min-height: 2.4rem;
    max-height: 8rem;
  }

  .lef-correction-input:focus {
    outline: none;
    border-color: color-mix(in oklab, var(--kef-color-primary, #3a7afe) 60%, var(--kef-line));
  }

  .lef-correction-submit {
    appearance: none;
    border: none;
    border-radius: 0.5rem;
    padding: 0 0.85rem;
    background: var(--kef-color-primary, #3a7afe);
    color: var(--lefine-on-primary, #ffffff);
    font-weight: 600;
    font-size: 0.85rem;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 3rem;
    transition: opacity 160ms ease, transform 160ms ease;
  }

  .lef-correction-submit:disabled {
    opacity: 0.55;
    cursor: not-allowed;
  }

  .lef-correction-submit:not(:disabled):hover {
    transform: translateY(-1px);
  }

  lef-correction-arrow {
    display: inline-flex;
    align-items: center;
    gap: 0.3rem;
    font-size: 0.7rem;
    color: var(--kef-color-primary, #3a7afe);
    font-weight: 600;
  }

  lef-arrow-track {
    display: inline-block;
    width: 1.6rem;
    height: 0.85rem;
    position: relative;
    overflow: hidden;
  }

  lef-arrow-tip {
    display: inline-block;
    position: absolute;
    left: 0;
    top: 0;
    font-size: 0.85rem;
    line-height: 0.85rem;
    color: currentColor;
    animation: lef-arrow-fly 1.1s linear infinite;
  }

  @keyframes lef-arrow-fly {
    0%   { transform: translateX(-90%); opacity: 0; }
    20%  { opacity: 1; }
    80%  { opacity: 1; }
    100% { transform: translateX(110%); opacity: 0; }
  }

  @media (prefers-reduced-motion: reduce) {
    lef-arrow-tip { animation: none; }
    lef-comment-row { animation: none; }
  }
</style>
