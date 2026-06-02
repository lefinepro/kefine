/**
 * Lightweight Org-mode reader for the repository docs surfaced on the solvers
 * screen. The repository carries two Org files that drive the screen by default:
 *
 * - `repo-docs/readme.org` — the README shown at the top. It holds the project
 *   settings, folder layout, demonstration links and a `Brief` section.
 * - `repo-docs/todo.org` — the TODO list stored and rendered below the README.
 *
 * These replace the earlier `.meta/issues/brief.org` idea: the brief now lives
 * inside the README, and the tasks live in the TODO file, both on the repo.
 */
import readmeOrg from './repo-docs/readme.org?raw';
import todoOrg from './repo-docs/todo.org?raw';

/** A parsed Org link, either `[[url][label]]` or a bare URL. */
export interface OrgLink {
  label: string;
  url: string;
}

/** A `- key :: value` definition-list entry inside a section. */
export interface OrgSetting {
  key: string;
  value: string;
}

/** A top-level `* Heading` section with its parsed body. */
export interface OrgSection {
  /** Lower-cased, trimmed heading used as a stable id, e.g. `folder-layout`. */
  id: string;
  title: string;
  /** Plain prose lines of the section (bullets and key/value pairs removed). */
  text: string[];
  /** `- key :: value` pairs, e.g. settings or the folder layout. */
  settings: OrgSetting[];
  /** Bullet items that are not key/value pairs, e.g. demonstration links. */
  items: string[];
  /** All links found anywhere in the section. */
  links: OrgLink[];
}

/** The parsed README document. */
export interface OrgReadme {
  title: string;
  /** Convenience accessor for the prose of the `Brief` section. */
  brief: string;
  sections: OrgSection[];
}

export type OrgTodoState = 'TODO' | 'DONE';

/** A single `* TODO`/`* DONE` task from the TODO file. */
export interface OrgTodo {
  id: string;
  state: OrgTodoState;
  title: string;
  done: boolean;
}

const LINK_RE = /\[\[([^\]]+)\]\[([^\]]+)\]\]|(https?:\/\/\S+)/g;

function sectionId(title: string): string {
  return title
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/** Extract every Org/bare link from a line of text. */
export function parseOrgLinks(line: string): OrgLink[] {
  const links: OrgLink[] = [];
  for (const match of line.matchAll(LINK_RE)) {
    if (match[1] && match[2]) {
      links.push({ url: match[1].trim(), label: match[2].trim() });
    } else if (match[3]) {
      const url = match[3].trim();
      links.push({ url, label: url });
    }
  }
  return links;
}

/** Strip Org link markup down to its human label for plain-text rendering. */
function stripLinks(line: string): string {
  return line.replace(/\[\[([^\]]+)\]\[([^\]]+)\]\]/g, '$2');
}

/** Parse the README Org document into a title and structured sections. */
export function parseOrgReadme(src: string): OrgReadme {
  const lines = src.split(/\r?\n/);
  let title = '';
  const sections: OrgSection[] = [];
  let current: OrgSection | null = null;

  for (const raw of lines) {
    const line = raw.replace(/\s+$/, '');
    const titleMatch = line.match(/^#\+TITLE:\s*(.*)$/i);
    if (titleMatch) {
      title = titleMatch[1].trim();
      continue;
    }

    const headingMatch = line.match(/^\*+\s+(.*)$/);
    if (headingMatch) {
      const heading = headingMatch[1].trim();
      current = {
        id: sectionId(heading),
        title: heading,
        text: [],
        settings: [],
        items: [],
        links: []
      };
      sections.push(current);
      continue;
    }

    if (!current) continue;
    const content = line.trim();
    if (!content) continue;

    current.links.push(...parseOrgLinks(content));

    const bullet = content.match(/^[-+*]\s+(.*)$/);
    if (bullet) {
      const item = bullet[1].trim();
      const kv = item.match(/^(.*?)\s*::\s*(.*)$/);
      if (kv) {
        current.settings.push({ key: kv[1].trim(), value: stripLinks(kv[2].trim()) });
      } else {
        current.items.push(stripLinks(item));
      }
      continue;
    }

    current.text.push(stripLinks(content));
  }

  const briefSection = sections.find((section) => section.id === 'brief');
  const brief = briefSection ? briefSection.text.join(' ') : '';

  return { title, brief, sections };
}

/** Parse the TODO Org document into an ordered list of tasks. */
export function parseOrgTodos(src: string): OrgTodo[] {
  const todos: OrgTodo[] = [];
  for (const raw of src.split(/\r?\n/)) {
    const match = raw.match(/^\*+\s+(TODO|DONE)\s+(.*)$/);
    if (!match) continue;
    const state = match[1] as OrgTodoState;
    todos.push({
      id: `todo-${todos.length + 1}`,
      state,
      title: match[2].trim(),
      done: state === 'DONE'
    });
  }
  return todos;
}

/** The README parsed from the repository's `readme.org`. */
export const repoReadme: OrgReadme = parseOrgReadme(readmeOrg);

/** The TODO list parsed from the repository's `todo.org`. */
export const repoTodos: OrgTodo[] = parseOrgTodos(todoOrg);
