import type { KefineLocale } from '$lib/constants/kefine-locale';
import { PRIVACY_CONTENT, TERMS_CONTENT } from '$lib/constants/legal-static-content';

export type LegalPageId = 'privacy' | 'terms';

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
  path: '/privacy' | '/terms';
  title: string;
  updatedAt: string;
  intro: string[];
  sections: LegalSection[];
};

export function getLegalPageContent(
  locale: KefineLocale,
  pageId: LegalPageId,
  updatedAt: string
): LegalPageContent {
  const content = (pageId === 'privacy' ? PRIVACY_CONTENT : TERMS_CONTENT)[locale];
  return {
    ...content,
    updatedAt
  };
}
