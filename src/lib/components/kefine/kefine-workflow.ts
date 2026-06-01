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
  | 'queued'
  | 'matching'
  | 'assigned'
  | 'running'
  | 'review'
  | 'completed'
  | 'failed'
  | 'batching'
  | 'competition'
  | 'winner-selected'
  | 'bridging'
  | 'awaiting-auth'
  | 'awaiting-payment';
export type PaymentStage = 'payment-method-select' | 'deposit-pending' | 'paid' | 'result-ready';
export type ProgressState = 'completed' | 'active' | 'upcoming';
export type TaskAccessMode = 'view' | 'watch' | 'join';
export type GitAccessGroup = 'admin' | 'exchange' | 'agents' | 'authenticated';

export type TaskAccessRule = {
  enabled: boolean;
  priceUsd: number;
};

export type RepositoryGitAclRule = {
  id: string;
  branchPattern: string;
  allowedGroups: GitAccessGroup[];
};

export type RepositoryGitSettings = {
  exchangeRunDefault: boolean;
  exchangeActor: string;
  agentSourceUrl?: string;
  aclRules: RepositoryGitAclRule[];
};

export type RepositoryRepsConfig = {
  repositories: string[];
  repositoryConfigPath: string;
  agentSystemPromptPath?: string;
};

export type RepositoryLeposConfig = {
  issueStorage: 'filesystem' | 'database';
  issueRoot: string;
  issueReadmeName: string;
  issueFileName: string;
  issueAttachmentsDir: string;
  mainReadmePath: string;
  planDocumentPath: string;
  repositoryReadme: string;
  repositoryIcon: string;
  defaultBranch: string;
  acceptPullIssues: boolean;
  acceptPullPatches: boolean;
  repsConfigPaths: string[];
  agentSystemPromptPath?: string;
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

export type OrderDocument = {
  format: 'markdown';
  content: string;
  updatedAt?: string;
};

export type OrderActivity = {
  id: string;
  type: string;
  published?: string;
  actor?: string;
  status?: string;
  payload: Record<string, unknown>;
};

export type OrderRepository = {
  id: string;
  projectId?: string;
  orderId?: string;
  ownerHandle?: string;
  slug: string;
  name?: string;
  visibility: 'public' | 'private';
  defaultBranch?: string;
  serverUuid?: string;
  projectCloneUrl?: string;
  projectPublicCloneUrl?: string;
  projectSshCloneUrl?: string;
  projectArchiveUrl?: string;
  publicCloneUrl?: string;
  sshCloneUrl?: string;
  repsConfig?: RepositoryRepsConfig;
  repositoryUrl?: string;
  projectUrl?: string;
  patchTrackerUrl?: string;
  gitSettings?: RepositoryGitSettings;
  leposConfig?: RepositoryLeposConfig;
  createdAt?: string;
  updatedAt?: string;
};

export type DraftOrder = {
  taskIcon?: string;
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
  taskIcon?: string;
  solver: string;
  solverName?: string;
  solverHandle?: string;
  solverProfileUrl?: string;
  status: string;
  title: string;
  description: string;
  createdAt: string;
  assignedAt?: string;
  startedAt?: string;
  estimatedCost?: number;
  currency: string;
  executionEstimate?: string;
  paymentUrl?: string;
  uiScenario?: Exclude<UiScenario, 'default'>;
  labels?: string[];
  exchangeStage?: ExecutionStage;
  executionSteps?: OrderExecutionStep[];
  activeExecutionStepId?: string;
  progressPercent?: number;
  executors?: OrderExecutor[];
  notebook?: OrderNotebook;
  interimResult?: OrderResultSection;
  result?: OrderResultSection;
  iterations?: OrderIteration[];
  resultDocument?: VpnResultArticle;
  activitypub?: Record<string, unknown>;
  document?: OrderDocument;
  activities?: OrderActivity[];
  ownerProfileId?: string;
  ownerUsername?: string;
  ownerDisplayName?: string;
  actorHandle?: string;
  actorDid?: string;
  vcsEnabled?: boolean;
  projectId?: string;
  repository?: OrderRepository;
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
  templatePromptTemplate?: string;
  templateVariables?: ProfileTemplateVariable[];
  templateVariableValues?: Record<string, string>;
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

export type OrderStepConfirmation = {
  required: boolean;
  confirmed: boolean;
  label?: string;
  detail?: string;
};

export type OrderExecutionStep = {
  id: string;
  title: string;
  detail: string;
  state: ProgressState;
  confirmation?: OrderStepConfirmation;
};

export type OrderExecutorStatus = 'waiting' | 'accepted' | 'running' | 'review' | 'completed' | 'failed';

export type OrderExecutor = {
  id: string;
  name: string;
  handle?: string;
  avatarUrl?: string;
  rank?: number;
  status: OrderExecutorStatus;
  progressPercent?: number;
  currentNotebookStepId?: string;
  resultSummary?: string;
};

export type NotebookBlockType = 'markdown' | 'code' | 'output' | 'artifact' | 'diff' | 'warning';

export type OrderNotebookBlock = {
  id: string;
  type: NotebookBlockType;
  title?: string;
  content: string;
  language?: string;
  href?: string;
};

export type OrderCommentRecipient = 'actor' | 'solver';

export type OrderCommentMention = {
  id: string;
  value: string;
  kind: string;
  targetKind?: OrderCommentRecipient;
};

export type OrderStepComment = {
  id: string;
  content: string;
  mentions?: OrderCommentMention[];
  authorName?: string;
  authorHandle?: string;
  createdAt?: string;
};

export type OrderNotebookStep = {
  id: string;
  title: string;
  detail?: string;
  state: ProgressState;
  statusLabel?: string;
  executorId?: string;
  executorName?: string;
  createdAt?: string;
  completedAt?: string;
  iterationIndex?: number;
  blocks: OrderNotebookBlock[];
  comments?: OrderStepComment[];
  commentThreadId?: string;
};

export type OrderNotebook = {
  steps: OrderNotebookStep[];
};

export type OrderResultSection = {
  title: string;
  summary?: string;
  blocks: OrderNotebookBlock[];
};

export type OrderIteration = {
  id: string;
  title: string;
  summary?: string;
  createdAt?: string;
  current?: boolean;
  stepCount?: number;
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
  steps: OrderExecutionStep[];
  activeStep: OrderExecutionStep | null;
  progressPercent: number;
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

function extractAttachmentResult(order: OrderView | null, localeText: KefineLocaleText): { title: string; summary: string; content: string } | null {
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
        title: typeof item.name === 'string' && item.name.trim() ? item.name : localeText.result.taskResultTitle,
        summary: typeof item.summary === 'string' && item.summary.trim() ? item.summary : localeText.result.serverPayloadSummary,
        content
      };
    }

    if (isRecord(content)) {
      return {
        title: typeof item.name === 'string' && item.name.trim() ? item.name : localeText.result.taskResultTitle,
        summary: typeof item.summary === 'string' && item.summary.trim() ? item.summary : localeText.result.serverPayloadSummary,
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

  if (normalized.includes('min') || normalized.includes('мин') || normalized.includes('րոպ')) {
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
  const isArmenianLocale = localeText.meta.locale === 'hy';
  if (
    normalizedTitle.includes('optimize an algorithm') ||
    normalizedTitle.includes('algorithm optimization') ||
    normalizedTitle.includes('оптимизация алгоритма')
  ) {
    return isRussianLocale ? 'около 2 часов' : isArmenianLocale ? 'մոտ 2 ժամ' : 'about 2 hours';
  }

  if (
    normalizedTitle.includes('deploy') ||
    normalizedTitle.includes('production app') ||
    normalizedTitle.includes('деплой')
  ) {
    return isRussianLocale ? 'около 3 часов' : isArmenianLocale ? 'մոտ 3 ժամ' : 'about 3 hours';
  }

  if (
    normalizedTitle.includes('telegram') ||
    normalizedTitle.includes('access') ||
    normalizedTitle.includes('доступ')
  ) {
    return isRussianLocale ? 'около 45 минут' : isArmenianLocale ? 'մոտ 45 րոպե' : 'about 45 minutes';
  }

  return isRussianLocale ? 'около 1 часа' : isArmenianLocale ? 'մոտ 1 ժամ' : 'about 1 hour';
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

function deriveGenericExecutionStage(order: OrderView | null): ExecutionStage {
  if (!order) {
    return 'queued';
  }

  if (order.exchangeStage) {
    return order.exchangeStage;
  }

  const status = order.status.trim().toLowerCase();

  if (['completed', 'done'].includes(status)) {
    return 'completed';
  }

  if (['review', 'awaiting-review', 'pending-confirmation', 'awaiting-confirmation'].includes(status)) {
    return 'review';
  }

  if (['executing', 'running', 'in-progress', 'in_progress'].includes(status)) {
    return 'running';
  }

  if (['accepted', 'assigned'].includes(status)) {
    return 'assigned';
  }

  if (['matching', 'competition'].includes(status)) {
    return 'matching';
  }

  if (['failed', 'error', 'rejected', 'stopped'].includes(status)) {
    return 'failed';
  }

  return 'queued';
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
  void localeText;
  return (order?.executionSteps || []).map((item) => ({
    id: item.id,
    title: item.title,
    detail: item.detail,
    state: item.state
  }));
}

export function deriveExecutionPresentation(
  order: OrderView | null,
  localeText: KefineLocaleText,
  authMethod: AuthMethod,
  paymentReady: boolean
): ExecutionPresentation {
  const isVpnScenario = isVpnOrder(order);
  const stage = isVpnScenario ? deriveExecutionStage(order, authMethod, paymentReady) : deriveGenericExecutionStage(order);
  const stageConfig = localeText.executionFlow[stage === 'winner-selected' ? 'winnerSelected' : stage];
  const estimate = splitEstimate(order?.executionEstimate, localeText);
  const steps = !isVpnScenario ? (order?.executionSteps || []) : buildOrderSubtasks(order, localeText);
  const activeStep =
    !isVpnScenario && steps.length > 0
      ? steps.find((item) => item.id === order?.activeExecutionStepId) ||
        steps.find((item) => item.state === 'active') ||
        steps.findLast((item) => item.state === 'completed') ||
        steps[0]
      : null;
  const progressPercent =
    !isVpnScenario
      ? Math.max(
          0,
          Math.min(
            100,
            order?.progressPercent ??
              (steps.length > 0 ? Math.round((((activeStep ? steps.indexOf(activeStep) : 0) + 1) / steps.length) * 100) : 0)
          )
        )
      : 0;

  return {
    scenario: isVpnScenario ? 'vpn-service' : 'default',
    stage,
    eyebrow: localeText.labels.taskStatus,
    headline: !isVpnScenario ? (activeStep?.title || stageConfig.title) : stageConfig.title,
    supportingText: !isVpnScenario ? (activeStep?.detail || stageConfig.detail) : stageConfig.detail,
    stageItems: isVpnScenario ? buildStageItems(stage, localeText) : [],
    subtasks: [],
    steps,
    activeStep,
    progressPercent,
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
  const attachmentResult = extractAttachmentResult(order, localeText);

  if (isVpnOrder(order)) {
    const resultDocument = order?.resultDocument;
    if (resultDocument) {
      return {
        type: 'json',
        title: resultDocument.name,
        summary: resultDocument.summary || localeText.result.serverArticleSummary,
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
      title: localeText.result.vpnMockTitle,
      summary: localeText.result.vpnMockSummary,
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
      srcdoc: `<html><head><style>body{margin:0;font-family:Manrope,system-ui;background:#f7ecd6;color:#2e2317;display:grid;place-items:center;height:100vh}.frame-card{padding:24px;border:1px solid #b8a07a;border-radius:16px;background:#eadcbc;text-align:center}.frame-card h1{margin:0 0 8px;font-size:24px}.frame-card p{margin:0}</style></head><body><div class="frame-card"><h1>${localeText.result.iframeTitle}</h1><p>${order?.title ?? localeText.defaults.taskTitle}</p></div></body></html>`
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
