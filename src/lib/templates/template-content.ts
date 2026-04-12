import type { KefineLocale } from '$lib/constants/kefine-locale';
import type {
  ProfileTemplate,
  ProfileTemplateLocalizedContent,
  ProfileTemplateVariable
} from '$lib/types/user';

export const TEMPLATE_LOCALES: KefineLocale[] = ['en', 'ru', 'hy'];

function buildLegacyPrompt(template: Pick<ProfileTemplate, 'prefillTitle' | 'prefillDescription'>): string {
  const title = template.prefillTitle.trim();
  const description = template.prefillDescription.trim();
  if (description && title && description !== title) {
    return `${title}\n\n${description}`;
  }

  return description || title;
}

export function resolveTemplateLocalizedContent(
  template: Pick<
    ProfileTemplate,
    'title' | 'description' | 'prefillTitle' | 'prefillDescription' | 'promptTemplate' | 'baseLocale' | 'translations'
  >,
  locale: KefineLocale
): ProfileTemplateLocalizedContent {
  const fallbackPrompt = (template.promptTemplate || buildLegacyPrompt(template)).trim();
  const baseLocale = template.baseLocale ?? 'en';
  const localized = template.translations?.[locale];
  const base = template.translations?.[baseLocale];

  return {
    title: localized?.title || base?.title || template.title,
    description: localized?.description || base?.description || template.description,
    promptTemplate: localized?.promptTemplate || base?.promptTemplate || fallbackPrompt
  };
}

export function buildAutoTemplateTranslations(
  _baseLocale: KefineLocale,
  content: ProfileTemplateLocalizedContent
): Partial<Record<KefineLocale, ProfileTemplateLocalizedContent>> {
  return Object.fromEntries(
    TEMPLATE_LOCALES.map((locale) => [
      locale,
      {
        title: content.title.trim(),
        description: content.description.trim(),
        promptTemplate: content.promptTemplate.trim()
      }
    ])
  ) as Partial<Record<KefineLocale, ProfileTemplateLocalizedContent>>;
}

export function extractPromptVariableKeys(promptTemplate: string): string[] {
  const matches = promptTemplate.matchAll(/:([a-zA-Z][a-zA-Z0-9_]*)/g);
  const keys: string[] = [];
  for (const match of matches) {
    const key = match[1]?.trim();
    if (key && !keys.includes(key)) {
      keys.push(key);
    }
  }

  return keys;
}

export function syncPromptVariables(
  promptTemplate: string,
  existing: ProfileTemplateVariable[] = []
): ProfileTemplateVariable[] {
  const defaultsByKey = new Map(existing.map((item) => [item.key, item.defaultValue ?? '']));
  return extractPromptVariableKeys(promptTemplate).map((key) => ({
    key,
    defaultValue: defaultsByKey.get(key) || ''
  }));
}

export function renderPromptTemplate(promptTemplate: string, values: Record<string, string | undefined>): string {
  return promptTemplate.replace(/:([a-zA-Z][a-zA-Z0-9_]*)/g, (token, key: string) => {
    const value = values[key];
    return typeof value === 'string' && value.length > 0 ? value : token;
  });
}
