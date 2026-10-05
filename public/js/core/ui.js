// Global UI micro-interactions — scroll reveal, card shine, count-up numbers, bg parallax
// Loaded on every page via base.html. Guards against reduced-motion and double-init.

(function() {
  'use strict';

  if (document.documentElement.classList.contains('ui-ready')) return;
  document.documentElement.classList.add('ui-ready');

  var prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Cards that get scroll-reveal + shine. Homepage cards (.feature-card/.about-card/.join-card/.faq-item)
  // are animated by home.js, so they are excluded here.
  var CARD_SELECTORS = [
    '.admin-card', '.panel-card', '.settings-card', '.stat-card',
    '.lb-card', '.hof-card', '.kb-card',
    '.test-card', '.test-item', '.proj-card', '.ist-card', '.standing-item-content', '.standing-hero',
    '.appeal-timeline-item', '.fame-card', '.achievement-card', '.welcome-box',
    '.dash-card', '.ss-card'
  ];

  function collectCards() {
    var seen = [];
    var cards = [];
    CARD_SELECTORS.forEach(function(sel) {
      Array.prototype.forEach.call(document.querySelectorAll(sel), function(el) {
        if (el.closest('#home') || el.classList.contains('reveal') || el.classList.contains('visible')) return;
        if (el.classList.contains('ui-card')) return;
        if (seen.indexOf(el) !== -1) return;
        seen.push(el);
        cards.push(el);
      });
    });
    return cards;
  }

  function initScrollReveal() {
    if (prefersReducedMotion) return;
    var cards = collectCards();
    if (!cards.length) return;

    var revealed = 0;
    cards.forEach(function(el) {
      el.classList.add('ui-card');
      el.style.opacity = '0';
      el.style.transform = 'translateY(18px)';
      el.style.transition = 'opacity 0.55s var(--anim-ease-out), transform 0.55s var(--anim-ease-out)';
    });

    var observer = new IntersectionObserver(function(entries) {
      entries.forEach(function(entry) {
        if (!entry.isIntersecting) return;
        var el = entry.target;
        var delay = Math.min(revealed * 0.05, 0.5);
        el.style.transitionDelay = delay + 's';
        el.style.opacity = '1';
        el.style.transform = 'translateY(0)';
        observer.unobserve(el);
        revealed++;
      });
    }, { threshold: 0.08, rootMargin: '0px 0px -30px 0px' });

    cards.forEach(function(el) { observer.observe(el); });
  }

  function initCardShine() {
    var cards = collectCards();
    cards.forEach(function(el) {
      if (!el.classList.contains('card-shine') && !el.classList.contains('tilt-card')) {
        el.classList.add('card-shine');
      }
    });
  }

  // Count-up helper — exposed globally for page scripts
  window.animateNumber = function(el, target, opts) {
    opts = opts || {};
    var duration = opts.duration || 1200;
    var prefix = opts.prefix || '';
    var suffix = opts.suffix || '';
    var decimals = opts.decimals != null ? opts.decimals : (Math.round(target * 10) % 10 !== 0 ? 1 : 0);

    function fmt(v) {
      return prefix + v.toLocaleString(undefined, { minimumFractionDigits: decimals, maximumFractionDigits: decimals }) + suffix;
    }

    if (prefersReducedMotion) {
      el.textContent = fmt(target);
      return;
    }

    var startTime = null;
    function step(ts) {
      if (startTime === null) startTime = ts;
      var p = Math.min(1, (ts - startTime) / duration);
      var eased = 1 - Math.pow(1 - p, 3);
      el.textContent = fmt(target * eased);
      if (p < 1) requestAnimationFrame(step);
    }
    el.textContent = fmt(0);
    requestAnimationFrame(step);
  };

  function initCountUp() {
    var targets = document.querySelectorAll('[data-count]');
    if (!targets.length) return;

    var observer = new IntersectionObserver(function(entries) {
      entries.forEach(function(entry) {
        if (!entry.isIntersecting) return;
        var el = entry.target;
        var target = parseFloat(el.getAttribute('data-count'));
        if (isNaN(target)) return;
        window.animateNumber(el, target, {
          prefix: el.getAttribute('data-count-prefix') || '',
          suffix: el.getAttribute('data-count-suffix') || '',
          decimals: parseInt(el.getAttribute('data-count-decimals') || '0', 10)
        });
        observer.unobserve(el);
      });
    }, { threshold: 0.4 });

    targets.forEach(function(el) { observer.observe(el); });
  }

  // Background is intentionally stationary (no parallax).

  function init() {
    initScrollReveal();
    initCardShine();
    initCountUp();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();