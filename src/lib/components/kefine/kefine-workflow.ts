import { type KefineLocaleText } from '$lib/constants/kefine-locale';

export type FlowStep = 'create' | 'auth' | 'submitting' | 'executing' | 'payment' | 'error';
export type AuthMethod = 'wallet' | 'passkey' | 'anonymous' | null;
export type PaymentMethod = 'wallet' | 'linked-wallet' | 'promo' | 'reown' | 'other' | 'deposit' | null;
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
  stage: ExecutionStage;
  eyebrow: string;
  headline: string;
  supportingText: string;
  stageItems: StageItem[];
  subtasks: OrderSubtask[];
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

  return {
    stage,
    eyebrow: localeText.labels.taskStatus,
    headline: stageConfig.title,
    supportingText: stageConfig.detail,
    stageItems: buildStageItems(stage, localeText),
    subtasks: buildOrderSubtasks(order, localeText),
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
        paymentUrl: toStringValue(order['paymentUrl']) || undefined
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

export function readCreateResponse(body: unknown): { orderId: string; solver?: string; status?: string } | null {
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
    status: toStringValue(body['status']) || 'queued'
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
  if (!isRecord(payload)) return null;

  const orderId = toStringValue(payload['orderId']);
  if (!orderId) return null;

  const title = toStringValue(payload['title']) || fallback.title;
  const createdAt = toStringValue(payload['createdAt']) || fallback.createdAt;

  return {
    id: orderId,
    solver: toStringValue(payload['solver']) || localeText.defaults.solverNetwork,
    status: toStringValue(payload['status']) || 'queued',
    title,
    description: toStringValue(payload['description']) || fallback.description,
    createdAt,
    estimatedCost: toNumber(payload['estimatedCost']) || undefined,
    currency: toStringValue(payload['currency']) || fallback.currency,
    executionEstimate: resolveExecutionEstimate(
      toStringValue(payload['executionEstimate']) || undefined,
      title,
      localeText
    ),
    paymentUrl: toStringValue(payload['paymentUrl']) || undefined
  };
}
