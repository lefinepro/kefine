/**
 * Org mode type definitions for uniorg AST nodes
 * Based on uniorg parser: https://github.com/rasendubi/uniorg
 * OKR-013.2 Task 1.2.3
 */

/** Base node interface for all uniorg AST nodes */
export interface OrgNode {
  type: string;
}

/** Property key-value pair from a property drawer */
export interface OrgProperty extends OrgNode {
  type: 'node-property';
  key: string;
  value: string;
}

/** Property drawer (`:PROPERTIES:` ... `:END:`) */
export interface OrgPropertyDrawer extends OrgNode {
  type: 'property-drawer';
  children: OrgProperty[];
}

/** Generic drawer (`:NAME:` ... `:END:`) */
export interface OrgDrawer extends OrgNode {
  type: 'drawer';
  name: string;
  children: OrgNode[];
}

/** Org headline */
export interface OrgHeadline extends OrgNode {
  type: 'headline';
  level: number;
  /** The headline title text */
  title: string;
  /** Org-mode tags (e.g., `:tag1:tag2:`) */
  tags?: string[];
  /** TODO keyword (e.g., TODO, DONE, IN-PROGRESS) */
  todoKeyword?: string;
  /** Priority (e.g., [#A]) */
  priority?: string;
  /** Whether the headline is commented */
  commented?: boolean;
  /** Whether the headline is archived */
  archived?: boolean;
  /** Child nodes (drawers, paragraphs, subheadlines, etc.) */
  children: OrgNode[];
}

/** Org keyword (e.g., `#+TITLE: My Title`) */
export interface OrgKeyword extends OrgNode {
  type: 'keyword';
  key: string;
  value: string;
}

/** Org section — container for elements under a headline */
export interface OrgSection extends OrgNode {
  type: 'section';
  children: OrgNode[];
}

/** Org paragraph */
export interface OrgParagraph extends OrgNode {
  type: 'paragraph';
  children: OrgNode[];
}

/** Org text element */
export interface OrgText extends OrgNode {
  type: 'text';
  value: string;
}

/** Org link element */
export interface OrgLink extends OrgNode {
  type: 'link';
  path: string;
  description?: string;
}

/** Org plain list */
export interface OrgList extends OrgNode {
  type: 'plain-list';
  listType: 'unordered' | 'ordered' | 'descriptive';
  children: OrgListItem[];
}

/** Org list item */
export interface OrgListItem extends OrgNode {
  type: 'list-item';
  bullet: string;
  checkbox?: 'on' | 'off' | 'trans';
  tag?: string;
  children: OrgNode[];
}

/** Clock entry from a logbook */
export interface OrgClock extends OrgNode {
  type: 'clock';
  value: string;
  duration?: string;
}

/** Org document root */
export interface OrgDocument extends OrgNode {
  type: 'org-data';
  children: OrgNode[];
}

/**
 * Parsed Org file result — includes the AST and extracted metadata
 */
export interface OrgFile {
  /** The full uniorg AST */
  ast: OrgDocument;
  /** File-level keywords (#+TITLE, #+DATE, etc.) */
  keywords: Record<string, string>;
  /** All headlines in the document (flattened) */
  headlines: OrgHeadline[];
}

/**
 * Parsed logbook from a headline's LOGBOOK drawer
 */
export interface OrgLogbook {
  /** Raw clock entries */
  clocks: OrgClock[];
  /** Total time tracked (in minutes) */
  totalMinutes: number;
  /** State changes recorded in the logbook */
  stateChanges: Array<{ from: string; to: string; timestamp: string }>;
}

/**
 * Parsed attachment from an Attachments drawer
 */
export interface OrgAttachment {
  /** File path or URL */
  path: string;
  /** Optional description */
  description?: string;
  /** Attachment type derived from path */
  type: 'file' | 'url' | 'org-link';
}

// --- Type guards ---

export function isOrgHeadline(node: OrgNode): node is OrgHeadline {
  return node.type === 'headline';
}

export function isOrgKeyword(node: OrgNode): node is OrgKeyword {
  return node.type === 'keyword';
}

export function isOrgPropertyDrawer(node: OrgNode): node is OrgPropertyDrawer {
  return node.type === 'property-drawer';
}

export function isOrgDrawer(node: OrgNode): node is OrgDrawer {
  return node.type === 'drawer';
}

export function isOrgProperty(node: OrgNode): node is OrgProperty {
  return node.type === 'node-property';
}

export function isOrgSection(node: OrgNode): node is OrgSection {
  return node.type === 'section';
}

export function isOrgDocument(node: OrgNode): node is OrgDocument {
  return node.type === 'org-data';
}
