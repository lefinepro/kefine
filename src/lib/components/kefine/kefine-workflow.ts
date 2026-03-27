import { type KefineLocaleText } from '$lib/constants/kefine-locale';
import vpnFlowMock from '../../../../.meta/data/mocks/vpn-flow.mock.json';

export type FlowStep = 'create' | 'auth' | 'submitting' | 'executing' | 'payment' | 'error';
export type AuthMethod = 'wallet' | 'passkey' | 'anonymous' | null;
export type PaymentMethod = 'wallet' | 'linked-wallet' | 'promo' | 'reown' | 'other' | 'deposit' | null;
export type UiScenario = 'default' | 'vpn-service';
export type ExecutionStage =
  | 'batching'
  | 'competition'
  | 'winner-selected'
  | 'bridging'
  | 'awaiting-auth'
  | 'awaiting-payment';
export type PaymentStage = 'payment-method-select' | 'deposit-pending' | 'paid' | 'result-ready';
export type ProgressState = 'completed' | 'active' | 'upcoming';

export type DraftOrder = {
  title: string;
  description: string;
  estimatedCost: string;
  currency: string;
  executionEstimate: string;
};

export type OrderView = {
  id: string;
  solver: string;
  status: string;
  title: string;
  description: string;
  createdAt: string;
  estimatedCost?: number;
  currency: string;
  executionEstimate?: string;
  paymentUrl?: string;
  uiScenario?: Exclude<UiScenario, 'default'>;
  labels?: string[];
  vpnGuide?: VpnDeliveryGuide;
};

export type PaymentQuote = {
  orderId: string;
  title: string;
  status: string;
  currency: string;
  originalAmount: number;
  effectiveAmount: number;
  promoCode?: string;
  promoApplied: boolean;
  promoMessage?: string;
  strikeOriginalPrice: boolean;
  freeUnlock: boolean;
  paymentAddress: string;
  paymentRequest?: string;
  paymentChainId: number;
  paymentTokenAddress: string;
  paymentTokenSymbol: string;
  paymentUrl?: string;
  labels: string[];
};

export type VpnDeliveryGuideStep = {
  id: string;
  title: string;
  summary: string;
  apps?: Array<{
    label: string;
    href: string;
  }>;
  exampleVlessLink?: string;
  linuxClient?: string[];
  otherClientsNote?: string;
};

export type VpnDeliveryGuide = {
  title: string;
  summary: string;
  steps: VpnDeliveryGuideStep[];
};

export type OrderSubtask = {
  id: string;
  title: string;
  detail: string;
  state: ProgressState;
};

export type StageItem = {
  id: string;
  title: string;
  detail: string;
  state: ProgressState;
};

export type VpnExecutionStep = {
  solver: {
    name: string;
    handle: string;
    profileUrl: string;
  };
  instructions?: Array<{
    title: string;
    detail: string;
  }>;
  id: 'vpn-discovery' | 'vpn-pricing' | 'vpn-deploying' | 'vpn-ready';
  badge: string;
  title: string;
  detail: string;
  revealSolver: boolean;
  revealExecutionEstimate: boolean;
  revealPrice: boolean;
  revealWidget: boolean;
};

export type VpnFlowPresentation = {
  stepDelaysMs: number[];
  labels: {
    scenario: string;
    current: string;
    next: string;
    step: string;
    of: string;
    timer: string;
    profile: string;
    copy: string;
    executionEstimate: string;
    price: string;
    widget: string;
  };
  steps: VpnExecutionStep[];
  widget: {
    title: string;
    summary: string;
    badge: string;
  };
};

export type ResultSurface =
  | {
      type: 'widget';
      title: string;
      summary: string;
      ctaLabel: string;
    }
  | {
      type: 'iframe';
      title: string;
      summary: string;
      srcdoc: string;
    }
  | {
      type: 'external-link';
      title: string;
      summary: string;
      href: string;
      ctaLabel: string;
    };

export type ExecutionPresentation = {
  scenario: UiScenario;
  stage: ExecutionStage;
  eyebrow: string;
  headline: string;
  supportingText: string;
  stageItems: StageItem[];
  subtasks: OrderSubtask[];
  vpnFlow: VpnFlowPresentation | null;
  primaryMetric: {
    label: string;
    value: string;
    unit: string;
  };
  secondaryMetric: {
    label: string;
    value: string;
    unit: string;
  };
};

export const POLL_LIMIT = 30;
export const POLL_INTERVAL_MS = 1500;
export const ORDER_STORAGE_KEY = 'kefine-created-orders-v1';

const EXECUTION_STAGE_ORDER: ExecutionStage[] = [
  'batching',
  'competition',
  'winner-selected',
  'bridging',
  'awaiting-auth',
  'awaiting-payment'
];

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

export function toStringValue(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : undefined;
}

export function toUiScenario(value: unknown): Exclude<UiScenario, 'default'> | undefined {
  return value === 'vpn-service' ? value : undefined;
}

function toRecord(value: unknown): Record<string, unknown> | null {
  return isRecord(value) ? value : null;
}

export function toNumber(value: unknown): number | undefined {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === 'string' && value.trim()) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : undefined;
  }

  return undefined;
}

function splitEstimate(value: string | undefined, localeText: KefineLocaleText) {
  const raw = toStringValue(value);
  if (!raw) {
    return {
      value: '1',
      unit: localeText.labels.hoursUnit
    };
  }

  const digitMatch = raw.match(/(\d+(?:[.,]\d+)?)/);
  const valuePart = digitMatch?.[1]?.replace(',', '.') ?? '1';
  const normalized = raw.toLowerCase();

  if (normalized.includes('min') || normalized.includes('мин')) {
    return {
      value: valuePart,
      unit: localeText.labels.minutesUnit
    };
  }

  return {
    value: valuePart,
    unit: localeText.labels.hoursUnit
  };
}

function formatAmountValue(amount: number | undefined) {
  if (amount === undefined) {
    return '0';
  }

  return Number.isInteger(amount) ? String(amount) : amount.toFixed(2).replace(/\.?0+$/, '');
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

export function resolveExecutionEstimate(
  executionEstimate: string | undefined,
  title: string,
  localeText: KefineLocaleText
): string | undefined {
  const normalizedEstimate = toStringValue(executionEstimate);
  if (normalizedEstimate) {
    return normalizedEstimate;
  }

  return inferExecutionEstimate(title, localeText);
}

export function deriveExecutionStage(
  order: OrderView | null,
  authMethod: AuthMethod,
  paymentReady: boolean
): ExecutionStage {
  if (!order) {
    return 'batching';
  }

  if (paymentReady) {
    return 'awaiting-payment';
  }

  if (order.status === 'completed') {
    return authMethod ? 'awaiting-payment' : 'awaiting-auth';
  }

  if (order.status === 'accepted' || order.status === 'executing') {
    return 'bridging';
  }

  if (order.status === 'stopped') {
    return 'competition';
  }

  return 'competition';
}

export function buildStageItems(stage: ExecutionStage, localeText: KefineLocaleText): StageItem[] {
  const currentIndex = EXECUTION_STAGE_ORDER.indexOf(stage);

  return [
    {
      id: 'batching',
      title: localeText.executionFlow.batching.title,
      detail: localeText.executionFlow.batching.detail,
      state: currentIndex > 0 ? 'completed' : currentIndex === 0 ? 'active' : 'upcoming'
    },
    {
      id: 'competition',
      title: localeText.executionFlow.competition.title,
      detail: localeText.executionFlow.competition.detail,
      state: currentIndex > 1 ? 'completed' : currentIndex === 1 ? 'active' : 'upcoming'
    },
    {
      id: 'winner-selected',
      title: localeText.executionFlow.winnerSelected.title,
      detail: localeText.executionFlow.winnerSelected.detail,
      state: currentIndex > 2 ? 'completed' : currentIndex === 2 ? 'active' : 'upcoming'
    },
    {
      id: 'bridging',
      title: localeText.executionFlow.bridging.title,
      detail: localeText.executionFlow.bridging.detail,
      state: currentIndex > 3 ? 'completed' : currentIndex === 3 ? 'active' : 'upcoming'
    }
  ];
}

export function buildOrderSubtasks(order: OrderView | null, localeText: KefineLocaleText): OrderSubtask[] {
  const normalizedTitle = order?.title.trim().toLowerCase() ?? '';
  if (!normalizedTitle) {
    return [];
  }

  const templates =
    normalizedTitle.includes('deploy') || normalizedTitle.includes('production')
      ? [
          localeText.subtasks.prepareConfig,
          localeText.subtasks.runChecks,
          localeText.subtasks.publishResult
        ]
      : normalizedTitle.includes('optimize') || normalizedTitle.includes('algorithm')
        ? [
            localeText.subtasks.profileCode,
            localeText.subtasks.benchmarkPaths,
            localeText.subtasks.publishResult
          ]
        : normalizedTitle.includes('telegram') || normalizedTitle.includes('access')
          ? []
          : [
              localeText.subtasks.prepareConfig,
              localeText.subtasks.syncArtifacts,
              localeText.subtasks.publishResult
            ];

  return templates.map((item, index) => ({
    id: item.id,
    title: item.title,
    detail: item.detail,
    state: index === 0 ? 'completed' : index === 1 ? 'active' : 'upcoming'
  }));
}

export function deriveExecutionPresentation(
  order: OrderView | null,
  localeText: KefineLocaleText,
  authMethod: AuthMethod,
  paymentReady: boolean
): ExecutionPresentation {
  const stage = deriveExecutionStage(order, authMethod, paymentReady);
  const stageConfig = localeText.executionFlow[stage === 'winner-selected' ? 'winnerSelected' : stage];
  const estimate = splitEstimate(order?.executionEstimate, localeText);
  const isVpnScenario = order?.uiScenario === 'vpn-service';

  const vpnFlow = isVpnScenario
    ? {
        stepDelaysMs: vpnFlowMock.stepDelaysMs,
        labels: vpnFlowMock.labels,
        steps: vpnFlowMock.steps as VpnExecutionStep[],
        widget: vpnFlowMock.widget
      }
    : null;

  return {
    scenario: isVpnScenario ? 'vpn-service' : 'default',
    stage,
    eyebrow: localeText.labels.taskStatus,
    headline: stageConfig.title,
    supportingText: stageConfig.detail,
    stageItems: buildStageItems(stage, localeText),
    subtasks: buildOrderSubtasks(order, localeText),
    vpnFlow,
    primaryMetric: {
      label: localeText.labels.price,
      value: formatAmountValue(order?.estimatedCost),
      unit: order?.currency ?? localeText.defaults.defaultCurrency
    },
    secondaryMetric: {
      label: localeText.labels.timeLeft,
      value: estimate.value,
      unit: estimate.unit
    }
  };
}

export function deriveResultSurface(
  order: OrderView | null,
  localeText: KefineLocaleText,
  fallbackHref: string
): ResultSurface {
  if (order?.uiScenario === 'vpn-service') {
    return {
      type: 'widget',
      title: localeText.result.widgetTitle,
      summary: localeText.result.widgetSummary,
      ctaLabel: localeText.buttons.openResult
    };
  }

  const normalizedTitle = order?.title.trim().toLowerCase() ?? '';

  if (normalizedTitle.includes('deploy') || normalizedTitle.includes('production')) {
    return {
      type: 'iframe',
      title: localeText.result.iframeTitle,
      summary: localeText.result.iframeSummary,
      srcdoc: `<html><body style="margin:0;font-family:Manrope,system-ui;background:#f7ecd6;color:#2e2317;display:grid;place-items:center;height:100vh;"><div style="padding:24px;border:1px solid #b8a07a;border-radius:16px;background:#eadcbc;text-align:center;"><h1 style="margin:0 0 8px;font-size:24px;">${localeText.result.iframeTitle}</h1><p style="margin:0;">${order?.title ?? localeText.defaults.taskTitle}</p></div></body></html>`
    };
  }

  if (normalizedTitle.includes('telegram') || normalizedTitle.includes('access')) {
    return {
      type: 'external-link',
      title: localeText.result.externalTitle,
      summary: localeText.result.externalSummary,
      href: fallbackHref,
      ctaLabel: localeText.buttons.viewExternalResult
    };
  }

  return {
    type: 'widget',
    title: localeText.result.widgetTitle,
    summary: localeText.result.widgetSummary,
    ctaLabel: localeText.buttons.openResult
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
        vpnGuide: extractVpnGuide(order)
      };
    })
    .filter((order) => order.id.length > 0 && !order.id.startsWith('temp-'));
}

export function buildCreatePayload(payload: DraftOrder) {
  return {
    name: payload.title,
    title: payload.title,
    content: payload.description,
    description: payload.description,
    estimatedCost: toNumber(payload.estimatedCost) || 0,
    currency: payload.currency,
    executionEstimate: payload.executionEstimate || undefined
  };
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
  return Array.isArray(value) ? value.map((item) => toRecord(item)).filter((item): item is Record<string, unknown> => item !== null) : [];
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

  return (
    toStringValue(record['name']) ||
    toStringValue(record['preferredUsername']) ||
    toStringValue(record['id']) ||
    undefined
  );
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
  const attachments = toRecordList(payload['attachment']);

  for (const candidate of attachments) {
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
  if (!Array.isArray(value)) return undefined;

  const items = value
    .map((item) => (typeof item === 'string' && item.trim() ? item.trim() : null))
    .filter((item): item is string => item !== null);

  return items.length > 0 ? items : undefined;
}

function toLinkArray(value: unknown): Array<{ label: string; href: string }> | undefined {
  if (!Array.isArray(value)) return undefined;

  const items = value
    .map((item) => toRecord(item))
    .filter((item): item is Record<string, unknown> => item !== null)
    .map((item) => {
      const label = toStringValue(item['label']);
      const href = toStringValue(item['href']);
      if (!label || !href) {
        return null;
      }

      return { label, href };
    })
    .filter((item): item is { label: string; href: string } => item !== null);

  return items.length > 0 ? items : undefined;
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
  const linkedCurrency =
    toStringValue(paymentLink?.['currency']) ||
    undefined;
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
    paymentUrl:
      extractHref(paymentLink ?? {}) ||
      toStringValue(source['paymentUrl']) ||
      undefined,
    uiScenario: toUiScenario(source['uiScenario']) || toUiScenario(ticket['uiScenario']),
    labels: toStringList(source['labels']) || toStringList(ticket['labels']),
    vpnGuide
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
    paymentUrl: toStringValue(body['paymentUrl']) || undefined,
    labels: toStringList(body['labels']) || []
  };
}
