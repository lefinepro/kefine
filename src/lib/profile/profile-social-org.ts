/**
 * Org-social bridge for profiles.
 *
 * The profile screen is backed by an Org document in the spirit of
 * [org-social](https://github.com/tanrax/org-social): a single `social.org`
 * file whose `#+TITLE`/`#+NICK`/`#+DESCRIPTION`/`#+LINK`/`#+CONTACT` headers
 * describe the public identity. Owners can also drop interactive widget blocks
 * into the document — a weather forecast or a live clock — using Org block
 * syntax, and the profile renders them inline.
 *
 * This module keeps two concerns pure and testable:
 *
 * 1. `buildProfileSocialOrg` — generate a `social.org` document from a profile
 *    so it can be downloaded, copied, or pushed elsewhere.
 * 2. `parseProfileWidgetBlocks` — read the widget blocks back out of an Org
 *    document so the page can render them.
 */
import type { ProfileSocialLink } from '$lib/types/user';

/** Widget types that can be embedded in a profile's Org document. */
export type ProfileWidgetType = 'weather' | 'clock';

const WIDGET_TYPE_ALIASES: Readonly<Record<string, ProfileWidgetType>> = {
  weather: 'weather',
  forecast: 'weather',
  clock: 'clock',
  time: 'clock'
};

/** A single widget block parsed from an Org document. */
export interface ProfileWidgetBlock {
  /** Canonical widget id. */
  type: ProfileWidgetType;
  /**
   * Free-typed argument after the widget name, e.g. the city in
   * `#+begin_weather Tokyo`. Empty when the block uses the viewer's defaults
   * (local geolocation for weather, local clock for time).
   */
  query: string;
  /** Stable id derived from the type, query and order for `{#each}` keys. */
  id: string;
}

/**
 * Default widget document seeded for new owners. Uses the Org block form from
 * the issue (`#+begin_<widget> [place]` … `#+end_<widget>`); a bare block reads
 * the viewer's local data while an argument pins it to a place.
 */
export const DEFAULT_PROFILE_WIDGETS_ORG = `#+begin_clock
#+end_clock

#+begin_weather
#+end_weather`;

// Order matters: the `widget`/`block` wrappers and the dynamic-block form are
// tried before the generic `#+begin_<name>` rule so that `#+begin_widget
// weather` resolves to the `weather` widget rather than a block literally named
// `widget`.
const BEGIN_PATTERNS: readonly RegExp[] = [
  // Generic widget block: #+begin_widget weather Tokyo … #+end_widget
  /^#\+begin_widget[ \t]+(?<name>[a-z]+)\b[ \t]*(?<arg>.*)$/i,
  // Org dynamic blocks: #+begin: weather Tokyo … #+end:
  /^#\+begin:[ \t]+(?<name>[a-z]+)\b[ \t]*(?<arg>.*)$/i,
  // Issue shorthand: #+block weather Tokyo … #+endblock
  /^#\+block[ \t]+(?<name>[a-z]+)\b[ \t]*(?<arg>.*)$/i,
  // Org custom/special blocks: #+begin_weather Tokyo … #+end_weather
  /^#\+begin_(?<name>[a-z]+)\b[ \t]*(?<arg>.*)$/i
];

const END_PATTERN = /^#\+(?:end_[a-z]+|end:|endblock)/i;

function normalizeWidgetType(name: string): ProfileWidgetType | null {
  return WIDGET_TYPE_ALIASES[name.trim().toLowerCase()] ?? null;
}

function matchBegin(line: string): { name: string; arg: string } | null {
  for (const pattern of BEGIN_PATTERNS) {
    const match = pattern.exec(line);
    if (match?.groups?.name) {
      return { name: match.groups.name, arg: (match.groups.arg ?? '').trim() };
    }
  }

  return null;
}

/**
 * Extract every widget block from an Org document, in document order. Unknown
 * block names (e.g. `#+begin_src`) and unterminated blocks are ignored so the
 * parser never throws on arbitrary Org content.
 */
export function parseProfileWidgetBlocks(src: string | null | undefined): ProfileWidgetBlock[] {
  if (!src) {
    return [];
  }

  const blocks: ProfileWidgetBlock[] = [];
  const lines = src.split(/\r?\n/);
  let open: { type: ProfileWidgetType; query: string } | null = null;

  for (const raw of lines) {
    const line = raw.trim();

    if (open) {
      if (END_PATTERN.test(line)) {
        blocks.push({
          type: open.type,
          query: open.query,
          id: `widget-${open.type}-${blocks.length + 1}`
        });
        open = null;
      }
      continue;
    }

    const begin = matchBegin(line);
    if (!begin) {
      continue;
    }

    const type = normalizeWidgetType(begin.name);
    if (!type) {
      continue;
    }

    open = { type, query: begin.arg };
  }

  return blocks;
}

/** Structural subset of a profile needed to render `social.org`. */
export interface ProfileSocialOrgSource {
  displayName: string;
  primaryHandle: string;
  bio?: string;
  socialLinks: ProfileSocialLink[];
  avatarUrl?: string;
  metadata?: Record<string, unknown>;
}

/** Options that tune the generated `social.org` document. */
export interface BuildProfileSocialOrgOptions {
  /** Absolute or app-relative canonical URL of the profile, added as a LINK. */
  profileUrl?: string;
  /** Override the widget document; defaults to `metadata.widgetsOrg`. */
  widgetsOrg?: string;
}

function escapeHeaderValue(value: string): string {
  return value.replace(/\s+/g, ' ').trim();
}

function readWidgetsOrg(source: ProfileSocialOrgSource, options?: BuildProfileSocialOrgOptions): string {
  if (typeof options?.widgetsOrg === 'string') {
    return options.widgetsOrg;
  }

  const fromMetadata = source.metadata?.['widgetsOrg'];
  return typeof fromMetadata === 'string' ? fromMetadata : '';
}

/**
 * Render a profile as an org-social `social.org` document. The header block
 * follows the org-social specification; recognised widget blocks are appended
 * verbatim under a `* Widgets` section, and a `* Posts` heading is always
 * emitted so the file is a valid, ready-to-extend feed.
 */
export function buildProfileSocialOrg(
  source: ProfileSocialOrgSource,
  options?: BuildProfileSocialOrgOptions
): string {
  const nick = escapeHeaderValue(source.primaryHandle).replace(/\s+/g, '');
  const displayName = escapeHeaderValue(source.displayName) || nick;
  const lines: string[] = [];

  lines.push(`#+TITLE: ${displayName}`);
  lines.push(`#+NICK: ${nick}`);

  const description = source.bio ? escapeHeaderValue(source.bio) : '';
  if (description) {
    lines.push(`#+DESCRIPTION: ${description}`);
  }

  if (source.avatarUrl?.trim()) {
    lines.push(`#+AVATAR: ${source.avatarUrl.trim()}`);
  }

  if (options?.profileUrl?.trim()) {
    lines.push(`#+LINK: ${options.profileUrl.trim()}`);
  }

  const contacts: string[] = [];
  for (const link of source.socialLinks) {
    const value = link.value?.trim();
    if (!value) {
      continue;
    }

    if (link.type === 'wallet' || link.type === 'ens') {
      contacts.push(value);
    } else {
      lines.push(`#+LINK: ${value}`);
    }
  }

  for (const contact of contacts) {
    lines.push(`#+CONTACT: ${contact}`);
  }

  const widgetsOrg = readWidgetsOrg(source, options).trim();
  if (widgetsOrg) {
    lines.push('');
    lines.push('* Widgets');
    lines.push(widgetsOrg);
  }

  lines.push('');
  lines.push('* Posts');
  lines.push('');

  return `${lines.join('\n')}\n`;
}
