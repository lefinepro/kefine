/**
 * Org mode headline extraction utilities
 * OKR-013.16 Task 5.16.1 / Task 5.16.2 / Task 5.16.3
 */

import type {
  OrgHeadline,
  OrgPropertyDrawer,
  OrgProperty,
  OrgNode,
  OrgSection,
  OrgDrawer,
  OrgLogbook,
  OrgAttachment,
  OrgClock
} from '../../types/org';
import {
  isOrgPropertyDrawer,
  isOrgSection,
  isOrgHeadline
} from '../../types/org';

/** Filters for findHeadlines */
export interface HeadlineFilter {
  /** Only return headlines at this level */
  level?: number;
  /** Only return headlines with all of these tags */
  tags?: string[];
  /** Only return headlines with this TODO keyword */
  todoKeyword?: string;
  /** Only return headlines where a property matches */
  property?: { key: string; value: string };
}

/**
 * Find headlines in an AST, optionally filtered
 * OKR-013.16 Task 5.16.1
 *
 * @param nodes - Array of AST nodes to search
 * @param filter - Optional filters
 * @param recursive - Whether to recurse into child sections (default: true)
 */
export function findHeadlines(
  nodes: OrgNode[],
  filter?: HeadlineFilter,
  recursive = true
): OrgHeadline[] {
  const results: OrgHeadline[] = [];

  for (const node of nodes) {
    if (isOrgHeadline(node)) {
      if (matchesFilter(node, filter)) {
        results.push(node);
      }
      if (recursive) {
        // Search within section children
        for (const child of node.children) {
          if (isOrgSection(child)) {
            results.push(...findHeadlines(child.children, filter, recursive));
          }
        }
      }
    } else if (isOrgSection(node)) {
      results.push(...findHeadlines(node.children, filter, recursive));
    }
  }

  return results;
}

function matchesFilter(headline: OrgHeadline, filter?: HeadlineFilter): boolean {
  if (!filter) return true;

  if (filter.level !== undefined && headline.level !== filter.level) return false;

  if (filter.tags && filter.tags.length > 0) {
    const headlineTags = headline.tags ?? [];
    if (!filter.tags.every((t) => headlineTags.includes(t))) return false;
  }

  if (filter.todoKeyword && headline.todoKeyword !== filter.todoKeyword) return false;

  if (filter.property) {
    const props = extractProperties(headline);
    if (props[filter.property.key] !== filter.property.value) return false;
  }

  return true;
}

/**
 * Extract the property drawer from a headline as a key-value map
 * OKR-013.16 Task 5.16.2
 *
 * @param headline - The headline to extract properties from
 */
export function extractProperties(headline: OrgHeadline): Record<string, string> {
  const drawer = findPropertyDrawer(headline);
  if (!drawer) return {};

  return Object.fromEntries(drawer.children.map((p: OrgProperty) => [p.key, p.value]));
}

/**
 * Find the PROPERTIES drawer in a headline's children
 */
function findPropertyDrawer(headline: OrgHeadline): OrgPropertyDrawer | null {
  for (const child of headline.children) {
    if (isOrgSection(child)) {
      for (const sectionChild of (child as OrgSection).children) {
        if (isOrgPropertyDrawer(sectionChild)) {
          return sectionChild;
        }
      }
    }
    if (isOrgPropertyDrawer(child)) {
      return child;
    }
  }
  return null;
}

/**
 * Extract tags from a headline
 * OKR-013.16 Task 5.16.3
 *
 * @param headline - The headline to extract tags from
 */
export function extractTags(headline: OrgHeadline): string[] {
  const tags = headline.tags ?? [];
  // Filter out special Org tags that are actually TODO states
  const todoKeywords = new Set(['TODO', 'DONE', 'IN-PROGRESS', 'CANCELLED', 'NEXT', 'WAITING']);
  return tags.filter((t) => !todoKeywords.has(t));
}

/**
 * Find a named drawer (e.g., LOGBOOK, Attachments) in a headline's section
 *
 * @param headline - The headline to search in
 * @param drawerName - Name of the drawer (case-insensitive)
 */
export function findDrawer(
  headline: OrgHeadline,
  drawerName: string
): OrgDrawer | null {
  const target = drawerName.toUpperCase();

  for (const child of headline.children) {
    if (isOrgSection(child)) {
      for (const sectionChild of (child as OrgSection).children) {
        if (
          sectionChild.type === 'drawer' &&
          (sectionChild as OrgDrawer).name.toUpperCase() === target
        ) {
          return sectionChild as OrgDrawer;
        }
      }
    }
  }
  return null;
}

/**
 * Extract LOGBOOK entries from a headline
 *
 * @param headline - The headline to extract logbook from
 */
export function extractLogbook(headline: OrgHeadline): OrgLogbook {
  const drawer = findDrawer(headline, 'LOGBOOK');
  const clocks: OrgClock[] = [];
  let totalMinutes = 0;
  const stateChanges: Array<{ from: string; to: string; timestamp: string }> = [];

  if (drawer) {
    for (const node of drawer.children) {
      if (node.type === 'text') {
        const text = (node as { type: string; value: string }).value;

        // Clock entries: CLOCK: [2026-01-01 Mon 10:00]--[2026-01-01 Mon 11:30] => 1:30
        const clockMatch = text.match(
          /CLOCK:\s*\[([^\]]+)\]--\[([^\]]+)\]\s*=>\s*(\d+):(\d+)/
        );
        if (clockMatch && clockMatch[3] && clockMatch[4]) {
          const hours = parseInt(clockMatch[3], 10);
          const minutes = parseInt(clockMatch[4], 10);
          totalMinutes += hours * 60 + minutes;
          clocks.push({ type: 'clock', value: text, duration: `${hours}:${minutes}` });
        }

        // State changes: - State "DONE" from "TODO" [timestamp]
        const stateMatch = text.match(
          /- State "(\w+)"\s+from\s+"(\w+)"\s+\[([^\]]+)\]/
        );
        if (stateMatch && stateMatch[1] && stateMatch[2] && stateMatch[3]) {
          stateChanges.push({
            to: stateMatch[1],
            from: stateMatch[2],
            timestamp: stateMatch[3]
          });
        }
      }
    }
  }

  return { clocks, totalMinutes, stateChanges };
}

/**
 * Extract attachments from an Attachments drawer
 *
 * @param headline - The headline to extract attachments from
 */
export function extractAttachments(headline: OrgHeadline): OrgAttachment[] {
  const drawer = findDrawer(headline, 'ATTACH') ?? findDrawer(headline, 'ATTACHMENTS');
  if (!drawer) return [];

  const attachments: OrgAttachment[] = [];

  for (const node of drawer.children) {
    if (node.type === 'text') {
      const text = (node as { type: string; value: string }).value.trim();

      // Org link: [[path][description]] or [[path]]
      const linkMatch = text.match(/\[\[([^\]]+)\](?:\[([^\]]*)\])?\]/);
      if (linkMatch && linkMatch[1]) {
        const path = linkMatch[1];
        const description = linkMatch[2];
        const type: OrgAttachment['type'] = path.startsWith('http') ? 'url' : path.startsWith('file:') ? 'file' : 'org-link';
        attachments.push({ path, description, type });
        continue;
      }

      // Plain path
      if (text && !text.startsWith('#')) {
        attachments.push({ path: text, type: 'file' });
      }
    }
  }

  return attachments;
}

/**
 * Get the text content of a headline's section (paragraphs, excluding drawers)
 *
 * @param headline - The headline to get content from
 */
export function getHeadlineContent(headline: OrgHeadline): string {
  const lines: string[] = [];

  for (const child of headline.children) {
    if (isOrgSection(child)) {
      for (const sectionChild of (child as OrgSection).children) {
        if (sectionChild.type === 'paragraph') {
          const para = sectionChild as { type: string; children: Array<{ type: string; value: string }> };
          lines.push(para.children.map((t) => t.value).join(''));
        }
      }
    }
  }

  return lines.join('\n').trim();
}
