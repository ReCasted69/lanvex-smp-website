// Config orchestrator — loads data/config.json and applies it to the page:
// theme (CSS variables/fonts/radii), SEO meta, navigation, background, and
// the ordered list of sections (rendered via window.Sections).
(function() {
  'use strict';

  var COLOR_VARS = {
    primary: '--blue', primaryHover: '--blue-hover',
    accent: '--accent', accentHover: '--accent-hover',
    bgDark: '--bg-dark', bgCard: '--bg-card', bgNav: '--bg-nav',
    text: '--text', muted: '--muted',
    red: '--red', green: '--green', purple: '--purple', pink: '--pink',
    cyan: '--cyan', orange: '--orange', yellow: '--yellow', teal: '--teal',
    lime: '--lime', gray: '--gray', white: '--white'
  };

  function applyTheme(theme) {
    var root = document.documentElement;
    if (!theme) return;

    if (theme.colors) {
      Object.keys(COLOR_VARS).forEach(function(key) {
        if (theme.colors[key] != null) root.style.setProperty(COLOR_VARS[key], theme.colors[key]);
      });
    }
    if (theme.fonts) {
      if (theme.fonts.body) root.style.setProperty('--font-body', theme.fonts.body);
      if (theme.fonts.heading) root.style.setProperty('--font-heading', theme.fonts.heading);
    }
    if (theme.radii) {
      if (theme.radii.card) root.style.setProperty('--radius-card', theme.radii.card);
      if (theme.radii.pill) root.style.setProperty('--radius-pill', theme.radii.pill);
    }
    if (theme.motion === false) root.classList.add('motion-off');
  }

  function setMeta(attr, name, content) {
    var sel = attr === 'name' ? 'meta[name="' + name + '"]' : 'meta[property="' + name + '"]';
    var el = document.querySelector(sel);
    if (!el) {
      el = document.createElement('meta');
      el.setAttribute(attr, name);
      document.head.appendChild(el);
    }
    el.setAttribute('content', content);
  }

  function applySeo(seo, site) {
    if (!seo) return;
    if (seo.title) document.title = seo.title;
    var desc = seo.description || '';
    if (desc) {
      setMeta('name', 'description', desc);
      setMeta('property', 'og:description', desc);
      setMeta('name', 'twitter:description', desc);
    }
    var title = seo.title || (site.name + ' — Home');
    setMeta('property', 'og:title', title);
    setMeta('name', 'twitter:title', title);
    if (seo.image) {
      setMeta('property', 'og:image', seo.image);
      setMeta('name', 'twitter:image', seo.image);
    }
    if (seo.canonical) {
      var link = document.querySelector('link[rel="canonical"]');
      if (!link) {
        link = document.createElement('link');
        link.setAttribute('rel', 'canonical');
        document.head.appendChild(link);
      }
      link.setAttribute('href', seo.canonical);
    }
  }

  function applyFavicon(site) {
    if (!site.logo || !site.logo.favicon) return;
    var link = document.querySelector('link[rel="icon"]');
    if (link) link.href = site.logo.favicon;
  }

  function buildNav(sections, site) {
    var links = (sections || []).filter(function(s) { return s.nav && s.navLabel; });
    var html = links.map(function(s) {
      return '<a href="#' + escapeHtmlAttr(s.id) + '" class="nav-link">' + escapeHtmlAttr(s.navLabel) + '</a>';
    }).join('');

    var primary = document.getElementById('navLinksInner');
    var mobile = document.getElementById('mobileNavPrimary');
    if (primary) primary.innerHTML = html;
    if (mobile) mobile.innerHTML = html;

    // Branding
    document.querySelectorAll('[data-nav-logo]').forEach(function(img) {
      if (site.logo.sm) img.src = site.logo.sm;
      if (site.name) img.alt = site.name;
    });
    document.querySelectorAll('[data-nav-name]').forEach(function(el) {
      if (site.name) el.textContent = site.name;
    });

    // Support button
    document.querySelectorAll('[data-support-link]').forEach(function(a) {
      if (site.supportUrl) a.href = site.supportUrl;
    });
  }

  function applyFooter(site) {
    document.querySelectorAll('[data-footer-logo]').forEach(function(img) {
      if (site.logo.sm) img.src = site.logo.sm;
      if (site.name) img.alt = site.name;
    });
    document.querySelectorAll('[data-footer-name]').forEach(function(el) {
      if (site.name) el.textContent = site.name;
    });
    document.querySelectorAll('[data-footer-tagline]').forEach(function(el) {
      if (site.tagline) el.textContent = site.tagline;
    });
    document.querySelectorAll('[data-owner-email]').forEach(function(a) {
      if (site.ownerEmail) a.href = 'mailto:' + site.ownerEmail;
    });
    document.querySelectorAll('[data-copyright]').forEach(function(el) {
      if (site.copyright) {
        var text = String(site.copyright).replace('{year}', new Date().getFullYear());
        el.innerHTML = '&copy; ' + escH(text);
      }
    });
  }

  function applyBackground(site) {
    var bg = document.querySelector('[data-bg-image]');
    if (bg && site.background.image) bg.src = site.background.image;
    bg = document.querySelector('[data-bg-image]');
    if (bg) bg.style.opacity = '1';
    var overlay = document.querySelector('[data-bg-overlay]');
    if (overlay && site.background.overlay) overlay.style.background = site.background.overlay;
  }

  function render(cfg) {
    var page = document.getElementById('page');
    if (!page) return;
    var html = (cfg.sections || []).map(function(s) { return window.Sections.render(s, cfg); }).join('');
    page.innerHTML = html;
  }

  function boot() {
    if (!window.SiteConfig) return;
    window.SiteConfig.load()
      .then(function(cfg) {
        window.__config = cfg;

        applyTheme(cfg.theme);
        applySeo(cfg.seo, cfg.site);
        applyFavicon(cfg.site);
        buildNav(cfg.sections, cfg.site);
        applyFooter(cfg.site);
        applyBackground(cfg.site);
        render(cfg);

        // Expose the hero rotator phrases for the home page script.
        var hero = (cfg.sections || []).find(function(s) { return s.type === 'hero'; });
        window.__heroPhrases = hero && Array.isArray(hero.rotator) && hero.rotator.length
          ? hero.rotator.slice()
          : [];

        document.dispatchEvent(new Event('configReady'));
      })
      .catch(function(err) {
        // Config unavailable — keep the <noscript> fallback content.
        if (window.console && console.warn) console.warn('Config load failed:', err);
        document.dispatchEvent(new Event('configReady'));
      });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
