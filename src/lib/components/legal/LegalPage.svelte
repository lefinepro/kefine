<script lang="ts">
  import type { LegalPageContent } from '$lib/constants/legal-content';

  let {
    content,
    updatedLabel
  }: {
    content: LegalPageContent;
    updatedLabel: string;
  } = $props();
</script>

<svelte:head>
  <title>{content.title} | Lefine</title>
</svelte:head>

<lef-legal-shell>
  <lef-legal-card>
    <lef-legal-header>
      <lef-legal-updated>{updatedLabel}: {content.updatedAt}</lef-legal-updated>
      <h1>{content.title}</h1>
      {#each content.intro as paragraph}
        <p>{paragraph}</p>
      {/each}
    </lef-legal-header>

    <lef-legal-sections>
      {#each content.sections as section}
        <lef-legal-section>
          <h2>{section.title}</h2>
          {#if section.facts?.length}
            <lef-legal-facts>
              {#each section.facts as fact}
                <lef-legal-fact>
                  <dt>{fact.label}</dt>
                  <dd>{fact.value}</dd>
                </lef-legal-fact>
              {/each}
            </lef-legal-facts>
          {/if}
          {#if section.paragraphs}
            {#each section.paragraphs as paragraph}
              <p>{paragraph}</p>
            {/each}
          {/if}
          {#if section.bullets?.length}
            <lef-legal-bullets>
              {#each section.bullets as bullet}
                <li>{bullet}</li>
              {/each}
            </lef-legal-bullets>
          {/if}
        </lef-legal-section>
      {/each}
    </lef-legal-sections>
  </lef-legal-card>
</lef-legal-shell>

<style>
  lef-legal-shell {
    display: block;
    min-height: 100vh;
    padding: clamp(0.85rem, 2.4vw, 1.5rem);
    background: color-mix(in oklab, var(--kef-bg, #f5f0e7) 92%, #efe2c8);
  }

  lef-legal-card {
    display: grid;
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

  lef-legal-header {
    display: grid;
    display: grid;
    gap: 0.8rem;
  }

  lef-legal-updated {
    display: block;
    margin: 0;
    font-size: 0.78rem;
    color: color-mix(in oklab, var(--lefine-text-soft, #5d5144) 92%, #8a745d);
    text-transform: uppercase;
    letter-spacing: 0.12em;
  }

  lef-legal-header h1,
  lef-legal-section h2 {
    margin: 0;
    color: var(--lefine-text, #30281f);
  }

  lef-legal-header h1 {
    font-size: clamp(1.9rem, 4vw, 2.7rem);
    line-height: 1.05;
    letter-spacing: -0.02em;
  }

  lef-legal-section h2 {
    font-size: 1.02rem;
    font-weight: 700;
  }

  lef-legal-header p,
  lef-legal-section p,
  lef-legal-facts dd,
  lef-legal-facts dt,
  lef-legal-bullets li {
    margin: 0;
    color: color-mix(in oklab, var(--lefine-text-soft, #5d5144) 94%, #695949);
    line-height: 1.76;
    max-width: 72ch;
  }

  lef-legal-facts {
    display: grid;
    margin: 0;
  }

  lef-legal-facts,
  lef-legal-fact {
    display: grid;
    gap: 0.55rem;
  }

  lef-legal-fact {
    gap: 0.12rem;
  }

  lef-legal-facts dt {
    font-weight: 700;
    color: var(--lefine-text, #30281f);
  }

  lef-legal-facts dd {
    margin: 0;
  }

  lef-legal-bullets {
    display: grid;
    margin: 0;
    padding-left: 1.15rem;
    display: grid;
    gap: 0.35rem;
  }

  lef-legal-sections {
    display: grid;
    gap: 1rem;
  }

  lef-legal-section {
    display: grid;
    display: grid;
    gap: 0.62rem;
    padding-top: 0.9rem;
    border-top: 1px solid color-mix(in oklab, var(--kef-border, #c8bbab) 44%, transparent);
  }
  @media (max-width: 720px) {
    lef-legal-shell {
      padding: 0.75rem;
    }

    lef-legal-card {
      padding: 0.95rem;
      gap: 1.1rem;
    }
  }
</style>
