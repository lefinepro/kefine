<script lang="ts">
  import type { OKRLink, Objective, KeyResult, Quarter } from '$lib/types/okr';

  interface Props {
    link: OKRLink;
    objective?: Objective;
    keyResult?: KeyResult;
    onclick?: (link: OKRLink) => void;
  }

  let { link, objective, keyResult, onclick }: Props = $props();

  /** Quarter-based seasonal colors */
  function getQuarterColor(quarter: Quarter): string {
    switch (quarter) {
      case 'Q1': return '#22c55e'; // spring — green
      case 'Q2': return '#f59e0b'; // summer — amber
      case 'Q3': return '#f97316'; // autumn — orange
      case 'Q4': return '#3b82f6'; // winter — blue
      default:   return '#6b7280';
    }
  }

  const quarter = $derived(objective?.quarter ?? null);
  const color = $derived(quarter ? getQuarterColor(quarter) : '#6b7280');

  const label = $derived(
    link.linkType === 'keyresult' && keyResult
      ? keyResult.title
      : (objective?.title ?? 'Unknown OKR')
  );

  const sublabel = $derived(
    link.linkType === 'keyresult'
      ? (objective ? `${objective.quarter} ${objective.year}` : 'Key Result')
      : (objective ? `${objective.quarter} ${objective.year}` : '')
  );

  const typeLabel = $derived(link.linkType === 'keyresult' ? 'KR' : 'OKR');

  function handleClick() {
    onclick?.(link);
  }
</script>

{#if onclick}
  <button
    type="button"
    class="okr-badge-btn"
    style="--badge-color: {color}"
    title="{typeLabel}: {label}{sublabel ? ' · ' + sublabel : ''}"
    onclick={handleClick}
  >
    <okr-badge-type>{typeLabel}</okr-badge-type>
    <okr-badge-label>{label}</okr-badge-label>
    {#if sublabel}
      <okr-badge-quarter>{sublabel}</okr-badge-quarter>
    {/if}
  </button>
{:else}
  <okr-badge
    style="--badge-color: {color}"
    title="{typeLabel}: {label}{sublabel ? ' · ' + sublabel : ''}"
  >
    <okr-badge-type>{typeLabel}</okr-badge-type>
    <okr-badge-label>{label}</okr-badge-label>
    {#if sublabel}
      <okr-badge-quarter>{sublabel}</okr-badge-quarter>
    {/if}
  </okr-badge>
{/if}

<style>
  okr-badge,
  .okr-badge-btn {
    display: inline-flex;
    align-items: center;
    gap: 0.25rem;
    padding: 0.15rem 0.5rem;
    border-radius: 9999px;
    background: color-mix(in srgb, var(--badge-color) 12%, white);
    border: 1px solid color-mix(in srgb, var(--badge-color) 30%, transparent);
    color: var(--badge-color);
    font-size: 0.75rem;
    font-weight: 600;
    white-space: nowrap;
    max-width: 180px;
    overflow: hidden;
    vertical-align: middle;
    font-family: inherit;
    line-height: inherit;
    cursor: default;
  }

  .okr-badge-btn {
    cursor: pointer;
    transition: background 150ms;
  }

  .okr-badge-btn:hover {
    background: color-mix(in srgb, var(--badge-color) 22%, white);
  }

  okr-badge-type {
    display: inline;
    font-size: 0.65rem;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    opacity: 0.75;
    flex-shrink: 0;
  }

  okr-badge-label {
    display: inline;
    overflow: hidden;
    text-overflow: ellipsis;
    flex: 1;
    min-width: 0;
  }

  okr-badge-quarter {
    display: inline;
    font-size: 0.65rem;
    opacity: 0.7;
    flex-shrink: 0;
  }
</style>
