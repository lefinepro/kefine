import type { KefineLocaleText } from '$lib/constants/kefine-locale';
import type {
  DraftOrder,
  ExecutionStage,
  OrderActivity,
  OrderDocument,
  OrderExecutor,
  OrderExecutionStep,
  OrderIteration,
  OrderNotebook,
  OrderNotebookBlock,
  OrderNotebookStep,
  OrderResultSection,
  OrderStepComment,
  OrderView,
  PaymentQuote,
  ProgressState,
  TaskAccessMode,
  TemplatePresentation,
  UiScenario,
  VpnResultArticle,
  VpnResultLink,
  VpnResultStep
} from '$lib/components/kefine/kefine-workflow';
import type { ProfileTemplateVariable } from '$lib/types/user';

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

function toTemplateVariables(value: unknown): ProfileTemplateVariable[] | undefined {
  if (!Array.isArray(value)) {
    return undefined;
  }

  const variables = value
    .map((item) => {
      const record = toRecord(item);
      const key = toStringValue(record?.['key']);
      if (!key) {
        return null;
      }

      return {
        key,
        defaultValue: toStringValue(record?.['defaultValue']) || undefined
      } satisfies ProfileTemplateVariable;
    })
    .filter(isDefined);

  return variables.length > 0 ? variables : undefined;
}

function toStringRecord(value: unknown): Record<string, string> | undefined {
  const record = toRecord(value);
  if (!record) {
    return undefined;
  }

  const entries = Object.entries(record)
    .map(([key, item]) => [key.trim(), typeof item === 'string' ? item : ''] as const)
    .filter(([key]) => key.length > 0);

  return entries.length > 0 ? Object.fromEntries(entries) : undefined;
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

function toProgressState(value: unknown): ProgressState | undefined {
  if (value === 'completed' || value === 'active' || value === 'upcoming') {
    return value;
  }

  if (typeof value !== 'string') {
    return undefined;
  }

  const normalized = value.trim().toLowerCase();
  if (['done', 'complete', 'completed', 'confirmed', 'success'].includes(normalized)) {
    return 'completed';
  }

  if (['active', 'current', 'in-progress', 'in_progress', 'running', 'pending-confirmation', 'awaiting-confirmation'].includes(normalized)) {
    return 'active';
  }

  if (['upcoming', 'pending', 'queued', 'next', 'waiting'].includes(normalized)) {
    return 'upcoming';
  }

  return undefined;
}

function toBoolean(value: unknown): boolean | undefined {
  if (typeof value === 'boolean') {
    return value;
  }

  if (typeof value === 'string') {
    if (value === 'true') return true;
    if (value === 'false') return false;
  }

  return undefined;
}

function toOrderDocument(value: unknown): OrderDocument | undefined {
  const record = toRecord(value);
  if (!record) {
    return undefined;
  }

  const content = toStringValue(record['content']);
  if (!content) {
    return undefined;
  }

  return {
    format: 'markdown',
    content,
    updatedAt: toStringValue(record['updatedAt']) || undefined
  };
}

function toActivities(value: unknown): OrderActivity[] | undefined {
  if (!Array.isArray(value)) {
    return undefined;
  }

  const activities = value
    .map((item, index) => {
      const record = toRecord(item);
      if (!record) {
        return null;
      }

      return {
        id: toStringValue(record['id']) || `activity-${index + 1}`,
        type: toStringValue(record['type']) || 'Update',
        published: toStringValue(record['published']) || undefined,
        actor: toStringValue(record['actor']) || undefined,
        status:
          toStringValue(record['status']) ||
          toStringValue(toRecord(record['object'])?.['status']) ||
          undefined,
        payload: record
      } satisfies OrderActivity;
    })
    .filter(isDefined);

  return activities.length > 0 ? activities : undefined;
}

function toExecutionSteps(value: unknown): OrderExecutionStep[] | undefined {
  if (!Array.isArray(value)) {
    return undefined;
  }

  const steps = value
    .map((item, index) => {
      const record = toRecord(item);
      if (!record) {
        return null;
      }

      const title =
        toStringValue(record['title']) ||
        toStringValue(record['name']) ||
        toStringValue(record['label']);
      if (!title) {
        return null;
      }

      const detail =
        toStringValue(record['detail']) ||
        toStringValue(record['description']) ||
        toStringValue(record['content']) ||
        '';
      const state =
        toProgressState(record['state']) ||
        toProgressState(record['status']) ||
        (record['active'] === true ? 'active' : record['completed'] === true ? 'completed' : 'upcoming');
      const confirmationSource =
        toRecord(record['confirmation']) ||
        toRecord(record['confirm']) ||
        (toBoolean(record['requiresConfirmation']) === true || toBoolean(record['confirmed']) !== undefined
          ? record
          : null);
      const confirmation = confirmationSource
        ? {
            required:
              toBoolean(confirmationSource['required']) ??
              toBoolean(confirmationSource['requiresConfirmation']) ??
              false,
            confirmed:
              toBoolean(confirmationSource['confirmed']) ??
              toBoolean(confirmationSource['isConfirmed']) ??
              false,
            label:
              toStringValue(confirmationSource['label']) ||
              toStringValue(confirmationSource['title']) ||
              undefined,
            detail:
              toStringValue(confirmationSource['detail']) ||
              toStringValue(confirmationSource['hint']) ||
              toStringValue(confirmationSource['description']) ||
              undefined
          }
        : undefined;

      return {
        id: toStringValue(record['id']) || toStringValue(record['key']) || `step-${index + 1}`,
        title,
        detail,
        state,
        confirmation: confirmation && (confirmation.required || confirmation.confirmed || confirmation.label || confirmation.detail)
          ? confirmation
          : undefined
      } satisfies OrderExecutionStep;
    })
    .filter(isDefined);

  return steps.length > 0 ? steps : undefined;
}

function toExecutionStage(value: unknown): ExecutionStage | undefined {
  if (typeof value !== 'string') {
    return undefined;
  }

  const normalized = value.trim().toLowerCase();
  if (['queued', 'queue', 'created'].includes(normalized)) return 'queued';
  if (['matching', 'competition', 'searching'].includes(normalized)) return 'matching';
  if (['assigned', 'accepted', 'winner-selected', 'winner_selected'].includes(normalized)) return 'assigned';
  if (['running', 'executing', 'in-progress', 'in_progress', 'bridging'].includes(normalized)) return 'running';
  if (['review', 'awaiting-review', 'pending-confirmation', 'awaiting-confirmation'].includes(normalized)) return 'review';
  if (['completed', 'done', 'paid'].includes(normalized)) return 'completed';
  if (['failed', 'error', 'rejected', 'stopped'].includes(normalized)) return 'failed';
  if (['batching', 'awaiting-auth', 'awaiting-payment'].includes(normalized)) return normalized as ExecutionStage;
  return undefined;
}

function toExecutorStatus(value: unknown): OrderExecutor['status'] | undefined {
  if (typeof value !== 'string') {
    return undefined;
  }

  const normalized = value.trim().toLowerCase();
  if (['waiting', 'queued', 'pending'].includes(normalized)) return 'waiting';
  if (['accepted', 'assigned'].includes(normalized)) return 'accepted';
  if (['running', 'executing', 'active', 'in-progress', 'in_progress'].includes(normalized)) return 'running';
  if (['review', 'awaiting-review', 'pending-confirmation'].includes(normalized)) return 'review';
  if (['completed', 'done', 'confirmed'].includes(normalized)) return 'completed';
  if (['failed', 'error', 'rejected', 'stopped'].includes(normalized)) return 'failed';
  return undefined;
}

function toNotebookBlockType(value: unknown): OrderNotebookBlock['type'] {
  if (typeof value !== 'string') {
    return 'markdown';
  }

  const normalized = value.trim().toLowerCase();
  if (['code', 'source'].includes(normalized)) return 'code';
  if (['output', 'stdout', 'stderr', 'result'].includes(normalized)) return 'output';
  if (['artifact', 'file', 'attachment', 'link'].includes(normalized)) return 'artifact';
  if (['diff', 'patch'].includes(normalized)) return 'diff';
  if (['warning', 'error', 'notice'].includes(normalized)) return 'warning';
  return 'markdown';
}

function toStepComments(value: unknown): OrderStepComment[] | undefined {
  if (!Array.isArray(value)) {
    return undefined;
  }

  const comments = value
    .map((item, index) => {
      const record = toRecord(item);
      if (!record) {
        return null;
      }

      const content =
        toStringValue(record['content']) ||
        toStringValue(record['text']) ||
        toStringValue(record['body']) ||
        toStringValue(record['message']);
      if (!content) {
        return null;
      }

      return {
        id: toStringValue(record['id']) || `comment-${index + 1}`,
        content,
        authorName: toStringValue(record['authorName']) || toStringValue(record['author']) || toStringValue(record['name']),
        authorHandle: toStringValue(record['authorHandle']) || toStringValue(record['handle']),
        createdAt: toStringValue(record['createdAt']) || toStringValue(record['published'])
      } satisfies OrderStepComment;
    })
    .filter(isDefined);

  return comments.length > 0 ? comments : undefined;
}

function toNotebookBlocks(value: unknown): OrderNotebookBlock[] | undefined {
  if (typeof value === 'string' && value.trim()) {
    return [{ id: 'block-1', type: 'markdown', content: value.trim() }];
  }

  if (!Array.isArray(value)) {
    return undefined;
  }

  const blocks = value
    .map((item, index) => {
      if (typeof item === 'string' && item.trim()) {
        return {
          id: `block-${index + 1}`,
          type: 'markdown',
          content: item.trim()
        } satisfies OrderNotebookBlock;
      }

      const record = toRecord(item);
      if (!record) {
        return null;
      }

      const content =
        toStringValue(record['content']) ||
        toStringValue(record['text']) ||
        toStringValue(record['body']) ||
        toStringValue(record['value']) ||
        toStringValue(record['summary']);
      if (!content && !extractHref(record)) {
        return null;
      }

      return {
        id: toStringValue(record['id']) || `block-${index + 1}`,
        type: toNotebookBlockType(record['type']),
        title: toStringValue(record['title']) || toStringValue(record['name']),
        content: content || '',
        language: toStringValue(record['language']) || toStringValue(record['lang']),
        href: extractHref(record)
      } satisfies OrderNotebookBlock;
    })
    .filter(isDefined);

  return blocks.length > 0 ? blocks : undefined;
}

function toNotebookStep(value: unknown, index: number): OrderNotebookStep | null {
  const record = toRecord(value);
  if (!record) {
    return null;
  }

  const title =
    toStringValue(record['title']) ||
    toStringValue(record['name']) ||
    toStringValue(record['label']) ||
    `Stage ${index + 1}`;
  const blocks =
    toNotebookBlocks(record['blocks']) ||
    toNotebookBlocks(record['contentBlocks']) ||
    toNotebookBlocks(record['cells']) ||
    toNotebookBlocks(record['content']) ||
    toNotebookBlocks(record['output']) ||
    [];

  return {
    id: toStringValue(record['id']) || `notebook-step-${index + 1}`,
    title,
    detail: toStringValue(record['detail']) || toStringValue(record['description']),
    state:
      toProgressState(record['state']) ||
      toProgressState(record['status']) ||
      (toBoolean(record['completed']) ? 'completed' : toBoolean(record['active']) ? 'active' : 'upcoming'),
    statusLabel: toStringValue(record['status']) || undefined,
    executorId: toStringValue(record['executorId']) || toStringValue(record['performerId']),
    executorName: toStringValue(record['executorName']) || toStringValue(record['performerName']),
    createdAt: toStringValue(record['createdAt']) || toStringValue(record['published']),
    completedAt: toStringValue(record['completedAt']) || undefined,
    iterationIndex: toNumber(record['iterationIndex']),
    blocks,
    comments: toStepComments(record['comments']) || toStepComments(record['commentThread']),
    commentThreadId: toStringValue(record['commentThreadId']) || toStringValue(record['threadId'])
  };
}

function toNotebook(value: unknown): OrderNotebook | undefined {
  const record = toRecord(value);
  const rawSteps = Array.isArray(value)
    ? value
    : Array.isArray(record?.['steps'])
      ? record?.['steps']
      : Array.isArray(record?.['entries'])
        ? record?.['entries']
        : Array.isArray(record?.['timeline'])
          ? record?.['timeline']
          : null;

  if (!rawSteps) {
    return undefined;
  }

  const steps = rawSteps.map((item, index) => toNotebookStep(item, index)).filter(isDefined);
  return steps.length > 0 ? { steps } : undefined;
}

function toResultSection(value: unknown, fallbackTitle: string): OrderResultSection | undefined {
  if (typeof value === 'string' && value.trim()) {
    return {
      title: fallbackTitle,
      blocks: [{ id: 'result-block-1', type: 'markdown', content: value.trim() }]
    };
  }

  const record = toRecord(value);
  if (!record) {
    return undefined;
  }

  const blocks =
    toNotebookBlocks(record['blocks']) ||
    toNotebookBlocks(record['contentBlocks']) ||
    toNotebookBlocks(record['content']) ||
    toNotebookBlocks(record['output']);
  if (!blocks || blocks.length === 0) {
    return undefined;
  }

  return {
    title: toStringValue(record['title']) || toStringValue(record['name']) || fallbackTitle,
    summary: toStringValue(record['summary']) || toStringValue(record['description']),
    blocks
  };
}

function resultDocumentToSection(document: VpnResultArticle | undefined, fallbackTitle: string): OrderResultSection | undefined {
  if (!document) {
    return undefined;
  }

  return {
    title: document.name || fallbackTitle,
    summary: document.summary,
    blocks: [
      {
        id: 'result-document',
        type: 'output',
        content: document.content?.trim() || JSON.stringify(document.raw, null, 2)
      }
    ]
  };
}

function toIterations(value: unknown): OrderIteration[] | undefined {
  if (!Array.isArray(value)) {
    return undefined;
  }

  const iterations = value
    .map((item, index) => {
      const record = toRecord(item);
      if (!record) {
        return null;
      }

      return {
        id: toStringValue(record['id']) || `iteration-${index + 1}`,
        title: toStringValue(record['title']) || toStringValue(record['name']) || `Iteration ${index + 1}`,
        summary: toStringValue(record['summary']) || toStringValue(record['description']),
        createdAt: toStringValue(record['createdAt']) || toStringValue(record['published']),
        current: toBoolean(record['current']) ?? false,
        stepCount: toNumber(record['stepCount'])
      } satisfies OrderIteration;
    })
    .filter(isDefined);

  return iterations.length > 0 ? iterations : undefined;
}

function toExecutors(value: unknown): OrderExecutor[] | undefined {
  if (!Array.isArray(value)) {
    return undefined;
  }

  const executors = value
    .map((item, index) => {
      const record = toRecord(item);
      if (!record) {
        return null;
      }

      const name =
        toStringValue(record['name']) ||
        toStringValue(record['solverName']) ||
        toStringValue(record['performerName']) ||
        toStringValue(record['label']);
      if (!name) {
        return null;
      }

      return {
        id: toStringValue(record['id']) || `executor-${index + 1}`,
        name,
        handle: toStringValue(record['handle']) || toStringValue(record['solverHandle']) || toStringValue(record['performerHandle']),
        avatarUrl: extractHref(record) || toStringValue(record['avatarUrl']),
        rank: toNumber(record['rank']) ?? toNumber(record['position']) ?? index + 1,
        status: toExecutorStatus(record['status']) || toExecutorStatus(record['state']) || 'waiting',
        progressPercent: toNumber(record['progressPercent']) ?? toNumber(record['progress']),
        currentNotebookStepId: toStringValue(record['currentNotebookStepId']) || toStringValue(record['stepId']),
        resultSummary: toStringValue(record['resultSummary']) || toStringValue(record['summary'])
      } satisfies OrderExecutor;
    })
    .filter(isDefined)
    .sort((left, right) => (left.rank ?? Number.MAX_SAFE_INTEGER) - (right.rank ?? Number.MAX_SAFE_INTEGER));

  return executors.length > 0 ? executors : undefined;
}

function findExecutionSteps(source: Record<string, unknown>, ticket: Record<string, unknown>): OrderExecutionStep[] | undefined {
  return (
    toExecutionSteps(source['executionSteps']) ||
    toExecutionSteps(source['steps']) ||
    toExecutionSteps(source['subtasks']) ||
    toExecutionSteps(ticket['executionSteps']) ||
    toExecutionSteps(ticket['steps']) ||
    toExecutionSteps(ticket['subtasks'])
  );
}

function findActiveExecutionStepId(source: Record<string, unknown>, ticket: Record<string, unknown>): string | undefined {
  return (
    toStringValue(source['activeExecutionStepId']) ||
    toStringValue(source['activeStepId']) ||
    toStringValue(ticket['activeExecutionStepId']) ||
    toStringValue(ticket['activeStepId'])
  );
}

function findProgressPercent(source: Record<string, unknown>, ticket: Record<string, unknown>): number | undefined {
  return (
    toNumber(source['progressPercent']) ??
    toNumber(source['progress']) ??
    toNumber(ticket['progressPercent']) ??
    toNumber(ticket['progress']) ??
    undefined
  );
}

function findExchangeStage(source: Record<string, unknown>, ticket: Record<string, unknown>): ExecutionStage | undefined {
  return (
    toExecutionStage(source['exchangeStage']) ||
    toExecutionStage(source['executionStage']) ||
    toExecutionStage(source['stage']) ||
    toExecutionStage(ticket['exchangeStage']) ||
    toExecutionStage(ticket['executionStage']) ||
    toExecutionStage(ticket['stage']) ||
    toExecutionStage(source['status']) ||
    toExecutionStage(ticket['status'])
  );
}

function findExecutors(source: Record<string, unknown>, ticket: Record<string, unknown>): OrderExecutor[] | undefined {
  return (
    toExecutors(source['executors']) ||
    toExecutors(source['performers']) ||
    toExecutors(source['workers']) ||
    toExecutors(ticket['executors']) ||
    toExecutors(ticket['performers']) ||
    toExecutors(ticket['workers'])
  );
}

function findNotebook(source: Record<string, unknown>, ticket: Record<string, unknown>): OrderNotebook | undefined {
  return (
    toNotebook(source['notebook']) ||
    toNotebook(source['timeline']) ||
    toNotebook(source['journal']) ||
    toNotebook(ticket['notebook']) ||
    toNotebook(ticket['timeline']) ||
    toNotebook(ticket['journal'])
  );
}

function findInterimResult(source: Record<string, unknown>, ticket: Record<string, unknown>): OrderResultSection | undefined {
  return (
    toResultSection(source['interimResult'], 'Interim result') ||
    toResultSection(source['currentResult'], 'Interim result') ||
    toResultSection(ticket['interimResult'], 'Interim result') ||
    toResultSection(ticket['currentResult'], 'Interim result')
  );
}

function findFinalResult(source: Record<string, unknown>, ticket: Record<string, unknown>): OrderResultSection | undefined {
  return (
    toResultSection(source['result'], 'Final result') ||
    toResultSection(source['finalResult'], 'Final result') ||
    toResultSection(ticket['result'], 'Final result') ||
    toResultSection(ticket['finalResult'], 'Final result')
  );
}

function findIterations(source: Record<string, unknown>, ticket: Record<string, unknown>): OrderIteration[] | undefined {
  return toIterations(source['iterations']) || toIterations(ticket['iterations']);
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

function latestActivityObject(payload: Record<string, unknown> | null): Record<string, unknown> | null {
  if (!payload || !Array.isArray(payload['activities'])) {
    return null;
  }

  const latestActivity = [...payload['activities']]
    .map((item) => toRecord(item))
    .filter(isDefined)
    .at(-1);

  return latestActivity ? unwrapActivityObject(latestActivity) : null;
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
      const resultDocument = extractResultDocument(order);

      return {
        id: toStringValue(order['id']) || '',
        ...(toStringValue(order['taskIcon']) ? { taskIcon: toStringValue(order['taskIcon']) as string } : {}),
        solver: toStringValue(order['solver']) || '',
        status: toStringValue(order['status']) || 'queued',
        title,
        description: toStringValue(order['description']) || '',
        createdAt: toStringValue(order['createdAt']) || new Date().toISOString(),
        assignedAt: toStringValue(order['assignedAt']) || toStringValue(order['acceptedAt']) || toStringValue(order['matchedAt']),
        startedAt: toStringValue(order['startedAt']) || toStringValue(order['executionStartedAt']) || toStringValue(order['runningAt']),
        estimatedCost: toNumber(order['estimatedCost']) || undefined,
        currency: toStringValue(order['currency']) || localeText.defaults.defaultCurrency,
        executionEstimate: resolveExecutionEstimate(toStringValue(order['executionEstimate']) || undefined, title, localeText),
        paymentUrl: toStringValue(order['paymentUrl']) || undefined,
        uiScenario: toUiScenario(order['uiScenario']),
        labels: toStringList(order['labels']),
        exchangeStage: toExecutionStage(order['exchangeStage']) || toExecutionStage(order['status']),
        executionSteps: toExecutionSteps(order['executionSteps']) || toExecutionSteps(order['steps']) || toExecutionSteps(order['subtasks']),
        activeExecutionStepId: toStringValue(order['activeExecutionStepId']) || toStringValue(order['activeStepId']),
        progressPercent: toNumber(order['progressPercent']) ?? toNumber(order['progress']),
        executors: toExecutors(order['executors']) || toExecutors(order['performers']),
        notebook: toNotebook(order['notebook']) || toNotebook(order['timeline']),
        interimResult: toResultSection(order['interimResult'], 'Interim result') || toResultSection(order['currentResult'], 'Interim result'),
        result:
          toResultSection(order['result'], 'Final result') ||
          toResultSection(order['finalResult'], 'Final result') ||
          resultDocumentToSection(resultDocument, 'Final result'),
        iterations: toIterations(order['iterations']),
        resultDocument,
        activitypub: toRecord(order['activitypub']) || undefined,
        document: toOrderDocument(order['document']),
        activities: toActivities(order['activities']),
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
        templateNetUsd: toNumber(order['templateNetUsd']),
        templatePromptTemplate: toStringValue(order['templatePromptTemplate']),
        templateVariables: toTemplateVariables(order['templateVariables']),
        templateVariableValues: toStringRecord(order['templateVariableValues'])
      };
    })
    .filter((order) => order.id.length > 0 && !order.id.startsWith('temp-') && !order.id.startsWith('local-'));
}

export function readCreateResponse(body: unknown): {
  orderId: string;
  taskIcon?: string;
  solver?: string;
  solverName?: string;
  solverHandle?: string;
  solverProfileUrl?: string;
  ownerProfileId?: string;
  ownerUsername?: string;
  ownerDisplayName?: string;
  actorHandle?: string;
  actorDid?: string;
  status?: string;
  uiScenario?: Exclude<UiScenario, 'default'>;
  exchangeStage?: ExecutionStage;
  executionSteps?: OrderExecutionStep[];
  activeExecutionStepId?: string;
  progressPercent?: number;
  executors?: OrderExecutor[];
  notebook?: OrderNotebook;
  interimResult?: OrderResultSection;
  result?: OrderResultSection;
  iterations?: OrderIteration[];
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
    taskIcon: toStringValue(body['taskIcon']) || undefined,
    solver: toStringValue(body['solver']) || undefined,
    solverName: toStringValue(body['solverName']) || undefined,
    solverHandle: toStringValue(body['solverHandle']) || undefined,
    solverProfileUrl: toStringValue(body['solverProfileUrl']) || undefined,
    ownerProfileId: toStringValue(body['ownerProfileId']) || undefined,
    ownerUsername: toStringValue(body['ownerUsername']) || undefined,
    ownerDisplayName: toStringValue(body['ownerDisplayName']) || undefined,
    actorHandle: toStringValue(body['actorHandle']) || extractActorHandleFromOrderReference(orderId) || undefined,
    actorDid: toStringValue(body['actorDid']) || undefined,
    status: toStringValue(body['status']) || 'queued',
    uiScenario: toUiScenario(body['uiScenario']),
    exchangeStage: findExchangeStage(body, body),
    executionSteps: findExecutionSteps(body, body),
    activeExecutionStepId: findActiveExecutionStepId(body, body),
    progressPercent: findProgressPercent(body, body),
    executors: findExecutors(body, body),
    notebook: findNotebook(body, body),
    interimResult: findInterimResult(body, body),
    result: findFinalResult(body, body),
    iterations: findIterations(body, body)
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

  const latestActivity = latestActivityObject(rootPayload);
  const source = latestActivity ? { ...activityOrObject, ...latestActivity } : activityOrObject;
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
  const assignedAt =
    toStringValue(source['assignedAt']) ||
    toStringValue(source['acceptedAt']) ||
    toStringValue(source['matchedAt']) ||
    toStringValue(ticket['assignedAt']) ||
    toStringValue(ticket['acceptedAt']) ||
    toStringValue(ticket['matchedAt']) ||
    undefined;
  const startedAt =
    toStringValue(source['startedAt']) ||
    toStringValue(source['executionStartedAt']) ||
    toStringValue(source['runningAt']) ||
    toStringValue(ticket['startedAt']) ||
    toStringValue(ticket['executionStartedAt']) ||
    toStringValue(ticket['runningAt']) ||
    undefined;
  const linkedPrice = toNumber(paymentLink?.['price']) ?? toNumber(paymentLink?.['amount']);
  const linkedCurrency = toStringValue(paymentLink?.['currency']) || undefined;
  const linkedSolver =
    extractActorLabel(paymentLink?.['attributedTo']) ||
    extractActorLabel(source['attributedTo']) ||
    extractActorLabel(ticket['attributedTo']) ||
    undefined;
  const executionSteps = findExecutionSteps(source, ticket);
  const exchangeStage = findExchangeStage(source, ticket);
  const executors = findExecutors(source, ticket);
  const notebook = findNotebook(source, ticket);
  const interimResult = findInterimResult(source, ticket);
  const result = findFinalResult(source, ticket) || resultDocumentToSection(resultDocument, 'Final result');
  const iterations = findIterations(source, ticket);

  return {
    id: orderId,
    solver: toStringValue(source['solver']) || linkedSolver || '',
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
    assignedAt,
    startedAt,
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
    exchangeStage,
    executionSteps,
    activeExecutionStepId: findActiveExecutionStepId(source, ticket),
    progressPercent: findProgressPercent(source, ticket),
    executors,
    notebook,
    interimResult,
    result,
    iterations,
    resultDocument,
    activitypub: rootPayload || undefined,
    document: toOrderDocument(source['document']) || toOrderDocument(ticket['document']) || toOrderDocument(rootPayload?.['document']),
    activities: toActivities(rootPayload?.['activities']),
    ownerProfileId: toStringValue(source['ownerProfileId']) || toStringValue(ticket['ownerProfileId']) || undefined,
    ownerUsername: toStringValue(source['ownerUsername']) || toStringValue(ticket['ownerUsername']) || undefined,
    ownerDisplayName: toStringValue(source['ownerDisplayName']) || toStringValue(ticket['ownerDisplayName']) || undefined,
    actorHandle: toStringValue(source['actorHandle']) || toStringValue(ticket['actorHandle']) || undefined,
    actorDid: toStringValue(source['actorDid']) || toStringValue(ticket['actorDid']) || undefined,
    ...(toStringValue(source['taskIcon']) || toStringValue(ticket['taskIcon'])
      ? { taskIcon: (toStringValue(source['taskIcon']) || toStringValue(ticket['taskIcon'])) as string }
      : {}),
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
    templateNetUsd: toNumber(source['templateNetUsd']) ?? toNumber(ticket['templateNetUsd']) ?? undefined,
    templatePromptTemplate:
      toStringValue(source['templatePromptTemplate']) || toStringValue(ticket['templatePromptTemplate']) || undefined,
    templateVariables: toTemplateVariables(source['templateVariables']) || toTemplateVariables(ticket['templateVariables']),
    templateVariableValues: toStringRecord(source['templateVariableValues']) || toStringRecord(ticket['templateVariableValues'])
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

export function buildCreatePayload(
  payload: DraftOrder,
  template?: TemplatePresentation | null,
  owner?: {
    ownerProfileId?: string;
    ownerUsername?: string;
    ownerDisplayName?: string;
    actorHandle?: string;
    actorDid?: string;
  } | null
) {
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
    taskIcon: payload.taskIcon || undefined,
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
    templatePricingValue: template?.pricingValue,
    templatePromptTemplate: payload.templatePromptTemplate || template?.promptTemplate,
    templateVariables: payload.templateVariables,
    templateVariableValues: payload.templateVariableValues,
    ownerProfileId: owner?.ownerProfileId,
    ownerUsername: owner?.ownerUsername,
    ownerDisplayName: owner?.ownerDisplayName,
    actorHandle: owner?.actorHandle,
    actorDid: owner?.actorDid
  };
}
