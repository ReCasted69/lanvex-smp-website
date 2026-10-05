(async function() {
      function md(text) {
        if (typeof window.renderMarkdown === 'function') return window.renderMarkdown(text);
        var div = document.createElement('div');
        div.textContent = String(text || '');
        return div.innerHTML;
      }

      try {
        const res = await fetch('data/config.json');
        if (!res.ok) return;
        const cfg = await res.json();

        // Apply colors as CSS variables
        if (cfg.colors) {
          const root = document.documentElement;
          root.style.setProperty('--blue', cfg.colors.primary);
          root.style.setProperty('--blue-hover', cfg.colors.primaryHover);
          root.style.setProperty('--gold', cfg.colors.accent);
          root.style.setProperty('--gold-hover', cfg.colors.accentHover);
          root.style.setProperty('--bg-dark', cfg.colors.bgDark);
          root.style.setProperty('--bg-card', cfg.colors.bgCard);
          root.style.setProperty('--bg-nav', cfg.colors.bgNav);
        }

        if (!cfg.site) return;
        const s = cfg.site;

        // Page title (homepage only; sub-pages have their own titles)
        var path = window.location.pathname.replace(/\/+$/, '');
        var isHome = path === '' || path === '/' || /\/index\.html?$/i.test(path);
        if (isHome) {
          if (s.name) document.title = s.name + ' — Home';
          else if (s.title) document.title = s.title;
        }

        // Hero subtitle
        const subtitle = document.querySelector('.hero-subtitle');
        if (subtitle) {
          if (Array.isArray(s.heroRotator) && s.heroRotator.length) {
            window.__heroPhrases = s.heroRotator.slice();
          } else if (s.description) {
            window.__heroPhrases = [s.description];
          }
          if (s.description) subtitle.innerHTML = md(s.description);
        }

        // Body text
        const descs = document.querySelectorAll('.hero-desc');
        if (descs[0] && s.bodyText1) descs[0].innerHTML = md(s.bodyText1);
        if (descs[1] && s.bodyText2) descs[1].innerHTML = md(s.bodyText2);

        // Server IP
        const copyBtn = document.getElementById('copyIpBtn');
        if (copyBtn) {
          if (s.serverIp) copyBtn.dataset.ip = s.serverIp;
          const ipText = document.getElementById('ipText');
          if (ipText && s.serverIp) ipText.textContent = s.serverIp;
          // Re-bind click if not already bound
          if (!copyBtn.dataset.bound) {
            copyBtn.dataset.bound = '1';
            copyBtn.addEventListener('click', async () => {
              try {
                await navigator.clipboard.writeText(copyBtn.dataset.ip);
                const span = document.getElementById('ipText');
                const orig = span ? span.textContent : '';
                if (span) span.textContent = 'Copied!';
                copyBtn.classList.add('copied');
                document.dispatchEvent(new CustomEvent('ipCopied', { detail: { button: copyBtn } }));
                setTimeout(() => {
                  if (span) span.textContent = orig;
                  copyBtn.classList.remove('copied');
                }, 2000);
              } catch {}
            });
          }
        }

        // Links
        if (s.discordUrl) {
          document.querySelectorAll('a[href*="discord.lancsmp"]').forEach(a => a.href = s.discordUrl);
        }
        if (s.supportUrl) {
          document.querySelectorAll('a[href*="ko-fi"]').forEach(a => a.href = s.supportUrl);
        }
        if (s.ownerEmail) {
          document.querySelectorAll('a[href*="golovanov.dmitrii"]').forEach(a => a.href = 'mailto:' + s.ownerEmail);
        }

        // Images — bg image is injected directly in the HTML to avoid flicker
        if (s.logoBig) { const hl = document.querySelector('.hero-logo'); if (hl) hl.src = s.logoBig; }

        // Copyright
        if (s.copyright) {
          const fcp = document.querySelector('.footer-bottom p');
          if (fcp) fcp.innerHTML = '&copy; ' + s.copyright;
        }

        // Features
        if (cfg.features) {
          const featCards = document.querySelectorAll('.feature-card');
          cfg.features.forEach((f, i) => {
            if (featCards[i]) {
              const t = featCards[i].querySelector('.feature-title');
              const d = featCards[i].querySelector('.feature-desc');
              const ic = featCards[i].querySelector('.feature-icon');
              if (t) t.textContent = f.title;
              if (d) d.innerHTML = md(f.desc);
              if (ic && f.icon && typeof ICON_SVGS !== 'undefined' && ICON_SVGS[f.icon]) ic.innerHTML = ICON_SVGS[f.icon];
            }
          });
        }

        // About
        if (cfg.about) {
          const aboutCards = document.querySelectorAll('.about-card:not(.about-card-full)');
          cfg.about.forEach((a, i) => {
            if (aboutCards[i]) {
              const t = aboutCards[i].querySelector('.feature-title');
              const d = aboutCards[i].querySelector('.feature-desc');
              const ib = aboutCards[i].querySelector('.about-icon-box');
              if (t) t.textContent = a.title;
              if (d) d.innerHTML = md(a.desc);
              if (ib && a.icon && typeof ICON_SVGS !== 'undefined' && ICON_SVGS[a.icon]) ib.innerHTML = ICON_SVGS[a.icon].replace('width="20"', 'width="24"');
            }
          });
        }

        // Rules
        if (cfg.rules) {
          const ruleItems = document.querySelectorAll('.rule-item');
          cfg.rules.forEach((r, i) => {
            if (ruleItems[i]) ruleItems[i].innerHTML = '<span class="rule-num text-blue">' + (i + 1) + '.</span> ' + md(r);
          });
        }

        // Join steps
        if (cfg.join) {
          const joinCards = document.querySelectorAll('.join-card');
          cfg.join.forEach((j, i) => {
            if (joinCards[i]) {
              const t = joinCards[i].querySelector('.feature-title');
              const d = joinCards[i].querySelector('.feature-desc');
              const iw = joinCards[i].querySelector('.join-icon-wrap');
              if (t) t.textContent = j.title;
              if (d) d.innerHTML = md(j.desc);
              if (iw && j.icon && typeof ICON_SVGS !== 'undefined' && ICON_SVGS[j.icon]) iw.innerHTML = ICON_SVGS[j.icon].replace('width="20"', 'width="32"').replace('height="20"', 'height="32"');
              if (j.link) {
                const link = joinCards[i].querySelector('.join-link');
                if (link) link.href = j.link;
              }
            }
          });
        }

        // FAQ
        if (cfg.faq) {
          const faqItems = document.querySelectorAll('.faq-item');
          cfg.faq.forEach((f, i) => {
            if (faqItems[i]) {
              const q = faqItems[i].querySelector('.faq-question');
              const a = faqItems[i].querySelector('.faq-answer p');
              if (q) q.textContent = f.question;
              if (a) a.innerHTML = md(f.answer);
            }
          });
        }
      } catch(e) {
        /* config unavailable, using static content */
      }
      document.dispatchEvent(new Event('configReady'));
    })();
