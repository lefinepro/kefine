/**
 * OKR-012.2: Component Tests
 *
 * Tests OKR UI components: ProgressRing, OKRIndex rendering states,
 * ObjectiveCard display, and KeyResultRow interactions.
 *
 * Uses @testing-library/svelte with jsdom environment for DOM testing,
 * and direct logic tests for pure computed values.
 *
 * @vitest-environment jsdom
 */

/// <reference types="@testing-library/jest-dom" />

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/svelte';
import { get } from 'svelte/store';

// ── Mocks ──────────────────────────────────────────────────────────────────
const localStorageStub = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => { store[key] = value; },
    removeItem: (key: string) => { delete store[key]; },
    clear: () => { store = {}; }
  };
})();

vi.stubGlobal('localStorage', localStorageStub);
vi.stubGlobal('window', { localStorage: localStorageStub });

// ── Imports ────────────────────────────────────────────────────────────────
import ProgressRing from '$lib/components/okrs/progress-ring/progress-ring.svelte';
import OKRIndex from '$lib/components/okrs/okr-index/okr-index.svelte';
import { okrStore } from '$lib/stores/okrs';
import { getProgressColor } from '$lib/utils/colors';
import { formatProgress } from '$lib/utils/formatters';

// ── Helper: reset store ───────────────────────────────────────────────────
function resetStore() {
  localStorageStub.clear();
  const state = get(okrStore);
  [...state.objectives].forEach((obj) => okrStore.deleteObjective(obj.id));
  [...get(okrStore).keyResults].forEach((kr) => okrStore.deleteKeyResult(kr.id));
  okrStore.setFilters({ quarter: null, year: null, status: null, search: '' });
}

// ── OKR-012.2.4: ProgressRing Tests ──────────────────────────────────────

describe('OKR-012.2.4: ProgressRing component', () => {
  it('renders SVG with correct aria-label for given progress', () => {
    const { container } = render(ProgressRing, { props: { progress: 42 } });
    const svg = container.querySelector('svg');
    expect(svg).not.toBeNull();
    expect(svg?.getAttribute('aria-label')).toBe('Progress: 42%');
  });

  it('renders with role="img" for screen reader accessibility', () => {
    const { container } = render(ProgressRing, { props: { progress: 75 } });
    const svg = container.querySelector('svg[role="img"]');
    expect(svg).not.toBeNull();
  });

  it('displays percentage text in SVG', () => {
    render(ProgressRing, { props: { progress: 60 } });
    // The SVG text element should contain "60%"
    expect(screen.getByText('60%')).toBeTruthy();
  });

  it('clamps progress at 100% — shows 100% for progress > 100', () => {
    render(ProgressRing, { props: { progress: 150 } });
    expect(screen.getByText('100%')).toBeTruthy();
  });

  it('clamps progress at 0% — shows 0% for negative progress', () => {
    render(ProgressRing, { props: { progress: -10 } });
    expect(screen.getByText('0%')).toBeTruthy();
  });

  it('uses sm size: SVG has width/height 32', () => {
    const { container } = render(ProgressRing, { props: { progress: 50, size: 'sm' } });
    const svg = container.querySelector('svg');
    expect(svg?.getAttribute('width')).toBe('32');
    expect(svg?.getAttribute('height')).toBe('32');
  });

  it('uses md size: SVG has width/height 48', () => {
    const { container } = render(ProgressRing, { props: { progress: 50, size: 'md' } });
    const svg = container.querySelector('svg');
    expect(svg?.getAttribute('width')).toBe('48');
    expect(svg?.getAttribute('height')).toBe('48');
  });

  it('uses lg size: SVG has width/height 64', () => {
    const { container } = render(ProgressRing, { props: { progress: 50, size: 'lg' } });
    const svg = container.querySelector('svg');
    expect(svg?.getAttribute('width')).toBe('64');
    expect(svg?.getAttribute('height')).toBe('64');
  });

  it('rounds fractional progress to nearest integer in label', () => {
    render(ProgressRing, { props: { progress: 66.7 } });
    expect(screen.getByText('67%')).toBeTruthy();
  });

  it('uses custom color when provided', () => {
    const { container } = render(ProgressRing, { props: { progress: 50, color: '#ff0000' } });
    const progressArc = container.querySelector('.progress-arc');
    expect(progressArc?.getAttribute('stroke')).toBe('#ff0000');
  });

  it('uses getProgressColor when no custom color provided', () => {
    // 80% progress → green (#22c55e)
    const { container } = render(ProgressRing, { props: { progress: 80 } });
    const progressArc = container.querySelector('.progress-arc');
    expect(progressArc?.getAttribute('stroke')).toBe(getProgressColor(80));
  });
});

// ── OKR-012.2.1: OKRIndex Rendering Tests ─────────────────────────────────

describe('OKR-012.2.1: OKRIndex rendering', () => {
  beforeEach(() => {
    resetStore();
  });

  it('renders empty state when no objectives exist', async () => {
    render(OKRIndex);
    // The empty state shows "No objectives yet" heading
    await vi.waitFor(() => {
      expect(screen.getByText('No objectives yet')).toBeTruthy();
    });
  });

  it('empty state includes "Create Objective" button', async () => {
    render(OKRIndex);
    await vi.waitFor(() => {
      expect(screen.getByText('Create Objective')).toBeTruthy();
    });
  });

  it('renders toolbar with filter controls', () => {
    render(OKRIndex);
    expect(screen.getByLabelText('Filter by quarter')).toBeTruthy();
    expect(screen.getByLabelText('Filter by year')).toBeTruthy();
    expect(screen.getByLabelText('Search objectives')).toBeTruthy();
  });

  it('renders "+ New Objective" button', () => {
    render(OKRIndex);
    expect(screen.getByText('+ New Objective')).toBeTruthy();
  });

  it('renders objectives from store', async () => {
    okrStore.addObjective({
      title: 'Render Test Objective',
      quarter: 'Q1',
      year: 2026,
      status: 'active'
    });
    render(OKRIndex);
    await vi.waitFor(() => {
      expect(screen.getByText('Render Test Objective')).toBeTruthy();
    });
  });

  it('renders multiple objectives from store', async () => {
    okrStore.addObjective({ title: 'Objective Alpha', quarter: 'Q1', year: 2026, status: 'active' });
    okrStore.addObjective({ title: 'Objective Beta', quarter: 'Q2', year: 2026, status: 'active' });
    render(OKRIndex);
    await vi.waitFor(() => {
      expect(screen.getByText('Objective Alpha')).toBeTruthy();
      expect(screen.getByText('Objective Beta')).toBeTruthy();
    });
  });

  it('shows "no objectives match" message when filters exclude all objectives', async () => {
    okrStore.addObjective({ title: 'Some Objective', quarter: 'Q1', year: 2026, status: 'active' });
    const { container } = render(OKRIndex);

    // Select Q4 from the quarter dropdown — should exclude the Q1 objective
    const quarterSelect = container.querySelector('select[aria-label="Filter by quarter"]') as HTMLSelectElement;
    await fireEvent.change(quarterSelect, { target: { value: 'Q4' } });

    await vi.waitFor(() => {
      expect(screen.getByText('No objectives match your filters')).toBeTruthy();
    });
  });

  it('shows "Clear filters" button when filters are active', async () => {
    okrStore.addObjective({ title: 'Test Obj', quarter: 'Q1', year: 2026, status: 'active' });
    const { container } = render(OKRIndex);

    const searchInput = container.querySelector('input[type="search"]') as HTMLInputElement;
    await fireEvent.input(searchInput, { target: { value: 'zzz-no-match' } });

    await vi.waitFor(() => {
      expect(screen.getByText('Clear filters')).toBeTruthy();
    });
  });

  it('shows overall progress summary when objectives exist', async () => {
    okrStore.addObjective({ title: 'Progress Obj', quarter: 'Q1', year: 2026, status: 'active' });
    render(OKRIndex);
    await vi.waitFor(() => {
      expect(screen.getByText('Overall Progress')).toBeTruthy();
    });
  });
});

// ── OKR-012.2: Pure Logic Tests (component computations) ─────────────────
// These test the computed functions used inside components without DOM mounting.

describe('OKR-012.2: Component utility functions', () => {
  it('getProgressColor returns red for < 50%', () => {
    expect(getProgressColor(0)).toBe('#ef4444');
    expect(getProgressColor(49)).toBe('#ef4444');
  });

  it('getProgressColor returns orange for 50–80%', () => {
    expect(getProgressColor(50)).toBe('#f97316');
    expect(getProgressColor(80)).toBe('#f97316');
  });

  it('getProgressColor returns green for > 80%', () => {
    expect(getProgressColor(81)).toBe('#22c55e');
    expect(getProgressColor(100)).toBe('#22c55e');
  });

  it('formatProgress formats 0 to "0%"', () => {
    expect(formatProgress(0)).toBe('0%');
  });

  it('formatProgress formats 100 to "100%"', () => {
    expect(formatProgress(100)).toBe('100%');
  });

  it('formatProgress clamps values above 100 to "100%"', () => {
    expect(formatProgress(150)).toBe('100%');
  });

  it('formatProgress clamps negative values to "0%"', () => {
    expect(formatProgress(-5)).toBe('0%');
  });

  it('formatProgress respects decimal places', () => {
    expect(formatProgress(66.667, 1)).toBe('66.7%');
  });
});

// ── OKR-012.2.3: KeyResultRow — Inline logic tests ────────────────────────
// (KeyResultRow is tightly coupled to store; test its logic via computed values)

describe('OKR-012.2.3: KeyResultRow interactions (store-level)', () => {
  beforeEach(() => { resetStore(); });

  it('slider update (updateKeyResult) is reflected in store', () => {
    const obj = okrStore.addObjective({
      title: 'Slider Test',
      quarter: 'Q1',
      year: 2026,
      status: 'active'
    });
    const kr = okrStore.addKeyResult({
      objectiveId: obj.id,
      title: 'Slider KR',
      targetType: 'number',
      targetValue: 100,
      currentValue: 0,
      unit: '%',
      weight: 1
    });

    // Simulate slider interaction (user moves slider to 75)
    okrStore.updateKeyResult(kr.id, { currentValue: 75 });

    const updated = okrStore.getKeyResult(kr.id);
    expect(updated?.currentValue).toBe(75);
  });

  it('edit mode update changes both title and value', () => {
    const obj = okrStore.addObjective({
      title: 'Edit Test',
      quarter: 'Q1',
      year: 2026,
      status: 'active'
    });
    const kr = okrStore.addKeyResult({
      objectiveId: obj.id,
      title: 'Original KR',
      targetType: 'number',
      targetValue: 100,
      currentValue: 20,
      unit: 'pts',
      weight: 1
    });

    okrStore.updateKeyResult(kr.id, { title: 'Updated KR', targetValue: 200, currentValue: 150 });

    const updated = okrStore.getKeyResult(kr.id);
    expect(updated?.title).toBe('Updated KR');
    expect(updated?.targetValue).toBe(200);
    expect(updated?.currentValue).toBe(150);
  });

  it('displays correct progress percentage after value update', () => {
    const obj = okrStore.addObjective({
      title: 'Display Test',
      quarter: 'Q1',
      year: 2026,
      status: 'active'
    });
    const kr = okrStore.addKeyResult({
      objectiveId: obj.id,
      title: 'Display KR',
      targetType: 'number',
      targetValue: 200,
      currentValue: 100,
      unit: 'pts',
      weight: 1
    });

    const progress = okrStore.calculateKeyResultProgress(kr);
    expect(progress).toBe(50);
    expect(formatProgress(progress)).toBe('50%');
  });
});

// ── OKR-012.2.2: ObjectiveCard — Logic tests ─────────────────────────────

describe('OKR-012.2.2: ObjectiveCard rendering (via store)', () => {
  beforeEach(() => { resetStore(); });

  it('objective with no key results shows 0% progress', () => {
    const obj = okrStore.addObjective({
      title: 'Empty Card',
      quarter: 'Q1',
      year: 2026,
      status: 'active'
    });
    expect(okrStore.calculateObjectiveProgress(obj.id)).toBe(0);
  });

  it('objective progress ring reflects KR completion', () => {
    const obj = okrStore.addObjective({
      title: 'Card With KRs',
      quarter: 'Q2',
      year: 2026,
      status: 'active'
    });
    okrStore.addKeyResult({
      objectiveId: obj.id,
      title: 'Full KR',
      targetType: 'number',
      targetValue: 100,
      currentValue: 100,
      unit: '%',
      weight: 1
    });
    expect(okrStore.calculateObjectiveProgress(obj.id)).toBe(100);
    expect(getProgressColor(100)).toBe('#22c55e');
  });

  it('completed objective status is preserved', () => {
    const obj = okrStore.addObjective({
      title: 'Done',
      quarter: 'Q4',
      year: 2025,
      status: 'completed'
    });
    okrStore.updateObjective(obj.id, { status: 'completed' });
    const found = okrStore.getObjective(obj.id);
    expect(found?.status).toBe('completed');
  });

  it('delete action removes objective from store', () => {
    const obj = okrStore.addObjective({
      title: 'Delete Me',
      quarter: 'Q1',
      year: 2026,
      status: 'active'
    });
    okrStore.deleteObjective(obj.id);
    expect(okrStore.getObjective(obj.id)).toBeUndefined();
  });
});
