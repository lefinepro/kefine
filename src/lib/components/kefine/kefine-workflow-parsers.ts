import type { KefineLocaleText } from '$lib/constants/kefine-locale';
import type {
  DraftOrder,
  OrderView,
  PaymentQuote,
  TaskAccessMode,
  TemplatePresentation,
  UiScenario,
  VpnResultArticle,
  VpnResultLink,
  VpnResultStep
} from '$lib/components/kefine/kefine-workflow';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function toRecord(value: unknown): Record<string, unknown> | null {
  return isRecord(value) ? value : null;
}

function isDefined<T>(value: T | null | undefined): value is T {
  return value != null;
}

function toStringValue(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : undefined;
}

function toNumber(value: unknown): number | undefined {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === 'string' && value.trim()) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : undefined;
  }

  return undefined;
}

function detectVpnScenario(payload: DraftOrder): boolean {
  const source = `${payload.title} ${payload.description}`.toLowerCase();
  return /\bvpn\b/.test(source) || source.includes('telegram') || source.includes('телеграм');
}

function toUiScenario(value: unknown): Exclude<UiScenario, 'default'> | undefined {
  return value === 'vpn-service' ? value : undefined;
}

function toTemplatePricingMode(value: unknown): 'fixed' | 'percent' | undefined {
  return value === 'percent' ? 'percent' : value === 'fixed' ? 'fixed' : undefined;
}

function extractActorHandleFromOrderReference(value: string | undefined): string | undefined {
  const normalized = toStringValue(value);
  if (!normalized) {
    return undefined;
  }

  const actorPathMatch = normalized.match(/\/(@[^/]+)\/orders?\/[^/?#]+$/i);
  if (actorPathMatch?.[1]) {
    return actorPathMatch[1].replace(/^@+/, '');
  }

  const actorApiMatch = normalized.match(/\/actor\/orders\/(@[^/?#]+|[^/?#]+)$/i);
  if (actorApiMatch?.[1]) {
    return actorApiMatch[1].replace(/^@+/, '');
  }

  return undefined;
}

function inferExecutionEstimate(title: string, localeText: KefineLocaleText): string | undefined {
  const normalizedTitle = title.trim().toLowerCase();
  if (!normalizedTitle) {
    return undefined;
  }

  const isRussianLocale = localeText.meta.locale === 'ru';

  if (
    normalizedTitle.includes('optimize an algorithm') ||
    normalizedTitle.includes('algorithm optimization') ||
    normalizedTitle.includes('оптимизация алгоритма')
  ) {
    return isRussianLocale ? 'около 2 часов' : 'about 2 hours';
  }

  if (
    normalizedTitle.includes('deploy') ||
    normalizedTitle.includes('production app') ||
    normalizedTitle.includes('деплой')
  ) {
    return isRussianLocale ? 'около 3 часов' : 'about 3 hours';
  }

  if (
    normalizedTitle.includes('telegram') ||
    normalizedTitle.includes('access') ||
    normalizedTitle.includes('доступ')
  ) {
    return isRussianLocale ? 'около 45 минут' : 'about 45 minutes';
  }

  return isRussianLocale ? 'около 1 часа' : 'about 1 hour';
}

function resolveExecutionEstimate(
  executionEstimate: string | undefined,
  title: string,
  localeText: KefineLocaleText
): string | undefined {
  const normalizedEstimate = toStringValue(executionEstimate);
  return normalizedEstimate || inferExecutionEstimate(title, localeText);
}

function unwrapActivityObject(payload: unknown): Record<string, unknown> | null {
  const record = toRecord(payload);
  if (!record) {
    return null;
  }

  const type = toStringValue(record['type']);
  if ((type === 'Create' || type === 'Update') && isRecord(record['object'])) {
    return toRecord(record['object']);
  }

  return record;
}

function unwrapTicketPayload(payload: Record<string, unknown>): Record<string, unknown> {
  if (toStringValue(payload['type']) === 'Offer' && isRecord(payload['object'])) {
    const nested = toRecord(payload['object']);
    if (nested && toStringValue(nested['type']) === 'Ticket') {
      return nested;
    }
  }

  return payload;
}

function toRecordList(value: unknown): Record<string, unknown>[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.map((item) => toRecord(item)).filter((item): item is Record<string, unknown> => item !== null);
}

function toStringList(value: unknown): string[] | undefined {
  if (!Array.isArray(value)) return undefined;

  const items = value
    .map((item) => (typeof item === 'string' && item.trim() ? item.trim() : null))
    .filter((item): item is string => item !== null);

  return items.length > 0 ? items : undefined;
}

function extractHref(payload: Record<string, unknown>): string | undefined {
  return toStringValue(payload['href']) || toStringValue(payload['url']);
}

function extractActorLabel(actor: unknown): string | undefined {
  if (typeof actor === 'string') {
    return actor;
  }

  const record = toRecord(actor);
  if (!record) {
    return undefined;
  }

  return toStringValue(record['name']) || toStringValue(record['preferredUsername']) || toStringValue(record['id']);
}

function findPaymentLink(payload: Record<string, unknown>): Record<string, unknown> | null {
  const attachments = toRecordList(payload['attachment']);
  const directPaymentLink = toRecord(payload['paymentLink']);
  const priceObject = toRecord(payload['price']);
  const candidates = [directPaymentLink, priceObject, ...attachments].filter(
    (item): item is Record<string, unknown> => item !== null
  );

  for (const candidate of candidates) {
    const type = toStringValue(candidate['type']);
    const rel = candidate['rel'];
    const relValues =
      typeof rel === 'string'
        ? [rel]
        : Array.isArray(rel)
          ? rel.filter((value): value is string => typeof value === 'string')
          : [];

    if (
      type === 'PaymentLink' ||
      relValues.some((value) => /payment|price/i.test(value)) ||
      toNumber(candidate['price']) !== undefined ||
      toNumber(candidate['amount']) !== undefined
    ) {
      return candidate;
    }
  }

  return null;
}

function findResultDocumentAttachment(payload: Record<string, unknown>): Record<string, unknown> | null {
  for (const candidate of toRecordList(payload['attachment'])) {
    const mediaType = toStringValue(candidate['mediaType']);
    const type = toStringValue(candidate['type']);
    const normalizedName = toStringValue(candidate['name'])?.toLowerCase();
    const content = toRecord(candidate['content']);

    if (
      type === 'Article' ||
      mediaType === 'application/ld+json' ||
      mediaType === 'application/vnd.kefine.vpn-guide+json' ||
      (type === 'Document' && normalizedName?.includes('vpn')) ||
      (type === 'Document' && toStringValue(content?.['@type']) === 'HowTo')
    ) {
      return candidate;
    }
  }

  return null;
}

function toVpnResultLinks(value: unknown): VpnResultLink[] | undefined {
  if (!Array.isArray(value)) {
    return undefined;
  }

  const links = value
    .map((item) => toRecord(item))
    .filter((item): item is Record<string, unknown> => item !== null)
    .map((item) => {
      const href = extractHref(item);
      const name = toStringValue(item['name']);
      const type = toStringValue(item['type']) || 'Link';
      if (type !== 'Link' || !href || !name) {
        return null;
      }

      return {
        type,
        name,
        href
      };
    })
    .filter(isDefined);

  return links.length > 0 ? links : undefined;
}

function toVpnResultSteps(value: unknown): VpnResultStep[] | undefined {
  if (!Array.isArray(value)) {
    return undefined;
  }

  const steps = value
    .map((item) => toRecord(item))
    .filter((item): item is Record<string, unknown> => item !== null)
    .map((item) => {
      const type = toStringValue(item['type']) || 'Article';
      const name =
        toStringValue(item['name']) ||
        toStringValue(item['title']) ||
        toStringValue(item['summary']);
      const content =
        toStringValue(item['content']) ||
        toStringValue(item['text']) ||
        toStringValue(item['detail']);

      if ((type !== 'Note' && type !== 'Article') || !name || !content) {
        return null;
      }

      return {
        position: toNumber(item['schema:position']) ?? toNumber(item['position']),
        name,
        content
      };
    })
    .filter(isDefined);

  return steps.length > 0 ? steps : undefined;
}

function parseArticleAttachments(value: unknown): {
  attachments?: Array<VpnResultLink | VpnResultStep>;
  links?: VpnResultLink[];
  steps?: VpnResultStep[];
} {
  const links = toVpnResultLinks(value);
  const steps = toVpnResultSteps(value);
  const attachments = [...(links || []), ...(steps || [])];

  return {
    attachments: attachments.length > 0 ? attachments : undefined,
    links,
    steps
  };
}

function normalizeLegacyHowToDocument(
  attachment: Record<string, unknown>,
  content: Record<string, unknown>
): VpnResultArticle | undefined {
  const name = toStringValue(content['name']) || toStringValue(attachment['name']) || 'VPN delivery package';
  const summary = toStringValue(attachment['summary']) || toStringValue(content['description']) || undefined;
  const rawSteps = Array.isArray(content['step']) ? content['step'] : [];
  const steps = rawSteps
    .map((item) => toRecord(item))
    .filter((item): item is Record<string, unknown> => item !== null)
    .map((item, index) => {
      const stepName =
        toStringValue(item['title']) ||
        toStringValue(item['name']) ||
        toStringValue(item['summary']);
      const lines = [
        toStringValue(item['summary']),
        ...(Array.isArray(item['linuxClient'])
          ? item['linuxClient'].filter((value): value is string => typeof value === 'string' && value.trim().length > 0)
          : []),
        toStringValue(item['otherClientsNote'])
      ].filter((value): value is string => typeof value === 'string' && value.trim().length > 0);

      if (!stepName || lines.length === 0) {
        return null;
      }

      return {
        position: index + 1,
        name: stepName,
        content: lines.join('\n')
      };
    })
    .filter(isDefined);

  const attachments: Array<VpnResultLink | VpnResultStep> = [];
  for (const rawStep of rawSteps) {
    const step = toRecord(rawStep);
    if (!step || !Array.isArray(step['apps'])) {
      continue;
    }

    for (const app of step['apps']) {
      const record = toRecord(app);
      const href = record ? extractHref(record) : undefined;
      const stepName = record ? toStringValue(record['label']) : undefined;
      if (href && stepName) {
        attachments.push({ type: 'Link', name: stepName, href });
      }
    }
  }

  for (const step of steps) {
    attachments.push(step);
  }

  return {
    id: toStringValue(attachment['id']) || undefined,
    type: 'Article',
    name,
    summary,
    content: toStringValue(content['description']) || undefined,
    mediaType: toStringValue(attachment['mediaType']) || undefined,
    tag: toStringList(content['keywords']) || ['vpn'],
    attachments: attachments.length > 0 ? attachments : undefined,
    steps: steps.length > 0 ? steps : undefined,
    raw: {
      ...content,
      ...(summary ? { _attachmentSummary: summary } : {}),
      ...(toStringValue(attachment['name']) ? { _attachmentName: toStringValue(attachment['name']) } : {})
    }
  };
}

function toAccessRules(
  value: unknown
): Partial<Record<TaskAccessMode, { enabled: boolean; priceUsd: number }>> | undefined {
  if (!isRecord(value)) {
    return undefined;
  }

  const rules = (['view', 'watch', 'join'] as const).reduce<Partial<Record<TaskAccessMode, { enabled: boolean; priceUsd: number }>>>(
    (result, key) => {
      const rawRule = toRecord(value[key]);
      if (!rawRule) {
        return result;
      }

      result[key] = {
        enabled: rawRule['enabled'] === true,
        priceUsd: toNumber(rawRule['priceUsd']) ?? 0
      };
      return result;
    },
    {}
  );

  return Object.keys(rules).length > 0 ? rules : undefined;
}

function extractResultDocument(payload: Record<string, unknown>): VpnResultArticle | undefined {
  const attachment = findResultDocumentAttachment(payload);
  if (!attachment) {
    return undefined;
  }

  if (toStringValue(attachment['type']) === 'Article') {
    const generator = toRecord(attachment['generator']);
    const parsedAttachments = parseArticleAttachments(attachment['attachment']);

    return {
      id: toStringValue(attachment['id']) || undefined,
      type: 'Article',
      name: toStringValue(attachment['name']) || 'VPN delivery package',
      summary: toStringValue(attachment['summary']) || undefined,
      content: toStringValue(attachment['content']) || undefined,
      mediaType: toStringValue(attachment['mediaType']) || undefined,
      attributedTo: extractActorLabel(attachment['attributedTo']),
      url: toStringValue(attachment['url']) || undefined,
      generator: generator
        ? {
            type: toStringValue(generator['type']) || undefined,
            name: toStringValue(generator['name']) || undefined
          }
        : undefined,
      tag: toStringList(attachment['tag']),
      attachments: parsedAttachments.attachments,
      steps: parsedAttachments.steps,
      raw: attachment
    };
  }

  const content = toRecord(attachment['content']);
  if (!content) {
    return undefined;
  }

  if (toStringValue(content['@type']) === 'HowTo') {
    return normalizeLegacyHowToDocument(attachment, content);
  }

  return {
    id: toStringValue(attachment['id']) || undefined,
    type: 'Article',
    name: toStringValue(attachment['name']) || 'VPN delivery package',
    summary: toStringValue(attachment['summary']) || undefined,
    content: typeof attachment['content'] === 'string' ? toStringValue(attachment['content']) : undefined,
    mediaType: toStringValue(attachment['mediaType']) || undefined,
    raw: {
      ...content,
      ...(toStringValue(attachment['name']) ? { _attachmentName: toStringValue(attachment['name']) } : {}),
      ...(toStringValue(attachment['summary']) ? { _attachmentSummary: toStringValue(attachment['summary']) } : {})
    }
  };
}

export function parseStoredOrders(raw: string | null, localeText: KefineLocaleText): OrderView[] {
  if (!raw) return [];

  const parsed: unknown = JSON.parse(raw);
  if (!Array.isArray(parsed)) return [];

  return parsed
    .filter(isRecord)
    .map((order) => {
      const title = toStringValue(order['title']) || localeText.defaults.taskTitle;

      return {
        id: toStringValue(order['id']) || '',
        solver: toStringValue(order['solver']) || localeText.defaults.unknownSolver,
        status: toStringValue(order['status']) || 'queued',
        title,
        description: toStringValue(order['description']) || '',
        createdAt: toStringValue(order['createdAt']) || new Date().toISOString(),
        estimatedCost: toNumber(order['estimatedCost']) || undefined,
        currency: toStringValue(order['currency']) || localeText.defaults.defaultCurrency,
        executionEstimate: resolveExecutionEstimate(toStringValue(order['executionEstimate']) || undefined, title, localeText),
        paymentUrl: toStringValue(order['paymentUrl']) || undefined,
        uiScenario: toUiScenario(order['uiScenario']),
        labels: toStringList(order['labels']),
        resultDocument: extractResultDocument(order),
        activitypub: toRecord(order['activitypub']) || undefined,
        ownerProfileId: toStringValue(order['ownerProfileId']),
        ownerUsername: toStringValue(order['ownerUsername']),
        ownerDisplayName: toStringValue(order['ownerDisplayName']),
        actorHandle: toStringValue(order['actorHandle']),
        actorDid: toStringValue(order['actorDid']),
        shareId: toStringValue(order['shareId']),
        isClosedCompleted: order['isClosedCompleted'] === true,
        isPublicTask: order['isPublicTask'] === true,
        accessRules: toAccessRules(order['accessRules']),
        templateId: toStringValue(order['templateId']),
        templateSlug: toStringValue(order['templateSlug']),
        templateAuthorProfileId: toStringValue(order['templateAuthorProfileId']),
        templateAuthorUsername: toStringValue(order['templateAuthorUsername']),
        templatePricingMode: toTemplatePricingMode(order['templatePricingMode']),
        templatePricingValue: toNumber(order['templatePricingValue']),
        templateFeeUsd: toNumber(order['templateFeeUsd']),
        templateNetUsd: toNumber(order['templateNetUsd'])
      };
    })
    .filter((order) => order.id.length > 0 && !order.id.startsWith('temp-') && !order.id.startsWith('local-'));
}

export function readCreateResponse(body: unknown): {
  orderId: string;
  solver?: string;
  solverName?: string;
  solverHandle?: string;
  solverProfileUrl?: string;
  actorHandle?: string;
  actorDid?: string;
  status?: string;
  uiScenario?: Exclude<UiScenario, 'default'>;
} | null {
  if (!isRecord(body) || body['accepted'] !== true) {
    return null;
  }

  const orderId = toStringValue(body['orderId']);
  if (!orderId) {
    return null;
  }

  return {
    orderId,
    solver: toStringValue(body['solver']) || undefined,
    solverName: toStringValue(body['solverName']) || undefined,
    solverHandle: toStringValue(body['solverHandle']) || undefined,
    solverProfileUrl: toStringValue(body['solverProfileUrl']) || undefined,
    actorHandle: toStringValue(body['actorHandle']) || extractActorHandleFromOrderReference(orderId) || undefined,
    actorDid: toStringValue(body['actorDid']) || undefined,
    status: toStringValue(body['status']) || 'queued',
    uiScenario: toUiScenario(body['uiScenario'])
  };
}

export function extractStatusPayload(
  payload: unknown,
  fallback: {
    title: string;
    description: string;
    currency: string;
    createdAt: string;
  },
  localeText: KefineLocaleText
): OrderView | null {
  const rootPayload = toRecord(payload);
  const activityOrObject = unwrapActivityObject(payload);
  if (!activityOrObject) return null;

  const source = activityOrObject;
  const ticket = unwrapTicketPayload(source);
  const paymentLink = findPaymentLink(source) || findPaymentLink(ticket);
  const resultDocument = extractResultDocument(source) || extractResultDocument(ticket);
  const orderId =
    toStringValue(source['orderId']) ||
    toStringValue(source['id']) ||
    toStringValue(ticket['orderId']) ||
    toStringValue(ticket['id']);
  if (!orderId) return null;

  const title =
    toStringValue(source['title']) ||
    toStringValue(source['name']) ||
    toStringValue(ticket['title']) ||
    toStringValue(ticket['name']) ||
    fallback.title;
  const createdAt =
    toStringValue(source['createdAt']) ||
    toStringValue(source['published']) ||
    toStringValue(ticket['createdAt']) ||
    toStringValue(ticket['published']) ||
    fallback.createdAt;
  const linkedPrice = toNumber(paymentLink?.['price']) ?? toNumber(paymentLink?.['amount']);
  const linkedCurrency = toStringValue(paymentLink?.['currency']) || undefined;
  const linkedSolver =
    extractActorLabel(paymentLink?.['attributedTo']) ||
    extractActorLabel(source['attributedTo']) ||
    extractActorLabel(ticket['attributedTo']) ||
    undefined;

  return {
    id: orderId,
    solver: toStringValue(source['solver']) || linkedSolver || localeText.defaults.solverNetwork,
    solverName: toStringValue(source['solverName']) || undefined,
    solverHandle: toStringValue(source['solverHandle']) || undefined,
    solverProfileUrl: toStringValue(source['solverProfileUrl']) || undefined,
    status: toStringValue(source['status']) || toStringValue(ticket['status']) || 'queued',
    title,
    description:
      toStringValue(source['description']) ||
      toStringValue(source['content']) ||
      toStringValue(ticket['description']) ||
      toStringValue(ticket['content']) ||
      fallback.description,
    createdAt,
    estimatedCost:
      linkedPrice ??
      toNumber(source['estimatedCost']) ??
      toNumber(source['price']) ??
      toNumber(ticket['estimatedCost']) ??
      toNumber(ticket['price']) ??
      undefined,
    currency:
      linkedCurrency ||
      toStringValue(source['currency']) ||
      toStringValue(ticket['currency']) ||
      fallback.currency,
    executionEstimate: resolveExecutionEstimate(
      toStringValue(source['executionEstimate']) ||
        toStringValue(ticket['executionEstimate']) ||
        toStringValue(ticket['dueDate']) ||
        undefined,
      title,
      localeText
    ),
    paymentUrl: extractHref(paymentLink ?? {}) || toStringValue(source['paymentUrl']) || undefined,
    uiScenario: toUiScenario(source['uiScenario']) || toUiScenario(ticket['uiScenario']),
    labels: toStringList(source['labels']) || toStringList(ticket['labels']),
    resultDocument,
    activitypub: rootPayload || undefined,
    ownerProfileId: toStringValue(source['ownerProfileId']) || toStringValue(ticket['ownerProfileId']) || undefined,
    ownerUsername: toStringValue(source['ownerUsername']) || toStringValue(ticket['ownerUsername']) || undefined,
    ownerDisplayName: toStringValue(source['ownerDisplayName']) || toStringValue(ticket['ownerDisplayName']) || undefined,
    actorHandle: toStringValue(source['actorHandle']) || toStringValue(ticket['actorHandle']) || undefined,
    actorDid: toStringValue(source['actorDid']) || toStringValue(ticket['actorDid']) || undefined,
    shareId: toStringValue(source['shareId']) || toStringValue(ticket['shareId']) || undefined,
    isClosedCompleted: source['isClosedCompleted'] === true || ticket['isClosedCompleted'] === true,
    isPublicTask: source['isPublicTask'] === true || ticket['isPublicTask'] === true,
    accessRules: toAccessRules(source['accessRules']) || toAccessRules(ticket['accessRules']),
    templateId: toStringValue(source['templateId']) || toStringValue(ticket['templateId']) || undefined,
    templateSlug: toStringValue(source['templateSlug']) || toStringValue(ticket['templateSlug']) || undefined,
    templateAuthorProfileId:
      toStringValue(source['templateAuthorProfileId']) || toStringValue(ticket['templateAuthorProfileId']) || undefined,
    templateAuthorUsername:
      toStringValue(source['templateAuthorUsername']) || toStringValue(ticket['templateAuthorUsername']) || undefined,
    templatePricingMode: toTemplatePricingMode(source['templatePricingMode']) || toTemplatePricingMode(ticket['templatePricingMode']),
    templatePricingValue: toNumber(source['templatePricingValue']) ?? toNumber(ticket['templatePricingValue']) ?? undefined,
    templateFeeUsd: toNumber(source['templateFeeUsd']) ?? toNumber(ticket['templateFeeUsd']) ?? undefined,
    templateNetUsd: toNumber(source['templateNetUsd']) ?? toNumber(ticket['templateNetUsd']) ?? undefined
  };
}

export function readPaymentQuote(body: unknown): PaymentQuote | null {
  if (!isRecord(body)) return null;

  const orderId = toStringValue(body['orderId']);
  const title = toStringValue(body['title']);
  const status = toStringValue(body['status']);
  const currency = toStringValue(body['currency']);
  const originalAmount = toNumber(body['originalAmount']);
  const effectiveAmount = toNumber(body['effectiveAmount']);
  const paymentAddress = toStringValue(body['paymentAddress']);
  const paymentTokenAddress = toStringValue(body['paymentTokenAddress']);
  const paymentTokenSymbol = toStringValue(body['paymentTokenSymbol']);
  const paymentChainId = toNumber(body['paymentChainId']);
  const paymentTokenDecimals = toNumber(body['paymentTokenDecimals']) ?? 6;

  if (
    !orderId ||
    !title ||
    !status ||
    !currency ||
    originalAmount === undefined ||
    effectiveAmount === undefined ||
    !paymentAddress ||
    !paymentTokenAddress ||
    !paymentTokenSymbol ||
    paymentChainId === undefined
  ) {
    return null;
  }

  return {
    orderId,
    title,
    status,
    currency,
    originalAmount,
    effectiveAmount,
    promoCode: toStringValue(body['promoCode']) || undefined,
    promoApplied: body['promoApplied'] === true,
    promoMessage: toStringValue(body['promoMessage']) || undefined,
    strikeOriginalPrice: body['strikeOriginalPrice'] === true,
    freeUnlock: body['freeUnlock'] === true,
    paymentAddress,
    paymentRequest: toStringValue(body['paymentRequest']) || undefined,
    paymentChainId,
    paymentTokenAddress,
    paymentTokenSymbol,
    paymentTokenDecimals,
    paymentUrl: toStringValue(body['paymentUrl']) || undefined,
    labels: toStringList(body['labels']) || []
  };
}

export function buildCreatePayload(payload: DraftOrder, template?: TemplatePresentation | null) {
  const isVpnScenario = detectVpnScenario(payload);
  const tags = Array.from(new Set(payload.tags.map((tag) => tag.trim()).filter(Boolean)));
  const labels = Array.from(new Set([...(isVpnScenario ? ['vpn'] : []), ...tags]));
  const fileAttachments = payload.files.map((file) => ({
    type: 'Document',
    name: file.name,
    mediaType: file.type || 'application/octet-stream',
    size: file.size
  }));

  return {
    name: payload.title,
    title: payload.title,
    content: payload.description,
    description: payload.description,
    estimatedCost: toNumber(payload.estimatedCost) || 0,
    currency: payload.currency,
    executionEstimate: payload.executionEstimate || undefined,
    uiScenario: isVpnScenario ? 'vpn-service' : undefined,
    labels: labels.length > 0 ? labels : undefined,
    attachment: fileAttachments.length > 0 ? fileAttachments : undefined,
    templateId: template?.id,
    templateSlug: template?.slug,
    templateAuthorProfileId: template?.authorProfileId,
    templateAuthorUsername: template?.authorHandle,
    templateAuthorDisplayName: template?.authorDisplayName,
    templatePricingMode: template?.pricingMode,
    templatePricingValue: template?.pricingValue
  };
}
