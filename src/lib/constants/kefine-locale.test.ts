import { describe, expect, test } from 'vitest';
import { KEFINE_TEXT_EN } from './kefine-locale-en';
import { KEFINE_TEXT_HY } from './kefine-locale-hy';
import { KEFINE_TEXT_RU } from './kefine-locale-ru';

describe('kefine locale bundles', () => {
  const translatedPaths = [
    ['executionFlow.queued.title', KEFINE_TEXT_EN.executionFlow.queued.title, KEFINE_TEXT_RU.executionFlow.queued.title, KEFINE_TEXT_HY.executionFlow.queued.title],
    ['profile.subtitle', KEFINE_TEXT_EN.profile.subtitle, KEFINE_TEXT_RU.profile.subtitle, KEFINE_TEXT_HY.profile.subtitle],
    ['solversView.tasksAside', KEFINE_TEXT_EN.solversView.tasksAside, KEFINE_TEXT_RU.solversView.tasksAside, KEFINE_TEXT_HY.solversView.tasksAside],
    ['solutionView.tabs.testing.label', KEFINE_TEXT_EN.solutionView.tabs.testing.label, KEFINE_TEXT_RU.solutionView.tabs.testing.label, KEFINE_TEXT_HY.solutionView.tabs.testing.label],
    ['table.headers.task', KEFINE_TEXT_EN.table.headers.task, KEFINE_TEXT_RU.table.headers.task, KEFINE_TEXT_HY.table.headers.task]
  ] as const;

  test.each(translatedPaths)('%s is localized in Russian and Armenian', (_path, english, russian, armenian) => {
    expect(russian).not.toBe(english);
    expect(armenian).not.toBe(english);
  });
});
