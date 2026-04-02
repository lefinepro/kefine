import type { KefineLocale } from '$lib/constants/kefine-locale';
import { COMPANY_CONTENT } from '$lib/constants/legal-company-content';
import { PRIVACY_CONTENT, TERMS_CONTENT } from '$lib/constants/legal-static-content';
import type { KefineCompanyPublicConfig } from '$lib/config/public-config';

export type LegalPageId = 'privacy' | 'terms' | 'company';

export type LegalFact = {
  label: string;
  value: string;
};

export type LegalSection = {
  title: string;
  paragraphs?: string[];
  bullets?: string[];
  facts?: LegalFact[];
};

export type LegalPageContent = {
  id: LegalPageId;
  path: '/privacy' | '/terms' | '/legal-information';
  title: string;
  updatedAt: string;
  intro: string[];
  sections: LegalSection[];
};

function compactFacts(facts: LegalFact[]): LegalFact[] {
  return facts.filter((fact) => fact.value.trim().length > 0);
}

function formatCompanyFacts(locale: KefineLocale, company: KefineCompanyPublicConfig): LegalFact[] {
  const labels = {
    en: {
      legalName: 'Legal name',
      businessType: 'Business type',
      registrationDate: 'Registration date',
      country: 'Country of registration',
      registeredAddress: 'Registered address',
      email: 'Email',
      phone: 'Phone',
      registrationNumber: 'Registration number',
      vatNumber: 'VAT number',
      taxId: 'Tax ID',
      soleProprietor: 'Sole proprietor / IP'
    },
    ru: {
      legalName: 'Юридическое наименование',
      businessType: 'Форма деятельности',
      registrationDate: 'Дата регистрации',
      country: 'Страна регистрации',
      registeredAddress: 'Юридический адрес',
      email: 'Email',
      phone: 'Телефон',
      registrationNumber: 'Регистрационный номер',
      vatNumber: 'VAT номер',
      taxId: 'TAX ID',
      soleProprietor: 'ИП / форма предпринимателя'
    },
    hy: {
      legalName: 'Իրավաբանական անվանում',
      businessType: 'Գործունեության ձև',
      registrationDate: 'Գրանցման ամսաթիվ',
      country: 'Գրանցման երկիր',
      registeredAddress: 'Գրանցված հասցե',
      email: 'Էլ. փոստ',
      phone: 'Հեռախոս',
      registrationNumber: 'Գրանցման համար',
      vatNumber: 'VAT համար',
      taxId: 'TAX ID',
      soleProprietor: 'ԱՁ / ձեռնարկատիրոջ ձև'
    }
  }[locale];

  return compactFacts([
    { label: labels.legalName, value: company.legalName },
    { label: labels.businessType, value: company.businessType },
    { label: labels.registrationDate, value: company.registrationDate },
    { label: labels.country, value: company.country },
    { label: labels.registeredAddress, value: company.registeredAddress },
    { label: labels.email, value: company.email },
    { label: labels.phone, value: company.phone },
    { label: labels.registrationNumber, value: company.registrationNumber },
    { label: labels.vatNumber, value: company.vatNumber },
    { label: labels.taxId, value: company.taxId },
    { label: labels.soleProprietor, value: company.soleProprietor }
  ]);
}

function buildCompanySections(locale: KefineLocale, companyFacts: LegalFact[], legalDisclaimer?: string): LegalSection[] {
  const content = COMPANY_CONTENT[locale];
  const sections = content.sections.map((section, index) =>
    index === 0
      ? {
          ...section,
          facts: companyFacts
        }
      : section
  );

  return [
    ...sections,
    {
      title: locale === 'en' ? '7. Legal Disclaimer' : locale === 'ru' ? '7. Правовое уведомление' : '7. Իրավական ծանուցում',
      paragraphs: legalDisclaimer ? [legalDisclaimer] : [content.legalDisclaimerFallback]
    }
  ];
}

function buildCompanyContent(locale: KefineLocale, company: KefineCompanyPublicConfig, updatedAt: string): LegalPageContent {
  const content = COMPANY_CONTENT[locale];

  return {
    id: 'company',
    path: '/legal-information',
    title: content.title,
    updatedAt,
    intro: content.intro,
    sections: buildCompanySections(locale, formatCompanyFacts(locale, company), company.legalDisclaimer)
  };
}

export function getLegalPageContent(
  locale: KefineLocale,
  pageId: LegalPageId,
  company: KefineCompanyPublicConfig,
  updatedAt: string
): LegalPageContent {
  if (pageId === 'company') {
    return buildCompanyContent(locale, company, updatedAt);
  }

  const content = (pageId === 'privacy' ? PRIVACY_CONTENT : TERMS_CONTENT)[locale];
  return {
    ...content,
    updatedAt
  };
}
