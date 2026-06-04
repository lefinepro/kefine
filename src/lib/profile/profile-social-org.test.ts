import { describe, expect, it } from 'vitest';
import {
  DEFAULT_PROFILE_WIDGETS_ORG,
  PROFILE_WIDGET_DEFINITIONS,
  buildProfileSocialOrg,
  describeProfileWidget,
  parseProfileWidgetBlocks,
  type ProfileSocialOrgSource
} from './profile-social-org';

describe('profile widget definitions', () => {
  it('models every widget as a typed ActivityStreams Page object', () => {
    for (const type of ['clock', 'weather', 'translate', 'music', 'proxy'] as const) {
      const definition = describeProfileWidget(type);
      expect(definition.type).toBe(type);
      // The embedded widget is a Page per the ActivityStreams 2.0 vocabulary.
      expect(definition.objectType).toBe('Page');
      expect(definition.label).toBeTruthy();
      expect(definition.keyword).toBe(type);
    }
  });

  it('exposes a definition for each parsed widget type', () => {
    for (const block of parseProfileWidgetBlocks(DEFAULT_PROFILE_WIDGETS_ORG)) {
      expect(PROFILE_WIDGET_DEFINITIONS[block.type]).toBe(describeProfileWidget(block.type));
    }
  });
});

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

  it('resolves the returned widget aliases (translator, track, vpn)', () => {
    const src = [
      '#+begin_translator en es',
      '#+end_translator',
      '#+begin_track',
      '#+end_track',
      '#+begin_vpn',
      '#+end_vpn'
    ].join('\n');
    expect(parseProfileWidgetBlocks(src)).toEqual([
      { type: 'translate', query: 'en es', id: 'widget-translate-1' },
      { type: 'music', query: '', id: 'widget-music-2' },
      { type: 'proxy', query: '', id: 'widget-proxy-3' }
    ]);
  });

  it('accepts the place on a body line when the header carries no argument', () => {
    const src = ['#+begin_clock', 'Tokyo', '#+end_clock'].join('\n');
    expect(parseProfileWidgetBlocks(src)).toEqual([
      { type: 'clock', query: 'Tokyo', id: 'widget-clock-1' }
    ]);
  });

  it('prefers the header argument over body lines', () => {
    const src = ['#+begin_clock Berlin', 'Tokyo', '#+end_clock'].join('\n');
    expect(parseProfileWidgetBlocks(src)).toEqual([
      { type: 'clock', query: 'Berlin', id: 'widget-clock-1' }
    ]);
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

  it('parses the default widget document into all returned widgets', () => {
    expect(parseProfileWidgetBlocks(DEFAULT_PROFILE_WIDGETS_ORG).map((block) => block.type)).toEqual([
      'clock',
      'weather',
      'translate',
      'music',
      'proxy'
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
