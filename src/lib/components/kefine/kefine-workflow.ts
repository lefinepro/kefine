import { type KefineLocaleText } from '$lib/constants/kefine-locale';
import type { ProfileTemplateFile, ProfileTemplatePricingMode, ProfileTemplateVariable } from '$lib/types/user';
export {
  buildCreatePayload,
  extractStatusPayload,
  parseStoredOrders,
  readCreateResponse,
  readPaymentQuote
} from '$lib/components/kefine/kefine-workflow-parsers';

export type FlowStep = 'create' | 'auth' | 'submitting' | 'executing' | 'payment' | 'error';
export type AuthMethod = 'wallet' | 'passkey' | 'publickey' | 'anonymous' | null;
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
export type TaskAccessMode = 'view' | 'watch' | 'join';

export type TaskAccessRule = {
  enabled: boolean;
  priceUsd: number;
};

export type VpnResultLink = {
  type: string;
  name: string;
  href: string;
};

export type VpnResultStep = {
  position?: number;
  name: string;
  content: string;
};

export type VpnResultArticle = {
  id?: string;
  type: 'Article';
  name: string;
  summary?: string;
  content?: string;
  mediaType?: string;
  attributedTo?: string;
  url?: string;
  generator?: {
    type?: string;
    name?: string;
  };
  tag?: string[];
  attachments?: Array<VpnResultLink | VpnResultStep>;
  steps?: VpnResultStep[];
  raw: Record<string, unknown>;
};

export type DraftOrder = {
  title: string;
  description: string;
  tags: string[];
  estimatedCost: string;
  currency: string;
  executionEstimate: string;
  files: File[];
  templateFiles?: ProfileTemplateFile[];
  templatePromptTemplate?: string;
  templateVariables?: ProfileTemplateVariable[];
  templateVariableValues?: Record<string, string>;
};

export type OrderView = {
  id: string;
  solver: string;
  solverName?: string;
  solverHandle?: string;
  solverProfileUrl?: string;
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
  resultDocument?: VpnResultArticle;
  activitypub?: Record<string, unknown>;
  ownerProfileId?: string;
  ownerUsername?: string;
  ownerDisplayName?: string;
  shareId?: string;
  isClosedCompleted?: boolean;
  isPublicTask?: boolean;
  accessRules?: Partial<Record<TaskAccessMode, TaskAccessRule>>;
  templateId?: string;
  templateSlug?: string;
  templateAuthorProfileId?: string;
  templateAuthorUsername?: string;
  templatePricingMode?: ProfileTemplatePricingMode;
  templatePricingValue?: number;
  templateFeeUsd?: number;
  templateNetUsd?: number;
};

export type TemplatePresentation = {
  id: string;
  slug: string;
  title: string;
  description: string;
  authorProfileId?: string;
  authorHandle: string;
  authorDisplayName: string;
  pricingMode: ProfileTemplatePricingMode;
  pricingValue: number;
  prefillFiles: ProfileTemplateFile[];
  promptTemplate: string;
  promptVariables: ProfileTemplateVariable[];
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
  paymentTokenDecimals: number;
  paymentUrl?: string;
  labels: string[];
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
      type: 'json';
      title: string;
      summary: string;
      content: string;
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

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function extractAttachmentResult(order: OrderView | null): { title: string; summary: string; content: string } | null {
  const attachments = Array.isArray(order?.activitypub?.attachment) ? order?.activitypub?.attachment : [];

  for (const item of attachments) {
    if (!isRecord(item)) {
      continue;
    }

    const mediaType = typeof item.mediaType === 'string' ? item.mediaType : '';
    const type = typeof item.type === 'string' ? item.type : '';
    const rel = Array.isArray(item.rel) ? item.rel : typeof item.rel === 'string' ? [item.rel] : [];

    const isPaymentLink =
      type === 'PaymentLink' ||
      rel.some((value) => typeof value === 'string' && /payment|price/i.test(value)) ||
      mediaType === 'application/payment-link+json';

    if (isPaymentLink) {
      continue;
    }

    const content = item.content;
    if (typeof content === 'string' && content.trim()) {
      return {
        title: typeof item.name === 'string' && item.name.trim() ? item.name : 'Task result',
        summary: typeof item.summary === 'string' && item.summary.trim() ? item.summary : 'Server-provided result payload.',
        content
      };
    }

    if (isRecord(content)) {
      return {
        title: typeof item.name === 'string' && item.name.trim() ? item.name : 'Task result',
        summary: typeof item.summary === 'string' && item.summary.trim() ? item.summary : 'Server-provided result payload.',
        content: JSON.stringify(content, null, 2)
      };
    }
  }

  return null;
}

export function isVpnOrder(order: OrderView | null): boolean {
  if (!order) {
    return false;
  }

  if (order.uiScenario === 'vpn-service') {
    return true;
  }

  const labels = Array.isArray(order.labels) ? order.labels : [];
  if (labels.some((label) => /(?:^|\W)(vpn|vless|wireguard|outline)(?:$|\W)|telegram|телеграм/i.test(label))) {
    return true;
  }

  const source = `${order.title ?? ''} ${order.description ?? ''}`.toLowerCase();
  return /\bvpn\b/.test(source) || source.includes('telegram') || source.includes('телеграм');
}

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

function toStringValue(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : undefined;
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

export function resolveExecutionEstimate(
  executionEstimate: string | undefined,
  title: string,
  localeText: KefineLocaleText
): string | undefined {
  const normalizedEstimate =
    typeof executionEstimate === 'string' && executionEstimate.trim().length > 0
      ? executionEstimate.trim()
      : undefined;
  if (normalizedEstimate) {
    return normalizedEstimate;
  }

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
  const isVpnScenario = isVpnOrder(order);

  return {
    scenario: isVpnScenario ? 'vpn-service' : 'default',
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
  const attachmentResult = extractAttachmentResult(order);

  if (isVpnOrder(order)) {
    const resultDocument = order?.resultDocument;
    if (resultDocument) {
      return {
        type: 'json',
        title: resultDocument.name,
        summary: resultDocument.summary || 'Server-generated ActivityStreams article.',
        content: JSON.stringify(resultDocument.raw, null, 2)
      };
    }

    if (attachmentResult) {
      return {
        type: 'json',
        title: attachmentResult.title,
        summary: attachmentResult.summary,
        content: attachmentResult.content
      };
    }

    return {
      type: 'json',
      title: 'VPN mock result',
      summary: 'VPN guide is unavailable, showing fallback package payload.',
      content: JSON.stringify(
        {
          task: order?.title ?? localeText.defaults.taskTitle,
          protocol: 'vless',
          package: 'vless-us1.jsonc'
        },
        null,
        2
      )
    };
  }

  const normalizedTitle = order?.title.trim().toLowerCase() ?? '';

  if (attachmentResult) {
    return {
      type: 'json',
      title: attachmentResult.title,
      summary: attachmentResult.summary,
      content: attachmentResult.content
    };
  }

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
