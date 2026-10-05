// Home page — FAQ accordion, smooth scroll, scroll reveal, scroll spy

var prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function initHomePage() {
  initFAQ();
  initSmoothScroll();
  initScrollSpy();
  initSectionHeaders();
  initCardReveal();
  initHeroRotator();
  initCardSpotlight();
  initConfetti();
  initServerStatus();
}

// OpenAI-style cursor spotlight on homepage cards
function initCardSpotlight() {
  if (prefersReducedMotion) return;
  if (!window.matchMedia('(hover: hover)').matches) return;
  document.querySelectorAll('.feature-card, .about-card, .join-card').forEach(function(card) {
    card.addEventListener('mousemove', function(e) {
      var r = card.getBoundingClientRect();
      card.style.setProperty('--mx', (e.clientX - r.left) + 'px');
      card.style.setProperty('--my', (e.clientY - r.top) + 'px');
    });
  });
}

// FAQ Accordion
function initFAQ() {
  document.querySelectorAll('.faq-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const item = btn.parentElement;
      const isOpen = item.classList.contains('open');

      document.querySelectorAll('.faq-item.open').forEach(openItem => {
        if (openItem !== item) {
          openItem.classList.remove('open');
          openItem.querySelector('.faq-btn').setAttribute('aria-expanded', 'false');
        }
      });

      item.classList.toggle('open');
      btn.setAttribute('aria-expanded', !isOpen);
    });
  });
}

// Smooth scroll for all anchor links
function initSmoothScroll() {
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      const href = this.getAttribute('href');
      if (href === '#') return;
      const target = document.querySelector(href);
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: prefersReducedMotion ? 'auto' : 'smooth' });
      }
    });
  });
}

// Scroll spy — move nav blob to current section
function initScrollSpy() {
  if (prefersReducedMotion) return;

  const blob = document.getElementById('navBlob');
  const navLinks = document.querySelector('.nav-links');
  if (!blob || !navLinks) return;

  const sectionLinks = {
    '#home': navLinks.querySelector('a[href="#home"]'),
    '#features': navLinks.querySelector('a[href="#features"]'),
    '#about': navLinks.querySelector('a[href="#about"]'),
    '#join': navLinks.querySelector('a[href="#join"]'),
    '#faq': navLinks.querySelector('a[href="#faq"]')
  };

  let activeSection = null;

  function moveBlob(link) {
    if (!link) {
      blob.style.opacity = '0';
      return;
    }
    const linkRect = link.getBoundingClientRect();
    const navRect = navLinks.getBoundingClientRect();
    const left = linkRect.left - navRect.left;
    const width = linkRect.width;
    blob.style.transform = 'translateX(' + left + 'px)';
    blob.style.width = width + 'px';
    blob.style.opacity = '1';
  }

  const sections = {};
  Object.keys(sectionLinks).forEach(sel => {
    const el = document.querySelector(sel);
    if (el) sections[sel] = el;
  });

  const observer = new IntersectionObserver((entries) => {
    let bestRatio = 0;
    let bestId = null;

    entries.forEach(entry => {
      if (entry.isIntersecting && entry.intersectionRatio > bestRatio) {
        bestRatio = entry.intersectionRatio;
        bestId = '#' + entry.target.id;
      }
    });

    if (bestId && bestId !== activeSection) {
      activeSection = bestId;
      moveBlob(sectionLinks[bestId]);
    }
  }, {
    threshold: [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1],
    rootMargin: '-80px 0px -50% 0px'
  });

  Object.values(sections).forEach(el => observer.observe(el));

  window.addEventListener('resize', () => {
    if (activeSection) moveBlob(sectionLinks[activeSection]);
  });
}

function joinServer() {
  document.getElementById('join')?.scrollIntoView({ behavior: prefersReducedMotion ? 'auto' : 'smooth' });
}

function initSectionHeaders() {
  if (prefersReducedMotion) {
    document.querySelectorAll('.section-header').forEach(function(h) {
      h.style.opacity = '1';
      h.style.transform = 'none';
    });
    return;
  }
  var headers = document.querySelectorAll('.section-header');
  if (!headers.length) return;
  var supportsViewTimeline = CSS.supports('animation-timeline: view()');
  if (supportsViewTimeline) return;
  var observer = new IntersectionObserver(function(entries) {
    entries.forEach(function(entry) {
      if (entry.isIntersecting) {
        entry.target.style.transition = 'opacity 0.7s cubic-bezier(0.22,0.61,0.36,1), transform 0.7s cubic-bezier(0.22,0.61,0.36,1)';
        entry.target.style.opacity = '1';
        entry.target.style.transform = 'translateY(0)';
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15 });
  headers.forEach(function(h) {
    h.style.opacity = '0';
    h.style.transform = 'translateY(24px)';
    observer.observe(h);
  });
}

// Staggered scroll-reveal for homepage cards (features / about / join / FAQ / rules).
// Boarded on top of ui.js which deliberately excludes #home cards.
function initCardReveal() {
  if (prefersReducedMotion) return;
  if (!('IntersectionObserver' in window)) return;

  var revealEls = [];
  document.querySelectorAll('.features-grid, .about-grid, .join-grid, .faq-list, .rules-grid').forEach(function(grid) {
    for (var i = 0; i < grid.children.length; i++) {
      var card = grid.children[i];
      if (!(card instanceof Element)) continue;
      if (card.classList.contains('reveal-in') || card.classList.contains('visible')) continue;
      revealEls.push(card);
    }
  });
  if (!revealEls.length) return;

  revealEls.forEach(function(card) {
    card.classList.add('reveal-in');
  });

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
        el.style.willChange = '';
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

// Initialize after DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initHomePage);
} else {
  initHomePage();
}

// Hero subtitle rotator — phrases slide horizontally like Modrinth (runs once config is applied)
function initHeroRotator() {
  if (prefersReducedMotion) return;
  var subtitle = document.querySelector('.hero-subtitle');
  if (!subtitle) return;
  var started = false;

  function phraseText(raw) {
    var tmp = document.createElement('div');
    tmp.innerHTML = typeof window.renderMarkdown === 'function' ? window.renderMarkdown(raw) : raw;
    return tmp.textContent.trim();
  }

  function phraseHtml(raw) {
    if (typeof window.renderMarkdown === 'function') return window.renderMarkdown(raw);
    var tmp = document.createElement('div');
    tmp.textContent = raw;
    return tmp.innerHTML;
  }

  function collectPhrases() {
    if (window.__heroPhrases && window.__heroPhrases.length) return window.__heroPhrases.slice();
    var text = subtitle.textContent.trim();
    return text ? [text] : [];
  }

  function start() {
    if (started) return;
    started = true;
    var phrases = collectPhrases();
    if (!phrases.length) return;
    if (phrases.length === 1) {
      subtitle.innerHTML = phraseHtml(phrases[0]);
      return;
    }

    // Reserve the tallest phrase height so sliding text never clips
    var meas = document.createElement('div');
    meas.style.cssText = 'position:absolute;visibility:hidden;left:-9999px;top:0;';
    meas.style.width = subtitle.clientWidth + 'px';
    subtitle.appendChild(meas);
    var tallest = subtitle.offsetHeight;
    phrases.forEach(function(raw) {
      meas.innerHTML = phraseHtml(raw);
      tallest = Math.max(tallest, meas.offsetHeight);
    });
    meas.remove();
    subtitle.style.minHeight = tallest + 'px';

    subtitle.innerHTML = '';
    var idx = 0;

    function makeSlide(raw) {
      var el = document.createElement('span');
      el.className = 'hero-rot-slide';
      el.innerHTML = phraseHtml(raw);
      return el;
    }

    function swap(next) {
      subtitle.setAttribute('aria-label', phraseText(phrases[idx % phrases.length]));
      next.classList.add('hero-rot-show');
      var prev = subtitle.querySelector('.hero-rot-slide:not(.hero-rot-out)');
      if (prev && prev !== next) {
        prev.classList.add('hero-rot-out');
        var remove = function() { prev.remove(); };
        prev.addEventListener('transitionend', remove, { once: true });
        setTimeout(remove, 900);
      }
    }

    function show() {
      var next = makeSlide(phrases[idx % phrases.length]);
      subtitle.appendChild(next);
      requestAnimationFrame(function() {
        requestAnimationFrame(function() { swap(next); });
      });
    }

    show();
    setInterval(function() { idx++; show(); }, 3000);
  }
  window.addEventListener('configReady', start);
  setTimeout(start, 1600);
}

// Confetti burst when the server IP is copied
function initConfetti() {
  if (prefersReducedMotion) return;
  document.addEventListener('ipCopied', function(e) {
    var origin = e.detail && e.detail.button ? e.detail.button : null;
    fireConfetti(origin);
  });
}

// Live server status pill — online/offline + player count
function initServerStatus() {
  var status = document.getElementById('heroStatus');
  var dot = document.getElementById('heroStatusDot');
  var text = document.getElementById('heroStatusText');
  if (!status || !dot || !text) return;

  function update() {
    fetch('https://api.mcstatus.io/v2/status/java/play.lancsmp.ru')
      .then(function(r) { return r.json(); })
      .then(function(data) {
        if (data.online) {
          status.classList.add('online');
          status.classList.remove('offline');
          var online = (data.players && typeof data.players.online === 'number') ? data.players.online : 0;
          text.textContent = 'Online' + (online > 0 ? ' \u2014 ' + online + ' online' : '');
        } else {
          status.classList.remove('online');
          status.classList.add('offline');
          text.textContent = 'Offline';
        }
      })
      .catch(function() {
        status.classList.remove('online');
        status.classList.add('offline');
        text.textContent = 'Server status unavailable';
      });
  }

  update();
  setInterval(update, 60000);
}

function fireConfetti(origin) {
  var rect = origin ? origin.getBoundingClientRect() : null;
  var cx = rect ? rect.left + rect.width / 2 : window.innerWidth / 2;
  var cy = rect ? rect.top + rect.height / 2 : window.innerHeight / 2;
  var colors = ['#3a6fff', '#B255D5', '#22c55e', '#ef4444', '#8b5cf6', '#ffffff'];
  var count = 36;
  for (let i = 0; i < count; i++) {
    var p = document.createElement('span');
    p.className = 'confetti-piece';
    var angle = Math.random() * Math.PI * 2;
    var dist = 60 + Math.random() * 150;
    var dx = Math.cos(angle) * dist;
    var dy = Math.sin(angle) * dist + 60;
    p.style.left = cx + 'px';
    p.style.top = cy + 'px';
    p.style.background = colors[i % colors.length];
    p.style.width = (6 + Math.random() * 6) + 'px';
    p.style.height = (6 + Math.random() * 6) + 'px';
    p.style.setProperty('--dx', dx.toFixed(0) + 'px');
    p.style.setProperty('--dy', dy.toFixed(0) + 'px');
    p.style.setProperty('--rot', (Math.random() * 540 - 270).toFixed(0) + 'deg');
    document.body.appendChild(p);
    (function(el) {
      setTimeout(function() { if (el.parentNode) el.parentNode.removeChild(el); }, 1000);
    })(p);
  }
}
