import assert from 'node:assert/strict';
import { describe, test } from 'vitest';

import { defaultMetrics, defaultSolutions, type Solution } from './solutions-data';

type CodeLine = Solution['codeLines'][number];

describe('defaultSolutions data integrity', () => {
  test('every solution has a unique id', () => {
    const ids = defaultSolutions.map(s => s.id);
    assert.equal(new Set(ids).size, ids.length);
  });

  test('every solution exposes a runnable quick test', () => {
    for (const solution of defaultSolutions) {
      const quickTest = solution.quickTest;
      assert.ok(
        quickTest,
        `Solution ${solution.id} (${solution.solver}) is missing a quick test; ` +
          `tests are surfaced on the card so users can validate it without opening the solution.`
      );
      assert.ok(quickTest.command.trim().length > 0, `Solution ${solution.id} quick test has an empty command.`);
      assert.ok(quickTest.title.trim().length > 0, `Solution ${solution.id} quick test has an empty title.`);
      assert.ok(quickTest.expected.trim().length > 0, `Solution ${solution.id} quick test has an empty expected outcome.`);
    }
  });

  test('a quick test marked as failing surfaces the actual outcome', () => {
    for (const solution of defaultSolutions) {
      const quickTest = solution.quickTest;
      if (!quickTest || quickTest.passes !== false) continue;
      assert.ok(
        quickTest.actual && quickTest.actual.trim().length > 0,
        `Solution ${solution.id} quick test is marked as failing but has no actual outcome to show.`
      );
    }
  });

  test('every solution has pricing metrics', () => {
    const metricIds = new Set(defaultMetrics.map(metric => metric.solverId));

    for (const solution of defaultSolutions) {
      assert.ok(
        metricIds.has(solution.id),
        `Solution ${solution.id} (${solution.solver}) is missing pricing metrics.`
      );
    }
  });

  test('empty lines inside an additive file are typed as added', () => {
    for (const solution of defaultSolutions) {
      const blanks = solution.codeLines.filter(line => line.text === '');
      for (const blank of blanks) {
        assert.notEqual(
          blank.type,
          'unchanged',
          `Solution ${solution.id} still has a blank "unchanged" line; ` +
            `empty lines inside an added block should be counted as added.`
        );
      }
      if (solution.fileCodeLines) {
        for (const [file, lines] of Object.entries(solution.fileCodeLines)) {
          const fileBlanks = lines.filter(line => line.text === '');
          for (const blank of fileBlanks) {
            assert.notEqual(
              blank.type,
              'unchanged',
              `Solution ${solution.id} file ${file} has a blank "unchanged" line.`
            );
          }
        }
      }
    }
  });

  test('per-file added counts equal the number of "added" lines in fileCodeLines', () => {
    for (const solution of defaultSolutions) {
      const fileCodeLines = solution.fileCodeLines;
      if (!fileCodeLines) continue;
      for (const diff of solution.diffs) {
        const fileLines: CodeLine[] | undefined = fileCodeLines[diff.file];
        if (!fileLines) continue;
        const addedCount: number = fileLines.filter((line: CodeLine) => line.type === 'added').length;
        assert.equal(
          addedCount,
          diff.added,
          `Solution ${solution.id} file ${diff.file}: diff.added=${diff.added} but fileCodeLines has ${addedCount} added lines`
        );
      }
    }
  });
});
