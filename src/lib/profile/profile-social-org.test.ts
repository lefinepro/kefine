import { describe, expect, it } from 'vitest';
import {
  DEFAULT_PROFILE_WIDGETS_ORG,
  buildProfileSocialOrg,
  parseProfileWidgetBlocks,
  type ProfileSocialOrgSource
} from './profile-social-org';

describe('parseProfileWidgetBlocks', () => {
  it('parses the issue shorthand block form', () => {
    const blocks = parseProfileWidgetBlocks('#+block weather Tokyo\n#+endblock');
    expect(blocks).toEqual([{ type: 'weather', query: 'Tokyo', id: 'widget-weather-1' }]);
  });

  it('parses org custom blocks with and without arguments', () => {
    const src = ['#+begin_weather', '#+end_weather', '#+begin_clock Yerevan', '#+end_clock'].join('\n');
    expect(parseProfileWidgetBlocks(src)).toEqual([
      { type: 'weather', query: '', id: 'widget-weather-1' },
      { type: 'clock', query: 'Yerevan', id: 'widget-clock-2' }
    ]);
  });

  it('parses dynamic blocks and the widget wrapper form', () => {
    expect(parseProfileWidgetBlocks('#+begin: weather London\n#+end:')).toEqual([
      { type: 'weather', query: 'London', id: 'widget-weather-1' }
    ]);
    expect(parseProfileWidgetBlocks('#+begin_widget clock\n#+end_widget')).toEqual([
      { type: 'clock', query: '', id: 'widget-clock-1' }
    ]);
  });

  it('resolves widget aliases (time -> clock, forecast -> weather)', () => {
    const src = ['#+begin_time', '#+end_time', '#+begin_forecast Paris', '#+end_forecast'].join('\n');
    expect(parseProfileWidgetBlocks(src).map((block) => block.type)).toEqual(['clock', 'weather']);
  });

  it('ignores unknown blocks and unterminated blocks', () => {
    const src = ['#+begin_src js', "console.log('x')", '#+end_src', '#+begin_weather'].join('\n');
    expect(parseProfileWidgetBlocks(src)).toEqual([]);
  });

  it('handles indentation and empty input', () => {
    expect(parseProfileWidgetBlocks('   #+begin_clock  \n   #+end_clock')).toEqual([
      { type: 'clock', query: '', id: 'widget-clock-1' }
    ]);
    expect(parseProfileWidgetBlocks('')).toEqual([]);
    expect(parseProfileWidgetBlocks(null)).toEqual([]);
  });

  it('parses the default widget document into a clock and a weather widget', () => {
    expect(parseProfileWidgetBlocks(DEFAULT_PROFILE_WIDGETS_ORG).map((block) => block.type)).toEqual([
      'clock',
      'weather'
    ]);
  });
});

describe('buildProfileSocialOrg', () => {
  const baseProfile: ProfileSocialOrgSource = {
    displayName: 'Ada Lovelace',
    primaryHandle: 'ada',
    bio: 'Building reliable\nsolver flows.',
    socialLinks: [
      { id: 'a', type: 'website', value: 'https://ada.example' },
      { id: 'b', type: 'github', value: 'https://github.com/ada' },
      { id: 'c', type: 'wallet', value: '0xABC123' }
    ]
  };

  it('emits org-social headers following the specification', () => {
    const org = buildProfileSocialOrg(baseProfile, { profileUrl: 'https://kefine.pro/@ada' });
    const lines = org.split('\n');
    expect(lines[0]).toBe('#+TITLE: Ada Lovelace');
    expect(lines[1]).toBe('#+NICK: ada');
    // Bio newlines are collapsed into a single DESCRIPTION header.
    expect(org).toContain('#+DESCRIPTION: Building reliable solver flows.');
    expect(org).toContain('#+LINK: https://kefine.pro/@ada');
    expect(org).toContain('#+LINK: https://ada.example');
    expect(org).toContain('#+LINK: https://github.com/ada');
    // Wallet links become contacts, not links.
    expect(org).toContain('#+CONTACT: 0xABC123');
    expect(org).not.toContain('#+LINK: 0xABC123');
    // A valid feed always carries a Posts heading.
    expect(org).toContain('* Posts');
    expect(org.endsWith('\n')).toBe(true);
  });

  it('falls back to the nick when no display name is present', () => {
    const org = buildProfileSocialOrg({
      displayName: '   ',
      primaryHandle: 'solver-bot',
      socialLinks: []
    });
    expect(org).toContain('#+TITLE: solver-bot');
    expect(org).toContain('#+NICK: solver-bot');
    expect(org).not.toContain('#+DESCRIPTION:');
  });

  it('embeds widget blocks under a Widgets section and round-trips them', () => {
    const org = buildProfileSocialOrg(
      { ...baseProfile, metadata: { widgetsOrg: '#+begin_clock Tokyo\n#+end_clock' } },
      {}
    );
    expect(org).toContain('* Widgets');
    expect(org).toContain('#+begin_clock Tokyo');
    expect(parseProfileWidgetBlocks(org)).toEqual([
      { type: 'clock', query: 'Tokyo', id: 'widget-clock-1' }
    ]);
  });

  it('prefers the widgetsOrg option over metadata', () => {
    const org = buildProfileSocialOrg(
      { ...baseProfile, metadata: { widgetsOrg: '#+begin_clock\n#+end_clock' } },
      { widgetsOrg: '#+begin_weather Berlin\n#+end_weather' }
    );
    expect(parseProfileWidgetBlocks(org)).toEqual([
      { type: 'weather', query: 'Berlin', id: 'widget-weather-1' }
    ]);
  });
});
