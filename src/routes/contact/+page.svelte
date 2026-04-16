<script lang="ts">
  import { browser } from '$app/environment';
  import { page } from '$app/state';
  import { resolvePublicRuntimeConfig } from '$lib/config/public-config';
  import { kefineLocale, kefineLocaleText } from '$lib/constants/kefine-locale';
  import { localizeAppPath, readLocaleFromPathname } from '$lib/routing/kefine-locale-routing';

  type ContactFact = {
    label: string;
    value: string;
    href: string | null;
  };

  type OfficialFact = {
    label: string;
    value: string;
  };

  type LegalLink = {
    label: string;
    href: string;
  };

  const localeText = $derived($kefineLocaleText);
  const runtimeConfig = $derived(resolvePublicRuntimeConfig(page.data.publicConfig));
  const activeLocale = $derived(readLocaleFromPathname(page.url.pathname) ?? 'en');
  const contactEmail = $derived(runtimeConfig.app.supportEmail || runtimeConfig.company.email || 'order@lefine.pro');
  const companyName = $derived(runtimeConfig.company.legalName || runtimeConfig.app.name || 'Lefine');
  let copyState = $state<'idle' | 'copied'>('idle');

  const contactFacts = $derived.by<ContactFact[]>(() => {
    const facts: ContactFact[] = [
      {
        label: localeText.topbar.contactPage.emailFact,
        value: contactEmail,
        href: `mailto:${contactEmail}`
      }
    ];

    if (runtimeConfig.company.phone) {
      facts.push({
        label: localeText.topbar.contactPage.phoneFact,
        value: runtimeConfig.company.phone,
        href: `tel:${runtimeConfig.company.phone.replace(/\s+/g, '')}`
      });
    }

    if (runtimeConfig.company.country) {
      facts.push({
        label: localeText.topbar.contactPage.countryFact,
        value: runtimeConfig.company.country,
        href: null
      });
    }

    return facts;
  });

  const officialFieldLabels = $derived(
    $kefineLocale === 'ru'
      ? {
          legalName: 'Юридическое наименование',
          businessType: 'Форма деятельности',
          registrationDate: 'Дата регистрации',
          registeredAddress: 'Юридический адрес',
          registrationNumber: 'Регистрационный номер',
          vatNumber: 'VAT номер',
          taxId: 'TAX ID',
          soleProprietor: 'ИП / форма предпринимателя'
        }
      : $kefineLocale === 'hy'
        ? {
            legalName: 'Իրավաբանական անվանում',
            businessType: 'Գործունեության ձև',
            registrationDate: 'Գրանցման ամսաթիվ',
            registeredAddress: 'Գրանցված հասցե',
            registrationNumber: 'Գրանցման համար',
            vatNumber: 'VAT համար',
            taxId: 'TAX ID',
            soleProprietor: 'ԱՁ / ձեռնարկատիրոջ ձև'
          }
        : {
            legalName: 'Legal name',
            businessType: 'Business type',
            registrationDate: 'Registration date',
            registeredAddress: 'Registered address',
            registrationNumber: 'Registration number',
            vatNumber: 'VAT number',
            taxId: 'Tax ID',
            soleProprietor: 'Sole proprietor / IP'
          }
  );

  const officialFacts = $derived.by<OfficialFact[]>(() =>
    [
      { label: officialFieldLabels.legalName, value: runtimeConfig.company.legalName },
      { label: officialFieldLabels.businessType, value: runtimeConfig.company.businessType },
      { label: officialFieldLabels.registrationDate, value: runtimeConfig.company.registrationDate },
      { label: officialFieldLabels.registeredAddress, value: runtimeConfig.company.registeredAddress },
      { label: officialFieldLabels.registrationNumber, value: runtimeConfig.company.registrationNumber },
      { label: officialFieldLabels.vatNumber, value: runtimeConfig.company.vatNumber },
      { label: officialFieldLabels.taxId, value: runtimeConfig.company.taxId },
      { label: officialFieldLabels.soleProprietor, value: runtimeConfig.company.soleProprietor }
    ].filter((item) => item.value.trim().length > 0)
  );

  const legalLinks = $derived.by<LegalLink[]>(() => {
    const links: LegalLink[] = [
      { label: localeText.topbar.legalLinks.privacy, href: localizeAppPath('/privacy', activeLocale) },
      { label: localeText.topbar.legalLinks.terms, href: localizeAppPath('/terms', activeLocale) }
    ];

    if (officialFacts.length > 0 || runtimeConfig.company.legalDisclaimer) {
      links.push({ label: localeText.topbar.legalLinks.company, href: localizeAppPath('/legal-information', activeLocale) });
    }

    return links;
  });

  async function copyEmail() {
    if (!browser || !navigator.clipboard) {
      return;
    }

    await navigator.clipboard.writeText(contactEmail);
    copyState = 'copied';
    window.setTimeout(() => {
      copyState = 'idle';
    }, 1400);
  }
</script>

<svelte:head>
  <title>{localeText.topbar.contactPage.title} | Lefine</title>
</svelte:head>

<lef-contact-page>
  <lef-contact-shell>
    <lef-contact-hero>
      <lef-contact-main>
        <lef-contact-copy>
          <h1>{localeText.topbar.contactPage.title}</h1>
          <p>{localeText.topbar.contactPage.description}</p>
        </lef-contact-copy>

        <lef-contact-address>
          <strong>{companyName}</strong>
          {#if runtimeConfig.company.registeredAddress}
            <p>{runtimeConfig.company.registeredAddress}</p>
          {/if}
          {#if runtimeConfig.company.country}
            <small>{runtimeConfig.company.country}</small>
          {/if}
        </lef-contact-address>

        <lef-contact-action-list>
          <button type="button" onclick={copyEmail}>
            <strong>{copyState === 'copied' ? localeText.topbar.emailDialog.copied : localeText.topbar.emailDialog.copy}</strong>
            <span>{contactEmail}</span>
          </button>
          <a href={`mailto:${contactEmail}`}>
            <strong>{localeText.topbar.contactPage.openEmail}</strong>
            <span>{localeText.topbar.contactPage.mailClientHint}</span>
          </a>
        </lef-contact-action-list>
      </lef-contact-main>
    </lef-contact-hero>

    <lef-contact-sections>
      <lef-contact-section>
        <h2>{localeText.topbar.contactPage.contactsTitle}</h2>
        <lef-contact-facts>
          {#each contactFacts as fact}
            <lef-contact-fact>
              <small>{fact.label}</small>
              {#if fact.href}
                <a href={fact.href}>{fact.value}</a>
              {:else}
                <strong>{fact.value}</strong>
              {/if}
            </lef-contact-fact>
          {/each}
        </lef-contact-facts>
      </lef-contact-section>

      <lef-contact-section>
        <h2>{localeText.topbar.legalLinks.company}</h2>
        <lef-contact-facts>
          {#if officialFacts.length > 0}
            {#each officialFacts as fact}
              <lef-contact-fact>
                <small>{fact.label}</small>
                <strong>{fact.value}</strong>
              </lef-contact-fact>
            {/each}
          {:else}
            <lef-contact-fact>
              <small>{localeText.topbar.legalLinks.company}</small>
              <strong>{companyName}</strong>
            </lef-contact-fact>
          {/if}
        </lef-contact-facts>
      </lef-contact-section>

      <lef-contact-section>
        <h2>{localeText.topbar.legalLinks.related}</h2>
        <lef-contact-docs>
          {#each legalLinks as link}
            <a href={link.href}>{link.label}</a>
          {/each}
        </lef-contact-docs>
      </lef-contact-section>
    </lef-contact-sections>
  </lef-contact-shell>
</lef-contact-page>

<style>
  lef-contact-page {
    display: block;
    min-height: 100vh;
    padding: clamp(0.8rem, 2vw, 1.45rem);
    background:
      radial-gradient(circle at top left, color-mix(in oklab, var(--kef-primary) 14%, transparent), transparent 24rem),
      linear-gradient(180deg, color-mix(in oklab, var(--kef-bg) 94%, #e7dcc8), color-mix(in oklab, var(--kef-bg-soft) 82%, #e6dac6));
  }

  lef-contact-shell {
    display: grid;
    width: min(1120px, 100%);
    margin: 0 auto;
    gap: 1.2rem;
  }

  lef-contact-hero {
    display: grid;
    grid-template-columns: minmax(0, 1fr);
    align-items: start;
  }

  lef-contact-main,
  lef-contact-copy,
  lef-contact-address,
  lef-contact-action-list,
  lef-contact-sections,
  lef-contact-section,
  lef-contact-facts {
    display: grid;
  }

  lef-contact-main {
    gap: 1rem;
    padding: 1.2rem 0;
    max-width: 52rem;
  }

  lef-contact-copy {
    gap: 0.7rem;
  }

  lef-contact-copy h1,
  lef-contact-copy p,
  lef-contact-address strong,
  lef-contact-address p,
  lef-contact-address small,
  lef-contact-fact small,
  lef-contact-fact strong,
  lef-contact-section h2 {
    margin: 0;
  }

  lef-contact-copy h1 {
    font-size: clamp(2.2rem, 4.8vw, 3.4rem);
    line-height: 0.98;
    letter-spacing: -0.03em;
    color: var(--lefine-text);
  }

  lef-contact-copy p,
  lef-contact-address p,
  lef-contact-address small,
  lef-contact-fact small {
    color: var(--lefine-text-soft);
  }

  lef-contact-copy p {
    max-width: 34rem;
    font-size: 1rem;
    line-height: 1.65;
  }

  lef-contact-address {
    gap: 0.3rem;
    padding: 1rem 1.05rem;
    border-radius: 1rem;
    background: color-mix(in oklab, var(--kef-bg-card) 94%, white 6%);
    border: 1px solid color-mix(in oklab, var(--kef-line-strong) 70%, transparent);
  }

  lef-contact-address strong {
    font-size: 1.05rem;
    color: var(--lefine-text);
  }

  lef-contact-action-list {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 0.75rem;
  }

  lef-contact-action-list button,
  lef-contact-action-list a {
    display: grid;
    gap: 0.15rem;
    justify-items: start;
    padding: 1rem 1.05rem;
    border-radius: 1rem;
    text-decoration: none;
  }

  lef-contact-action-list button {
    border: 1px solid color-mix(in oklab, var(--kef-line) 82%, white 18%);
    background: color-mix(in oklab, var(--kef-bg-card) 92%, white 8%);
    color: var(--lefine-text);
  }

  lef-contact-action-list a {
    border: 1px solid color-mix(in oklab, var(--kef-line-primary) 82%, transparent);
    background: linear-gradient(180deg, color-mix(in oklab, var(--kef-primary) 88%, #876241), color-mix(in oklab, var(--kef-primary-700) 92%, #5b4432));
    color: var(--kef-on-primary);
  }

  lef-contact-action-list strong {
    font-size: 1rem;
  }

  lef-contact-action-list span {
    color: inherit;
    opacity: 0.82;
    font-size: 0.88rem;
  }

  lef-contact-sections {
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 1rem;
  }

  lef-contact-section {
    gap: 0.8rem;
    padding: 1rem 1.05rem;
    border-radius: 1rem;
    border: 1px solid color-mix(in oklab, var(--kef-line) 82%, white 18%);
    background: color-mix(in oklab, var(--kef-bg-card) 94%, white 6%);
  }

  lef-contact-section h2 {
    font-size: 1.05rem;
    color: var(--lefine-text);
  }

  lef-contact-facts {
    gap: 0.8rem;
  }

  lef-contact-fact {
    display: grid;
    gap: 0.12rem;
  }

  lef-contact-fact a,
  lef-contact-fact strong {
    color: var(--lefine-text);
    text-decoration: none;
  }

  lef-contact-fact a:hover {
    text-decoration: underline;
  }

  lef-contact-docs {
    display: grid;
    gap: 0.55rem;
  }

  lef-contact-docs a {
    color: var(--kef-primary);
    text-decoration: none;
    font-weight: 600;
  }

  lef-contact-docs a:hover {
    text-decoration: underline;
  }

  @media (max-width: 920px) {
    lef-contact-hero,
    lef-contact-sections,
    lef-contact-action-list {
      grid-template-columns: minmax(0, 1fr);
    }
  }

  @media (max-width: 640px) {
    lef-contact-page {
      padding: 0.75rem;
    }

    lef-contact-main {
      padding: 0.4rem 0 0;
    }

    lef-contact-copy h1 {
      font-size: 2rem;
    }
  }
</style>
