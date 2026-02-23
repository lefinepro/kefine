/**
 * Org mode processor — parses and serializes Org mode files
 * OKR-013.15 Task 5.15.1 / Task 5.15.2 / Task 5.15.3
 *
 * This module provides a lightweight Org mode parser that handles the
 * specific subset of Org syntax used by the OKR system.
 *
 * NOTE: For production use, install the uniorg suite:
 *   bun add uniorg-parse uniorg-stringify uniorg-rehype uniorg-extract-keywords unified
 *
 * This implementation provides a standalone parser that covers the core
 * OKR use cases without external dependencies.
 */

import type {
  OrgDocument,
  OrgHeadline,
  OrgKeyword,
  OrgPropertyDrawer,
  OrgProperty,
  OrgSection,
  OrgNode,
  OrgParagraph,
  OrgText,
  OrgFile
} from '../../types/org';

/**
 * Parse an Org mode file string into a structured representation
 * OKR-013.15 Task 5.15.2
 *
 * @param content - Raw Org file content
 */
export function parseOrgFile(content: string): OrgFile {
  const lines = content.split('\n');
  const keywords: Record<string, string> = {};
  const children: OrgNode[] = [];
  const headlines: OrgHeadline[] = [];

  let i = 0;

  while (i < lines.length) {
    const line = lines[i] ?? '';

    // Parse file-level keywords (#+KEY: value)
    const kwMatch = line.match(/^#\+(\w[\w-]*):\s*(.*)$/);
    if (kwMatch) {
      const key = kwMatch[1] ?? '';
      const value = kwMatch[2] ?? '';
      keywords[key.toUpperCase()] = value.trim();
      const kwNode: OrgKeyword = { type: 'keyword', key: key.toUpperCase(), value: value.trim() };
      children.push(kwNode);
      i++;
      continue;
    }

    // Parse headlines (* Title :tags:)
    const hlMatch = line.match(/^(\*+)\s+(.+)$/);
    if (hlMatch) {
      const stars = hlMatch[1] ?? '';
      const rest = hlMatch[2] ?? '';
      const level = stars.length;
      const { title, tags, todoKeyword, priority } = parseHeadlineTitle(rest);

      const headline: OrgHeadline = {
        type: 'headline',
        level,
        title,
        tags,
        todoKeyword,
        priority,
        children: []
      };

      // Parse headline children (next lines until same or higher level headline)
      i++;
      const sectionLines: string[] = [];
      while (i < lines.length) {
        const nextLine = lines[i] ?? '';
        const nextHl = nextLine.match(/^(\*+)\s/);
        if (nextHl) {
          const nextStars = nextHl[1] ?? '';
          if (nextStars.length <= level) break;
        }
        sectionLines.push(nextLine);
        i++;
      }

      if (sectionLines.length > 0) {
        const section = parseSectionContent(sectionLines);
        headline.children.push(section);
      }

      children.push(headline);
      headlines.push(headline);

      // Collect sub-headlines recursively
      collectHeadlines(headline, headlines);
      continue;
    }

    i++;
  }

  const ast: OrgDocument = { type: 'org-data', children };
  return { ast, keywords, headlines };
}

/**
 * Serialize an OrgDocument AST back to an Org mode string
 * OKR-013.15 Task 5.15.3
 *
 * @param ast - The OrgDocument AST to serialize
 */
export function serializeOrgFile(ast: OrgDocument): string {
  return ast.children.map((node) => serializeNode(node)).join('\n');
}

function serializeNode(node: OrgNode): string {
  switch (node.type) {
    case 'keyword': {
      const kw = node as OrgKeyword;
      return `#+${kw.key}: ${kw.value}`;
    }
    case 'headline': {
      const hl = node as OrgHeadline;
      const stars = '*'.repeat(hl.level);
      const todo = hl.todoKeyword ? `${hl.todoKeyword} ` : '';
      const prio = hl.priority ? `[#${hl.priority}] ` : '';
      const tags = hl.tags && hl.tags.length > 0 ? `  :${hl.tags.join(':')}:` : '';
      const titleLine = `${stars} ${todo}${prio}${hl.title}${tags}`;
      const childStr = hl.children.map((c) => serializeNode(c)).join('\n');
      return childStr ? `${titleLine}\n${childStr}` : titleLine;
    }
    case 'section': {
      const sec = node as OrgSection;
      return sec.children.map((c) => serializeNode(c)).join('\n');
    }
    case 'property-drawer': {
      const pd = node as OrgPropertyDrawer;
      const props = pd.children
        .map((p) => `  :${p.key}: ${p.value}`)
        .join('\n');
      return `:PROPERTIES:\n${props}\n:END:`;
    }
    case 'drawer': {
      const d = node as { type: string; name: string; children: OrgNode[] };
      const inner = d.children.map((c) => serializeNode(c)).join('\n');
      return `:${d.name}:\n${inner}\n:END:`;
    }
    case 'paragraph': {
      const para = node as OrgParagraph;
      return para.children.map((c) => serializeNode(c)).join('');
    }
    case 'text': {
      const t = node as OrgText;
      return t.value;
    }
    default:
      return '';
  }
}

// --- Helpers ---

function parseHeadlineTitle(rest: string): {
  title: string;
  tags: string[];
  todoKeyword?: string;
  priority?: string;
} {
  let remaining = rest.trim();
  const tags: string[] = [];

  // Extract trailing tags (:tag1:tag2:)
  const tagMatch = remaining.match(/\s+(:[\w:@#]+:)\s*$/);
  if (tagMatch) {
    const tagSection = tagMatch[1] ?? '';
    const rawTags = tagSection.slice(1, -1).split(':').filter(Boolean);
    tags.push(...rawTags);
    remaining = remaining.slice(0, remaining.length - (tagMatch[0] ?? '').length).trim();
  }

  // Extract TODO keyword
  let todoKeyword: string | undefined;
  const todoKeywords = ['TODO', 'DONE', 'IN-PROGRESS', 'CANCELLED', 'NEXT', 'WAITING'];
  for (const kw of todoKeywords) {
    if (remaining.startsWith(kw + ' ')) {
      todoKeyword = kw;
      remaining = remaining.slice(kw.length + 1).trim();
      break;
    }
  }

  // Extract priority [#A]
  let priority: string | undefined;
  const prioMatch = remaining.match(/^\[#([A-Z])\]\s*/);
  if (prioMatch) {
    priority = prioMatch[1];
    remaining = remaining.slice((prioMatch[0] ?? '').length);
  }

  return { title: remaining, tags, todoKeyword, priority };
}

function parseSectionContent(lines: string[]): OrgSection {
  const children: OrgNode[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i] ?? '';

    // Property drawer
    if (line.trim() === ':PROPERTIES:') {
      const { drawer, consumed } = parsePropertyDrawer(lines, i);
      children.push(drawer);
      i += consumed;
      continue;
    }

    // Named drawer (:NAME: ... :END:)
    const drawerMatch = line.trim().match(/^:(\w+):$/);
    if (drawerMatch && drawerMatch[1] !== 'END') {
      const drawerName = drawerMatch[1] ?? 'UNKNOWN';
      const { drawer, consumed } = parseNamedDrawer(lines, i, drawerName);
      children.push(drawer);
      i += consumed;
      continue;
    }

    // Paragraph text
    if (line.trim()) {
      const para: OrgParagraph = {
        type: 'paragraph',
        children: [{ type: 'text', value: line } as OrgText]
      };
      children.push(para);
    }

    i++;
  }

  return { type: 'section', children };
}

function parsePropertyDrawer(
  lines: string[],
  startIdx: number
): { drawer: OrgPropertyDrawer; consumed: number } {
  const properties: OrgProperty[] = [];
  let i = startIdx + 1; // skip :PROPERTIES:

  while (i < lines.length && (lines[i] ?? '').trim() !== ':END:') {
    const propMatch = (lines[i] ?? '').match(/^\s*:(\w[\w-]*):\s*(.*)$/);
    if (propMatch) {
      properties.push({
        type: 'node-property',
        key: propMatch[1] ?? '',
        value: (propMatch[2] ?? '').trim()
      });
    }
    i++;
  }

  const consumed = i - startIdx + 1; // +1 for :END:
  return {
    drawer: { type: 'property-drawer', children: properties },
    consumed
  };
}

function parseNamedDrawer(
  lines: string[],
  startIdx: number,
  name: string
): { drawer: { type: string; name: string; children: OrgNode[] }; consumed: number } {
  const children: OrgNode[] = [];
  let i = startIdx + 1;

  while (i < lines.length && (lines[i] ?? '').trim() !== ':END:') {
    children.push({ type: 'text', value: lines[i] ?? '' } as OrgText);
    i++;
  }

  const consumed = i - startIdx + 1;
  return { drawer: { type: 'drawer', name, children }, consumed };
}

function collectHeadlines(headline: OrgHeadline, accumulator: OrgHeadline[]): void {
  for (const child of headline.children) {
    if (child.type === 'section') {
      const section = child as OrgSection;
      for (const sectionChild of section.children) {
        if (sectionChild.type === 'headline') {
          accumulator.push(sectionChild as OrgHeadline);
          collectHeadlines(sectionChild as OrgHeadline, accumulator);
        }
      }
    }
  }
}
