// Home page interactions — generic and section-agnostic. Wires up the rendered
// sections (FAQ accordion, smooth scroll, scroll spy, card reveal, hero rotator,
// spotlight, IP copy, server status, count-up is handled by ui.js).
(function() {
  'use strict';

  var prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  function reduced() {
    return prefersReducedMotion || document.documentElement.classList.contains('motion-off');
  }

  function initFAQ() {
    document.addEventListener('click', function(e) {
      var btn = e.target.closest('.faq-btn');
      if (!btn) return;
      var item = btn.closest('.faq-item');
      var isOpen = item.classList.contains('open');
      document.querySelectorAll('.faq-item.open').forEach(function(openItem) {
        if (openItem !== item) {
          openItem.classList.remove('open');
          openItem.querySelector('.faq-btn').setAttribute('aria-expanded', 'false');
        }
      });
      item.classList.toggle('open');
      btn.setAttribute('aria-expanded', String(!isOpen));
    });
  }

  function scrollToHash(hash) {
    var target = document.querySelector(hash);
    if (target) target.scrollIntoView({ behavior: reduced() ? 'auto' : 'smooth' });
  }

  function initSmoothScroll() {
    document.addEventListener('click', function(e) {
      var anchor = e.target.closest('a[href^="#"]');
      if (!anchor) return;
      var href = anchor.getAttribute('href');
      if (href === '#') return;
      if (document.querySelector(href)) {
        e.preventDefault();
        scrollToHash(href);
      }
    });
  }

  // Buttons with data-action="#id" scroll to that section.
  function initActions() {
    document.addEventListener('click', function(e) {
      var btn = e.target.closest('[data-action]');
      if (!btn) return;
      var action = btn.getAttribute('data-action');
      if (action && action.charAt(0) === '#') scrollToHash(action);
    });
  }

  function initScrollSpy() {
    if (reduced()) return;
    var blob = document.getElementById('navBlob');
    var navLinks = document.getElementById('navPrimary');
    if (!blob || !navLinks) return;

    var links = Array.prototype.slice.call(navLinks.querySelectorAll('.nav-link'));
    var sections = links.map(function(l) {
      return document.querySelector(l.getAttribute('href'));
    }).filter(Boolean);

    function move(link) {
      if (!link) { blob.style.opacity = '0'; return; }
      var linkRect = link.getBoundingClientRect();
      var navRect = navLinks.getBoundingClientRect();
      blob.style.transform = 'translateX(' + (linkRect.left - navRect.left) + 'px)';
      blob.style.width = linkRect.width + 'px';
      blob.style.opacity = '1';
    }

    var activeIndex = -1;
    var observer = new IntersectionObserver(function(entries) {
      var best = -1, bestRatio = 0;
      entries.forEach(function(entry) {
        if (entry.isIntersecting && entry.intersectionRatio > bestRatio) {
          bestRatio = entry.intersectionRatio;
          best = sections.indexOf(entry.target);
        }
      });
      if (best !== -1 && best !== activeIndex) {
        activeIndex = best;
        move(links[best]);
      }
    }, { threshold: [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1], rootMargin: '-80px 0px -50% 0px' });

    sections.forEach(function(s) { observer.observe(s); });
    window.addEventListener('resize', function() {
      if (activeIndex !== -1) move(links[activeIndex]);
    });
  }

  function initCardReveal() {
    if (reduced() || !('IntersectionObserver' in window)) return;
    var revealEls = [];
    document.querySelectorAll('.features-grid, .about-grid, .join-grid, .faq-list, .rules-grid, .stats-grid').forEach(function(grid) {
      Array.prototype.forEach.call(grid.children, function(card) {
        if (card.classList.contains('reveal-in') || card.classList.contains('visible')) return;
        revealEls.push(card);
      });
    });
    if (!revealEls.length) return;

    revealEls.forEach(function(card) { card.classList.add('reveal-in'); });

    var revealed = 0;
    var observer = new IntersectionObserver(function(entries) {
      entries.forEach(function(entry) {
        if (!entry.isIntersecting) return;
        var el = entry.target;
        el.style.transitionDelay = Math.min(revealed * 0.05, 0.4) + 's';
        el.classList.add('visible');
        var cleanup = function() {
          el.classList.remove('reveal-in');
          el.classList.remove('visible');
          el.style.transitionDelay = '';
          observer.unobserve(el);
        };
        var fallback = setTimeout(cleanup, 1400);
        el.addEventListener('transitionend', function(e) {
          if (e.propertyName !== 'opacity') return;
          clearTimeout(fallback);
          cleanup();
        });
        revealed++;
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

    revealEls.forEach(function(card) { observer.observe(card); });
  }

  function initHeroRotator() {
    if (reduced()) return;
    var subtitle = document.querySelector('.hero-subtitle');
    if (!subtitle) return;
    var phrases = (window.__heroPhrases && window.__heroPhrases.length) ? window.__heroPhrases.slice() : [];
    if (!phrases.length) return;

    function html(raw) { return window.renderInline ? window.renderInline(raw) : String(raw); }
    function text(raw) { var d = document.createElement('div'); d.innerHTML = html(raw); return d.textContent.trim(); }

    if (phrases.length === 1) { subtitle.innerHTML = html(phrases[0]); return; }

    subtitle.style.minHeight = subtitle.offsetHeight + 'px';
    subtitle.innerHTML = '';
    var idx = 0;

    function swap(next) {
      subtitle.setAttribute('aria-label', text(phrases[idx % phrases.length]));
      next.classList.add('hero-rot-show');
      var prev = subtitle.querySelector('.hero-rot-slide:not(.hero-rot-out)');
      if (prev && prev !== next) {
        prev.classList.add('hero-rot-out');
        setTimeout(function() { if (prev.parentNode) prev.remove(); }, 900);
      }
    }

    function show() {
      var el = document.createElement('span');
      el.className = 'hero-rot-slide';
      el.innerHTML = html(phrases[idx % phrases.length]);
      subtitle.appendChild(el);
      requestAnimationFrame(function() { requestAnimationFrame(function() { swap(el); }); });
    }

    show();
    setInterval(function() { idx++; show(); }, 3000);
  }

  function initSpotlight() {
    if (reduced() || !window.matchMedia('(hover: hover)').matches) return;
    document.querySelectorAll('.feature-card, .about-card, .join-card, .stat-card').forEach(function(card) {
      card.addEventListener('mousemove', function(e) {
        var r = card.getBoundingClientRect();
        card.style.setProperty('--mx', (e.clientX - r.left) + 'px');
        card.style.setProperty('--my', (e.clientY - r.top) + 'px');
      });
    });
  }

  function initCopyIp() {
    document.addEventListener('click', function(e) {
      var btn = e.target.closest('.ip-copy-btn');
      if (!btn) return;
      var ip = btn.getAttribute('data-ip') || '';
      var textEl = btn.querySelector('.ip-text');
      var original = textEl ? textEl.textContent : ip;
      var done = function() {
        if (textEl) textEl.textContent = 'Copied!';
        btn.classList.add('copied');
        document.dispatchEvent(new CustomEvent('ipCopied', { detail: { button: btn } }));
        setTimeout(function() {
          if (textEl) textEl.textContent = original;
          btn.classList.remove('copied');
        }, 2000);
      };
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(ip).then(done).catch(function() { done(); });
      } else {
        done();
      }
    });
  }

  function initConfetti() {
    if (reduced()) return;
    document.addEventListener('ipCopied', function(e) {
      var origin = e.detail && e.detail.button ? e.detail.button : null;
      fireConfetti(origin);
    });
  }

  function initCountUp() {
    if (!('IntersectionObserver' in window)) return;
    var targets = document.querySelectorAll('[data-count]');
    if (!targets.length) return;
    var observer = new IntersectionObserver(function(entries) {
      entries.forEach(function(entry) {
        if (!entry.isIntersecting) return;
        var el = entry.target;
        var target = parseFloat(el.getAttribute('data-count'));
        if (isNaN(target)) return;
        if (window.animateNumber) {
          window.animateNumber(el, target, {
            prefix: el.getAttribute('data-count-prefix') || '',
            suffix: el.getAttribute('data-count-suffix') || '',
            decimals: parseInt(el.getAttribute('data-count-decimals') || '0', 10)
          });
        } else {
          el.textContent = target + (el.getAttribute('data-count-suffix') || '');
        }
        observer.unobserve(el);
      });
    }, { threshold: 0.4 });
    targets.forEach(function(el) { observer.observe(el); });
  }

  function initServerStatus() {
    var status = document.getElementById('heroStatus');
    var dot = document.getElementById('heroStatusDot');
    var text = document.getElementById('heroStatusText');
    if (!status || !dot || !text) return;

    var st = (window.__config && window.__config.status) || {};
    var endpoint = st.endpoint || 'https://api.mcstatus.io/v2/status/java/{ip}';
    var ip = st.ip || 'play.lancsmp.ru';
    var url = endpoint.replace('{ip}', ip);
    var refresh = Math.max(15, st.refreshSeconds || 60) * 1000;

    function update() {
      fetch(url)
        .then(function(r) { return r.json(); })
        .then(function(data) {
          if (data.online) {
            status.classList.add('online');
            status.classList.remove('offline');
            var online = (data.players && typeof data.players.online === 'number') ? data.players.online : 0;
            var label = 'Online' + (st.showPlayers && online > 0 ? ' \u2014 ' + online + ' online' : '');
            if (st.showVersion && data.version && data.version.name_clean) label += ' \u00b7 ' + data.version.name_clean;
            text.textContent = label;
          } else {
            status.classList.remove('online');
            status.classList.add('offline');
            text.textContent = 'Offline';
          }
        })
        .catch(function() {
          status.classList.remove('online');
          status.classList.add('offline');
          text.textContent = 'Status unavailable';
        });
    }

    update();
    setInterval(update, refresh);
  }

  function initScrollTop() {
    var btn = document.getElementById('scrollTopBtn');
    if (!btn) return;
    var ticking = false;
    window.addEventListener('scroll', function() {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(function() {
        if (window.scrollY > 400) btn.classList.add('visible');
        else btn.classList.remove('visible');
        ticking = false;
      });
    }, { passive: true });
    btn.addEventListener('click', function() { window.scrollTo({ top: 0, behavior: reduced() ? 'auto' : 'smooth' }); });
  }

  function fireConfetti(origin) {
    var rect = origin ? origin.getBoundingClientRect() : null;
    var cx = rect ? rect.left + rect.width / 2 : window.innerWidth / 2;
    var cy = rect ? rect.top + rect.height / 2 : window.innerHeight / 2;
    var colors = ['#3a6fff', '#B255D5', '#22c55e', '#ef4444', '#8b5cf6', '#ffffff'];
    for (var i = 0; i < 36; i++) {
      var p = document.createElement('span');
      p.className = 'confetti-piece';
      var angle = Math.random() * Math.PI * 2;
      var dist = 60 + Math.random() * 150;
      p.style.left = cx + 'px';
      p.style.top = cy + 'px';
      p.style.background = colors[i % colors.length];
      p.style.width = (6 + Math.random() * 6) + 'px';
      p.style.height = (6 + Math.random() * 6) + 'px';
      p.style.setProperty('--dx', (Math.cos(angle) * dist).toFixed(0) + 'px');
      p.style.setProperty('--dy', (Math.sin(angle) * dist + 60).toFixed(0) + 'px');
      p.style.setProperty('--rot', (Math.random() * 540 - 270).toFixed(0) + 'deg');
      document.body.appendChild(p);
      (function(el) { setTimeout(function() { if (el.parentNode) el.parentNode.removeChild(el); }, 1000); })(p);
    }
  }

  function init() {
    initFAQ();
    initSmoothScroll();
    initActions();
    initScrollSpy();
    initCardReveal();
    initHeroRotator();
    initSpotlight();
    initCopyIp();
    initConfetti();
    initCountUp();
    initServerStatus();
    initScrollTop();
  }

  var started = false;
  function start() {
    if (started) return;
    started = true;
    init();
  }

  window.addEventListener('configReady', start);
  if (document.readyState !== 'loading') {
    setTimeout(start, 200);
  } else {
    document.addEventListener('DOMContentLoaded', function() { setTimeout(start, 1200); });
  }
})();
