// Utility functions shared across the site

function escH(s) {
  var d = document.createElement('div');
  d.textContent = s || '';
  return d.innerHTML;
}

function escapeJs(str) {
  str = String(str);
  return str
    .replace(/\\/g, '\\\\')
    .replace(/'/g, "\\'")
    .replace(/"/g, '\\"')
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '\\r')
    .replace(/\u2028/g, '\\u2028')
    .replace(/\u2029/g, '\\u2029');
}

function escapeHtmlAttr(str) {
  return String(str).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

// Offline detection banner
(function() {
  var banner = document.createElement('div');
  banner.id = 'offlineBanner';
  banner.style.cssText = 'display:none;position:fixed;top:0;left:0;right:0;z-index:200;padding:0.625rem 1rem;text-align:center;font-family:var(--font-heading);font-size:0.8125rem;font-weight:700;color:#fff;background:rgba(239,68,68,0.9);backdrop-filter:blur(8px);transition:transform 0.3s ease;transform:translateY(-100%);';
  banner.textContent = 'You are offline. Some features may be unavailable.';
  document.body.insertBefore(banner, document.body.firstChild);

  function showBanner() { banner.style.display = 'block'; requestAnimationFrame(function() { banner.style.transform = 'translateY(0)'; }); }
  function hideBanner() {
    banner.style.transform = 'translateY(-100%)';
    banner.addEventListener('transitionend', function handler() {
      banner.removeEventListener('transitionend', handler);
      banner.style.display = 'none';
    });
  }

  window.addEventListener('online', hideBanner);
  window.addEventListener('offline', showBanner);
  if (!navigator.onLine) showBanner();
})();

// Toast notification system — stacked, top-right, auto-dismiss
var _toastContainer = null;
function getToastContainer() {
  if (!_toastContainer) {
    _toastContainer = document.createElement('div');
    _toastContainer.id = 'toastContainer';
    _toastContainer.style.cssText = 'position:fixed;top:5rem;right:1rem;z-index:99999;display:flex;flex-direction:column;gap:0.5rem;pointer-events:none;max-width:min(22rem,calc(100vw - 2rem));';
    document.body.appendChild(_toastContainer);
  }
  return _toastContainer;
}

var TOAST_ICONS = {
  success: '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>',
  error: '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>',
  warning: '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>',
  info: '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>'
};

function showToast(msg, type, duration) {
  type = type || 'info';
  duration = duration || 4000;
  var container = getToastContainer();

  var toast = document.createElement('div');
  toast.className = 'toast-stack show';
  toast.setAttribute('role', 'alert');
  toast.style.cssText = 'pointer-events:auto;display:flex;align-items:flex-start;gap:0.625rem;padding:0.875rem 1rem;border-radius:0.875rem;background:rgba(20,24,38,0.95);backdrop-filter:blur(16px);-webkit-backdrop-filter:blur(16px);border:1px solid rgba(255,255,255,0.1);color:#fff;font-size:0.875rem;font-weight:500;line-height:1.5;box-shadow:0 12px 40px rgba(0,0,0,0.5);transform:translateX(120%);opacity:0;transition:transform 0.35s cubic-bezier(0.34,1.56,0.64,1),opacity 0.25s ease;position:relative;overflow:hidden;will-change:transform,opacity;';

  var icon = document.createElement('div');
  icon.style.cssText = 'flex-shrink:0;width:1.25rem;height:1.25rem;display:flex;align-items:center;justify-content:center;margin-top:0.0625rem;';
  icon.innerHTML = TOAST_ICONS[type] || TOAST_ICONS.info;

  var msgEl = document.createElement('div');
  msgEl.style.cssText = 'flex:1;min-width:0;word-break:break-word;';
  msgEl.textContent = msg;

  var closeBtn = document.createElement('button');
  closeBtn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>';
  closeBtn.style.cssText = 'flex-shrink:0;background:none;border:none;color:rgba(255,255,255,0.35);cursor:pointer;padding:0.125rem;border-radius:0.375rem;display:flex;align-items:center;justify-content:center;transition:color 0.15s;';
  closeBtn.onmouseover = function() { this.style.color = '#fff'; };
  closeBtn.onmouseout = function() { this.style.color = 'rgba(255,255,255,0.35)'; };
  closeBtn.onclick = function() { dismissToast(toast); };

  toast.appendChild(icon);
  toast.appendChild(msgEl);
  toast.appendChild(closeBtn);

  // Color accent bar
  var accentColors = { success: '#22c55e', error: '#ef4444', warning: '#eab308', info: '#3a6fff' };
  var bar = document.createElement('div');
  bar.style.cssText = 'position:absolute;top:0;left:0;right:0;height:2px;background:' + (accentColors[type] || '#3a6fff') + ';transform:scaleX(0);transform-origin:left;transition:transform ' + (duration / 1000) + 's linear;';
  toast.appendChild(bar);

  container.appendChild(toast);

  // Animate in
  requestAnimationFrame(function() {
    toast.style.transform = 'translateX(0)';
    toast.style.opacity = '1';
    requestAnimationFrame(function() {
      bar.style.transform = 'scaleX(1)';
    });
  });

  toast._dismissTimer = setTimeout(function() {
    dismissToast(toast);
  }, duration);

  toast.addEventListener('transitionend', function(e) {
    if (e.propertyName === 'opacity' && toast._dismissed && toast.parentNode) {
      toast.parentNode.removeChild(toast);
    }
  });

  return toast;
}

function dismissToast(toast) {
  if (toast._dismissed) return;
  toast._dismissed = true;
  clearTimeout(toast._dismissTimer);
  toast.style.transform = 'translateX(120%)';
  toast.style.opacity = '0';
}

// Quick helpers
function showSuccess(msg) { return showToast(msg, 'success'); }
function showError(msg) { return showToast(msg, 'error'); }
function showWarning(msg) { return showToast(msg, 'warning'); }
function showInfo(msg) { return showToast(msg, 'info'); }

// Markdown text formatting for editor toolbars
function formatText(cmd, textarea) {
  var ta = typeof textarea === 'string' ? document.getElementById(textarea) : textarea;
  if (!ta) return;
  var start = ta.selectionStart;
  var end = ta.selectionEnd;
  var text = ta.value;
  var sel = text.substring(start, end);
  var before = '';
  var after = '';
  var cursorOffset = 0;

  switch (cmd) {
    case 'bold': before = '**'; after = '**'; sel = sel || 'bold text'; break;
    case 'italic': before = '*'; after = '*'; sel = sel || 'italic text'; break;
    case 'heading': before = '\n## '; sel = sel || 'Heading'; cursorOffset = -1; break;
    case 'list': before = '\n- '; sel = sel || 'list item'; cursorOffset = -1; break;
    case 'code': before = '`'; after = '`'; sel = sel || 'code'; break;
    case 'link': before = '['; after = '](url)'; sel = sel || 'link text'; break;
    case 'quote': before = '\n> '; sel = sel || 'quote'; cursorOffset = -1; break;
    case 'line': before = '\n---\n'; sel = ''; break;
    default: return;
  }

  ta.focus();
  start = ta.selectionStart;
  end = ta.selectionEnd;
  text = ta.value;
  ta.value = text.substring(0, start) + before + sel + after + text.substring(end);
  ta.selectionStart = ta.selectionEnd = start + before.length + sel.length + after.length;
  ta.dispatchEvent(new Event('input', { bubbles: true }));
}

// Loading/Error pill helpers
function loadingPill(text) {
  var el = document.createElement('span');
  el.className = 'pill-loading';
  el.textContent = text || 'Loading ';
  var dots = document.createElement('span');
  dots.className = 'pill-dots';
  el.appendChild(dots);
  return el;
}

function errorPill(msg) {
  var el = document.createElement('span');
  el.className = 'pill-error';
  el.textContent = msg || 'Error';
  return el;
}
