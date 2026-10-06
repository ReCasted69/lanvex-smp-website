// Section renderers — each section type maps to a render function that returns
// an HTML string. Renderers read from the config section object and global
// window.SiteConfig helpers. Content runs through renderInline (color tags + inline markdown).
(function() {
  'use strict';

  function icon(name, cls) {
    var svg = window.ICON_SVGS && window.ICON_SVGS[name];
    if (!svg) return '';
    if (cls) svg = svg.replace('<svg ', '<svg class="' + cls + '" ');
    return svg;
  }

  function inline(text) {
    return window.renderInline ? window.renderInline(text) : String(text == null ? '' : text);
  }

  function sectionHeader(title, subtitle) {
    var html = '<div class="section-header">';
    if (title) html += '<h2 class="section-title">' + inline(title) + '</h2>';
    if (subtitle) html += '<p class="section-desc">' + inline(subtitle) + '</p>';
    html += '</div>';
    return html;
  }

  function renderButton(btn) {
    var label = inline(btn.label || '');
    var ic = btn.icon ? icon(btn.icon, 'btn-icon') : '';
    var style = btn.style || 'glass';
    var cls = 'btn btn-' + style;
    if (btn.href) {
      return '<a class="' + cls + '" href="' + escapeHtmlAttr(btn.href) + '" target="_blank" rel="noopener noreferrer">' + ic + '<span>' + label + '</span></a>';
    }
    var action = btn.action || '';
    return '<button type="button" class="' + cls + '" data-action="' + escapeHtmlAttr(action) + '">' + ic + '<span>' + label + '</span></button>';
  }

  var types = {
    hero: function(section, ctx) {
      var s = ctx.site;
      var html = '<section id="' + escapeHtmlAttr(section.id) + '" class="section hero"><div class="hero-content">';
      if (section.showLogo && s.logo.big) {
        html += '<div class="hero-logo-wrap"><div class="hero-logo-pill">' +
          '<img class="hero-logo" src="' + escapeHtmlAttr(s.logo.big) + '" alt="' + escapeHtmlAttr(s.name) + '" loading="eager" fetchpriority="high" decoding="async">' +
          '</div></div>';
      }
      if (section.title) html += '<h1 class="hero-title">' + inline(section.title) + '</h1>';
      if (section.rotator && section.rotator.length) {
        html += '<p class="hero-subtitle">' + inline(section.rotator[0]) + '</p>';
      }
      if (section.body && section.body.length) {
        html += '<div class="hero-card glass-card">';
        section.body.forEach(function(p) { html += '<p class="hero-desc">' + inline(p) + '</p>'; });
        html += '</div>';
      }
      if (section.buttons && section.buttons.length) {
        html += '<div class="hero-actions">' + section.buttons.map(renderButton).join('') + '</div>';
      }
      html += '</div></section>';
      return html;
    },

    features: function(section) {
      var html = '<section id="' + escapeHtmlAttr(section.id) + '" class="section"><div class="section-inner">';
      html += sectionHeader(section.title, section.subtitle);
      var cols = section.columns || 3;
      html += '<div class="features-grid cols-' + cols + '">';
      (section.items || []).forEach(function(item) {
        html += '<div class="feature-card glass-card">' +
          '<div class="feature-icon">' + icon(item.icon) + '</div>' +
          '<h3 class="feature-title">' + inline(item.title) + '</h3>' +
          '<p class="feature-desc">' + inline(item.desc) + '</p>' +
          '</div>';
      });
      html += '</div></div></section>';
      return html;
    },

    stats: function(section) {
      var html = '<section id="' + escapeHtmlAttr(section.id) + '" class="section"><div class="section-inner">';
      if (section.title || section.subtitle) html += sectionHeader(section.title, section.subtitle);
      html += '<div class="stats-grid">';
      (section.items || []).forEach(function(item) {
        var value = item.value != null ? item.value : 0;
        html += '<div class="stat-card glass-card">' +
          '<span class="stat-value" data-count="' + value + '"' +
          (item.prefix ? ' data-count-prefix="' + escapeHtmlAttr(item.prefix) + '"' : '') +
          (item.suffix ? ' data-count-suffix="' + escapeHtmlAttr(item.suffix) + '"' : '') +
          '>' + value + (item.suffix || '') + '</span>' +
          '<span class="stat-label">' + inline(item.label) + '</span>' +
          '</div>';
      });
      html += '</div></div></section>';
      return html;
    },

    about: function(section) {
      var html = '<section id="' + escapeHtmlAttr(section.id) + '" class="section"><div class="section-inner">';
      html += sectionHeader(section.title, section.subtitle);
      html += '<div class="about-grid">';
      (section.items || []).forEach(function(item) {
        html += '<div class="about-card glass-card">' +
          '<div class="about-icon-box">' + icon(item.icon) + '</div>' +
          '<h3 class="feature-title">' + inline(item.title) + '</h3>' +
          '<p class="feature-desc">' + inline(item.desc) + '</p>' +
          '</div>';
      });
      if (section.rules && (section.rules.items || []).length) {
        html += '<div class="about-card about-card-full glass-card">' +
          '<div class="about-rules-header">' + icon('scroll') + '<h3 class="feature-title">' + inline(section.rules.title || 'Server Rules') + '</h3></div>' +
          '<div class="rules-grid">';
        section.rules.items.forEach(function(r, i) {
          html += '<div class="rule-item"><span class="rule-num">' + (i + 1) + '.</span> <span>' + inline(r) + '</span></div>';
        });
        html += '</div></div>';
      }
      html += '</div></div></section>';
      return html;
    },

    join: function(section, ctx) {
      var html = '<section id="' + escapeHtmlAttr(section.id) + '" class="section"><div class="section-inner section-inner-narrow">';
      html += sectionHeader(section.title, section.subtitle);
      html += '<div class="join-grid">';
      (section.steps || []).forEach(function(step, i) {
        html += '<div class="join-card glass-card">' +
          '<div class="join-num">' + (i + 1) + '</div>' +
          '<div class="join-icon-wrap">' + icon(step.icon) + '</div>' +
          '<h3 class="feature-title">' + inline(step.title) + '</h3>' +
          '<p class="feature-desc">' + inline(step.desc) + '</p>';
        if (step.link) {
          html += '<a class="join-link" href="' + escapeHtmlAttr(step.link) + '" target="_blank" rel="noopener noreferrer">' +
            inline(step.linkLabel || step.title) + ' ' + icon('external-link') + '</a>';
        }
        html += '</div>';
      });
      html += '</div>';
      if (section.ipCopy && ctx.site.serverIp) {
        html += '<div class="ip-copy-wrap glass-card">' +
          '<button type="button" class="ip-copy-btn" data-ip="' + escapeHtmlAttr(ctx.site.serverIp) + '">' +
          '<span class="ip-text">' + escapeHtmlAttr(ctx.site.serverIp) + '</span>' +
          '<span class="ip-copy-icon">' + icon('copy') + '</span>' +
          '</button></div>';
      }
      html += '</div></section>';
      return html;
    },

    faq: function(section) {
      var html = '<section id="' + escapeHtmlAttr(section.id) + '" class="section"><div class="section-inner section-inner-faq">';
      html += sectionHeader(section.title, section.subtitle);
      html += '<div class="faq-list">';
      (section.items || []).forEach(function(item) {
        html += '<div class="faq-item glass-card">' +
          '<button type="button" class="faq-btn" aria-expanded="false">' +
          '<span class="faq-question">' + inline(item.question) + '</span>' +
          icon('chevron-down', 'faq-chevron') +
          '</button>' +
          '<div class="faq-answer"><p>' + inline(item.answer) + '</p></div>' +
          '</div>';
      });
      html += '</div></div></section>';
      return html;
    },

    cta: function(section) {
      var html = '<section id="' + escapeHtmlAttr(section.id) + '" class="section"><div class="section-inner">';
      html += '<div class="cta-card glass-card">';
      if (section.title) html += '<h2 class="cta-title">' + inline(section.title) + '</h2>';
      if (section.desc) html += '<p class="cta-desc">' + inline(section.desc) + '</p>';
      if (section.buttons && section.buttons.length) {
        html += '<div class="cta-actions">' + section.buttons.map(renderButton).join('') + '</div>';
      }
      html += '</div></div></section>';
      return html;
    }
  };

  window.Sections = {
    types: types,
    render: function(section, ctx) {
      if (!section || section.enabled === false) return '';
      var fn = types[section.type];
      if (!fn) return '';
      return fn(section, ctx);
    }
  };
})();
