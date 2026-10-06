// Site configuration loader — schema defaults, validation and normalization.
// Fetches data/config.json, deep-merges with defaults, and exposes the result
// via window.SiteConfig plus a "configReady" event once applied to the DOM.
(function() {
  'use strict';

  var DEFAULTS = {
    site: {
      name: 'LANVEX',
      tagline: '',
      serverIp: '',
      logo: { sm: '', big: '', favicon: '' },
      background: { image: '', overlay: 'rgba(10, 13, 24, 0.72)' },
      discordUrl: '',
      supportUrl: '',
      ownerEmail: '',
      copyright: ''
    },
    theme: {
      colors: {
        primary: '#3A6FFF', primaryHover: '#2b5fef',
        accent: '#B255D5', accentHover: '#9E3FB8',
        bgDark: '#0a0d18', bgCard: '#141826', bgNav: '#0f121e',
        text: '#ffffff', muted: 'rgba(255, 255, 255, 0.65)'
      },
      fonts: {
        body: "'Inter', ui-sans-serif, system-ui, -apple-system, sans-serif",
        heading: "'Montserrat', ui-sans-serif, system-ui, sans-serif"
      },
      radii: { card: '1rem', pill: '999px' },
      motion: true
    },
    seo: {
      title: 'LANVEX — Home', description: '', canonical: '', image: '',
      locale: 'en_US', twitterCard: 'summary_large_image'
    },
    status: {
      endpoint: 'https://api.mcstatus.io/v2/status/java/{ip}',
      ip: '', refreshSeconds: 60, showPlayers: true, showVersion: false
    },
    sections: []
  };

  function isPlainObject(v) {
    return Object.prototype.toString.call(v) === '[object Object]';
  }

  function deepMerge(base, override) {
    var out = {};
    var key;
    for (key in base) {
      if (Object.prototype.hasOwnProperty.call(base, key)) out[key] = base[key];
    }
    for (key in override) {
      if (!Object.prototype.hasOwnProperty.call(override, key)) continue;
      var b = base[key];
      var o = override[key];
      if (isPlainObject(b) && isPlainObject(o)) {
        out[key] = deepMerge(b, o);
      } else if (Array.isArray(b) && Array.isArray(o)) {
        out[key] = o;
      } else {
        out[key] = o;
      }
    }
    return out;
  }

  function normalizeSection(s) {
    if (!s || typeof s.type !== 'string') return null;
    var out = { id: s.id || '', type: s.type, nav: !!s.nav, navLabel: s.navLabel || '', enabled: s.enabled !== false };
    // Copy remaining props verbatim (renderers validate their own fields).
    for (var k in s) {
      if (Object.prototype.hasOwnProperty.call(s, k) && !(k in out)) out[k] = s[k];
    }
    return out;
  }

  function validate(cfg) {
    var problems = [];
    if (!cfg.sections || !Array.isArray(cfg.sections)) {
      problems.push('sections must be an array');
    }
    return problems;
  }

  function load() {
    return fetch('data/config.json')
      .then(function(res) {
        if (!res.ok) throw new Error('config.json not found (' + res.status + ')');
        return res.json();
      })
      .then(function(raw) {
        var cfg = deepMerge(DEFAULTS, raw);
        if (Array.isArray(raw && raw.sections)) {
          cfg.sections = raw.sections.map(normalizeSection).filter(Boolean);
        }
        return cfg;
      });
  }

  window.SiteConfig = {
    DEFAULTS: DEFAULTS,
    load: load,
    validate: validate,
    merge: deepMerge
  };
})();
