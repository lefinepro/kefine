import type { KefineLocaleText } from '$lib/constants/kefine-locale';
import type {
  DraftOrder,
  OrderView,
  PaymentQuote,
  TaskAccessMode,
  UiScenario,
  VpnDeliveryGuide
} from '$lib/components/kefine/kefine-workflow';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function toRecord(value: unknown): Record<string, unknown> | null {
  return isRecord(value) ? value : null;
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

function findVpnGuideAttachment(payload: Record<string, unknown>): Record<string, unknown> | null {
  for (const candidate of toRecordList(payload['attachment'])) {
    const mediaType = toStringValue(candidate['mediaType']);
    const type = toStringValue(candidate['type']);

    if (
      mediaType === 'application/vnd.kefine.vpn-guide+json' ||
      (type === 'Document' && toStringValue(candidate['name'])?.toLowerCase().includes('vpn'))
    ) {
      return candidate;
    }
  }

  return null;
}

function toStringArray(value: unknown): string[] | undefined {
  return toStringList(value);
}

function toLinkArray(value: unknown): Array<{ label: string; href: string }> | undefined {
  if (!Array.isArray(value)) return undefined;

  const items = value
    .map((item) => toRecord(item))
    .filter((item): item is Record<string, unknown> => item !== null)
    .map((item) => {
      const label = toStringValue(item['label']);
      const href = toStringValue(item['href']);
      return label && href ? { label, href } : null;
    })
    .filter((item): item is { label: string; href: string } => item !== null);

  return items.length > 0 ? items : undefined;
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

function extractVpnGuide(payload: Record<string, unknown>): VpnDeliveryGuide | undefined {
  const attachment = findVpnGuideAttachment(payload);
  const content = toRecord(attachment?.['content']);
  if (!attachment || !content) {
    return undefined;
  }

  const rawSteps = Array.isArray(content['steps']) ? content['steps'] : [];
  const steps = rawSteps
    .map((item) => toRecord(item))
    .filter((item): item is Record<string, unknown> => item !== null)
    .map((step) => {
      const id = toStringValue(step['id']);
      const title = toStringValue(step['title']);
      const summary = toStringValue(step['summary']);
      if (!id || !title || !summary) {
        return null;
      }

      return {
        id,
        title,
        summary,
        apps: toLinkArray(step['apps']),
        exampleVlessLink: toStringValue(step['exampleVlessLink']),
        linuxClient: toStringArray(step['linuxClient']),
        otherClientsNote: toStringValue(step['otherClientsNote'])
      };
    })
    .filter((step): step is NonNullable<typeof step> => step !== null);

  if (steps.length === 0) {
    return undefined;
  }

  return {
    title: toStringValue(attachment['name']) || 'VPN delivery guide',
    summary: toStringValue(attachment['summary']) || 'VPN setup instructions',
    steps
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
        vpnGuide: extractVpnGuide(order),
        activitypub: toRecord(order['activitypub']) || undefined,
        ownerProfileId: toStringValue(order['ownerProfileId']),
        ownerUsername: toStringValue(order['ownerUsername']),
        ownerDisplayName: toStringValue(order['ownerDisplayName']),
        shareId: toStringValue(order['shareId']),
        isClosedCompleted: order['isClosedCompleted'] === true,
        isPublicTask: order['isPublicTask'] === true,
        accessRules: toAccessRules(order['accessRules'])
      };
    })
    .filter((order) => order.id.length > 0 && !order.id.startsWith('temp-') && !order.id.startsWith('local-'));
}

export function readCreateResponse(body: unknown): {
  orderId: string;
  solver?: string;
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
  const vpnGuide = extractVpnGuide(source) || extractVpnGuide(ticket);
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
    vpnGuide,
    activitypub: rootPayload || undefined,
    ownerProfileId: toStringValue(source['ownerProfileId']) || toStringValue(ticket['ownerProfileId']) || undefined,
    ownerUsername: toStringValue(source['ownerUsername']) || toStringValue(ticket['ownerUsername']) || undefined,
    ownerDisplayName: toStringValue(source['ownerDisplayName']) || toStringValue(ticket['ownerDisplayName']) || undefined,
    shareId: toStringValue(source['shareId']) || toStringValue(ticket['shareId']) || undefined,
    isClosedCompleted: source['isClosedCompleted'] === true || ticket['isClosedCompleted'] === true,
    isPublicTask: source['isPublicTask'] === true || ticket['isPublicTask'] === true,
    accessRules: toAccessRules(source['accessRules']) || toAccessRules(ticket['accessRules'])
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

export function buildCreatePayload(payload: DraftOrder) {
  const isVpnScenario = detectVpnScenario(payload);
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
    labels: isVpnScenario ? ['vpn'] : undefined,
    attachment: fileAttachments.length > 0 ? fileAttachments : undefined
  };
}
