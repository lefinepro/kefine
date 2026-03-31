<script lang="ts">
  import type { LegalPageContent, LegalPageId } from '$lib/constants/legal-content';

  type RelatedLink = {
    id: LegalPageId;
    label: string;
    href: string;
  };

  let {
    content,
    relatedLinks,
    backLabel,
    backHref,
    relatedLabel,
    updatedLabel
  }: {
    content: LegalPageContent;
    relatedLinks: RelatedLink[];
    backLabel: string;
    backHref: string;
    relatedLabel: string;
    updatedLabel: string;
  } = $props();
</script>

<svelte:head>
  <title>{content.title} | Lefine</title>
</svelte:head>

<main class="legal-shell">
  <article class="legal-card">
    <a class="legal-back" href={backHref}>{backLabel}</a>

    <header class="legal-header">
      <p class="legal-updated">{updatedLabel}: {content.updatedAt}</p>
      <h1>{content.title}</h1>
      {#each content.intro as paragraph}
        <p>{paragraph}</p>
      {/each}
    </header>

    <section class="legal-sections">
      {#each content.sections as section}
        <section class="legal-section">
          <h2>{section.title}</h2>
          {#if section.facts?.length}
            <dl class="legal-facts">
              {#each section.facts as fact}
                <div class="legal-fact">
                  <dt>{fact.label}</dt>
                  <dd>{fact.value}</dd>
                </div>
              {/each}
            </dl>
          {/if}
          {#if section.paragraphs}
            {#each section.paragraphs as paragraph}
              <p>{paragraph}</p>
            {/each}
          {/if}
          {#if section.bullets?.length}
            <ul class="legal-bullets">
              {#each section.bullets as bullet}
                <li>{bullet}</li>
              {/each}
            </ul>
          {/if}
        </section>
      {/each}
    </section>

    <footer class="legal-footer">
      <h2>{relatedLabel}</h2>
      <nav class="legal-links" aria-label={relatedLabel}>
        {#each relatedLinks as link}
          <a href={link.href}>{link.label}</a>
        {/each}
      </nav>
    </footer>
  </article>
</main>

<style>
  .legal-shell {
    min-height: 100vh;
    padding: clamp(0.85rem, 2.4vw, 1.5rem);
    background: color-mix(in oklab, var(--kef-bg, #f5f0e7) 92%, #efe2c8);
  }

  .legal-card {
    width: min(900px, 100%);
    margin: 0 auto;
    display: grid;
    gap: 1.35rem;
    padding: clamp(1rem, 2.8vw, 2rem);
    border-radius: 0.45rem;
    border: 1px solid color-mix(in oklab, var(--kef-border, #c8bbab) 72%, #f7ecda);
    background:
      linear-gradient(180deg, color-mix(in oklab, var(--kef-bg-card, #fbf7f1) 96%, #fff8ea), color-mix(in oklab, var(--kef-bg-card, #fbf7f1) 92%, #f2e5cf));
    box-shadow:
      0 2px 0 color-mix(in oklab, white 42%, transparent) inset,
      0 10px 24px color-mix(in oklab, #5d4a37 6%, transparent);
  }

  .legal-back,
  .legal-links a {
    color: color-mix(in oklab, var(--kef-primary, #6f5540) 84%, #6a5642);
    text-decoration: none;
  }

  .legal-back:hover,
  .legal-links a:hover {
    text-decoration: underline;
  }

  .legal-back {
    font-size: 0.94rem;
  }

  .legal-header {
    display: grid;
    gap: 0.8rem;
  }

  .legal-updated {
    margin: 0;
    font-size: 0.78rem;
    color: color-mix(in oklab, var(--kef-text-soft, #5d5144) 92%, #8a745d);
    text-transform: uppercase;
    letter-spacing: 0.12em;
  }

  .legal-header h1,
  .legal-section h2,
  .legal-footer h2 {
    margin: 0;
    color: var(--kef-text, #30281f);
  }

  .legal-header h1 {
    font-size: clamp(1.9rem, 4vw, 2.7rem);
    line-height: 1.05;
    letter-spacing: -0.02em;
  }

  .legal-section h2,
  .legal-footer h2 {
    font-size: 1.02rem;
    font-weight: 700;
  }

  .legal-header p,
  .legal-section p,
  .legal-facts dd,
  .legal-facts dt,
  .legal-bullets li {
    margin: 0;
    color: color-mix(in oklab, var(--kef-text-soft, #5d5144) 94%, #695949);
    line-height: 1.76;
    max-width: 72ch;
  }

  .legal-facts {
    display: grid;
    gap: 0.55rem;
    margin: 0;
  }

  .legal-fact {
    display: grid;
    gap: 0.12rem;
  }

  .legal-facts dt {
    font-weight: 700;
    color: var(--kef-text, #30281f);
  }

  .legal-facts dd {
    margin: 0;
  }

  .legal-bullets {
    margin: 0;
    padding-left: 1.15rem;
    display: grid;
    gap: 0.35rem;
  }

  .legal-sections {
    display: grid;
    gap: 1rem;
  }

  .legal-section {
    display: grid;
    gap: 0.62rem;
    padding-top: 0.9rem;
    border-top: 1px solid color-mix(in oklab, var(--kef-border, #c8bbab) 44%, transparent);
  }

  .legal-footer {
    display: grid;
    gap: 0.7rem;
    padding-top: 1rem;
    border-top: 1px solid color-mix(in oklab, var(--kef-border, #c8bbab) 44%, transparent);
  }

  .legal-links {
    display: flex;
    flex-wrap: wrap;
    gap: 0.65rem 1rem;
  }

  @media (max-width: 720px) {
    .legal-shell {
      padding: 0.75rem;
    }

    .legal-card {
      padding: 0.95rem;
      gap: 1.1rem;
    }
  }
</style>
