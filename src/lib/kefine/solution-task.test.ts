import { describe, expect, test } from 'vitest';

import {
  deriveSolutionTaskRepositoryLabel,
  resolveSolutionTask
} from './solution-task';

describe('solution task matching', () => {
  test('matches the Russian mini proxy Go task to the Go proxy solutions', () => {
    const task = resolveSolutionTask('Нужен мини прокси на go');

    expect(task?.repositoryLabel).toBe('go-proxy');
    expect(task?.solutionIds).toEqual(['5', '6', '7']);
  });

  test('matches hello world Rust tasks to the Rust solutions', () => {
    const task = resolveSolutionTask('Build a hello world app in Rust');

    expect(task?.repositoryLabel).toBe('hello-world-rust');
    expect(task?.solutionIds).toEqual(['1', '2', '3', '4']);
  });

  test('falls back to a repository-like slug for normal task text', () => {
    expect(deriveSolutionTaskRepositoryLabel('Repository creation flow')).toBe('repository-creation-flow');
  });
});
