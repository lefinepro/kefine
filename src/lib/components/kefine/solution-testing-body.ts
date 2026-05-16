export type SolutionBodyField = {
  id: string;
  key: string;
  value: string;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function fieldValueToText(value: unknown): string {
  if (typeof value === 'string') return value;
  if (value === null || typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }
  return JSON.stringify(value, null, 2);
}

function fallbackField(source = ''): SolutionBodyField {
  return {
    id: 'body-field-body',
    key: 'body',
    value: source.trim()
  };
}

export function parseBodyFields(source: string): SolutionBodyField[] | null {
  try {
    const parsed = JSON.parse(source);
    if (!isRecord(parsed)) return null;

    const fields = Object.entries(parsed).map(([key, value], index) => ({
      id: `body-field-${index}-${key.replace(/[^a-z0-9_-]+/gi, '-').toLowerCase() || 'field'}`,
      key,
      value: fieldValueToText(value)
    }));

    return fields.length > 0 ? fields : [fallbackField()];
  } catch {
    return null;
  }
}

export function parseResponseFields(source: string | null): SolutionBodyField[] | null {
  if (source === null) return null;
  try {
    const parsed = JSON.parse(source);
    if (!isRecord(parsed)) return null;

    const fields = Object.entries(parsed).map(([key, value], index) => ({
      id: `response-field-${index}-${key.replace(/[^a-z0-9_-]+/gi, '-').toLowerCase() || 'field'}`,
      key,
      value: fieldValueToText(value)
    }));

    return fields.length > 0 ? fields : null;
  } catch {
    return null;
  }
}

export function createBodyFields(source: string): SolutionBodyField[] {
  return parseBodyFields(source) ?? [fallbackField(source)];
}

export function bodyFromFields(fields: SolutionBodyField[]): string {
  const body: Record<string, string> = {};

  for (const [index, field] of fields.entries()) {
    const key = field.key.trim() || `field${index + 1}`;
    body[key] = field.value;
  }

  return JSON.stringify(body, null, 2);
}
