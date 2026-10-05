// Lightweight Markdown + Color Text renderer — modular, shared
(function() {
  var namedColors = {
    red: '#ef4444', blue: '#3A6FFF', green: '#22c55e', gold: '#FFC837',
    purple: '#a855f7', pink: '#ec4899', cyan: '#06b6d4', orange: '#f97316',
    yellow: '#eab308', teal: '#14b8a6', lime: '#84cc16', gray: '#9ca3af',
    white: '#ffffff', aqua: '#06b6d4', dark_red: '#b91c1c', dark_blue: '#1d4ed8',
    dark_green: '#15803d', dark_purple: '#7e22ce'
  };

  function resolveColor(name) {
    if (name in namedColors) return namedColors[name];
    if (/^#[0-9a-fA-F]{3,8}$/.test(name)) return name;
    if (/^[0-9a-fA-F]{6}$/.test(name)) return '#' + name;
    return null;
  }

  function esc(str) {
    var d = document.createElement('div');
    d.textContent = str;
    return d.innerHTML;
  }

  function parseColorText(text) {
    if (!text) return '';
    var result = '';
    var stack = [];
    var i = 0;

    while (i < text.length) {
      var tagMatch = text.slice(i).match(/^<(\/?(?:gradient:[^>]+|#[0-9a-fA-F]{3,8}|\w+)|\/?reset)>/);
      if (tagMatch) {
        var tag = tagMatch[1];
        i += tagMatch[0].length;

        if (tag === '/reset' || tag === 'reset') {
          while (stack.length) result += stack.pop().close;
        } else if (tag.charAt(0) === '/') {
          var closing = tag.slice(1);
          for (var j = stack.length - 1; j >= 0; j--) {
            if (stack[j].name === closing) {
              result += stack[j].close;
              stack.splice(j, 1);
              break;
            }
          }
        } else {
          var gradient = tag.toLowerCase().startsWith('gradient:') ? parseGradient(tag) : null;
          if (gradient) {
            var gid = 'cg' + Math.random().toString(36).slice(2, 8);
            result += '<span class="ct-gradient" style="--ct-grad:' + gradient + '">';
            stack.push({ name: tag, close: '</span>' });
          } else {
            var color = resolveColor(tag);
            if (color) {
              result += '<span style="color:' + color + '">';
              stack.push({ name: tag, close: '</span>' });
            } else {
              result += esc(tagMatch[0]);
            }
          }
        }
      } else {
        result += esc(text.charAt(i));
        i++;
      }
    }

    while (stack.length) result += stack.pop().close;
    return result;
  }

  function parseGradient(token) {
    var match = token.match(/^gradient:(.+)$/i);
    if (!match) return null;
    var colors = match[1].split(':').filter(Boolean);
    if (colors.length < 2) return null;
    var stops = colors.map(function(c, i) {
      var color = resolveColor(c);
      return color + ' ' + (i / (colors.length - 1) * 100) + '%';
    });
    return 'linear-gradient(90deg, ' + stops.join(', ') + ')';
  }

  // ---- Markdown renderer ----

  // Split a table row into cells, honoring escaped pipes (\|).
  function splitTableRow(line) {
    var s = line.trim();
    if (s.charAt(0) === '|') s = s.slice(1);
    if (s.charAt(s.length - 1) === '|') s = s.slice(0, -1);
    var cells = [];
    var cur = '';
    for (var i = 0; i < s.length; i++) {
      var ch = s.charAt(i);
      if (ch === '\\' && i + 1 < s.length && s.charAt(i + 1) === '|') {
        cur += '|';
        i++;
      } else if (ch === '|') {
        cells.push(cur.trim());
        cur = '';
      } else {
        cur += ch;
      }
    }
    cells.push(cur.trim());
    return cells;
  }

  // Determine alignment from a separator cell (e.g. ":---", ":---:", "---:").
  function parseTableAlign(cell) {
    var t = cell.trim();
    var left = t.charAt(0) === ':';
    var right = t.charAt(t.length - 1) === ':';
    if (left && right) return 'center';
    if (right) return 'right';
    if (left) return 'left';
    return '';
  }

  function renderTable(block) {
    var lines = block.split('\n').filter(function(l) { return l.trim() !== ''; });
    if (lines.length < 2) return block;

    var header = splitTableRow(lines[0]);
    var sep = splitTableRow(lines[1]);

    var aligns = [];
    for (var i = 0; i < sep.length; i++) {
      if (!/^:?-+:?$/.test(sep[i])) return block;
      aligns.push(parseTableAlign(sep[i]));
    }

    var html = '<div class="md-table-wrap"><table class="md-table"><thead><tr>';
    for (var h = 0; h < header.length; h++) {
      var a = aligns[h];
      html += '<th' + (a ? ' style="text-align:' + a + ';"' : '') + '>' + header[h] + '</th>';
    }
    html += '</tr></thead><tbody>';

    for (var r = 2; r < lines.length; r++) {
      var cells = splitTableRow(lines[r]);
      html += '<tr>';
      for (var c = 0; c < header.length; c++) {
        var ca = aligns[c];
        html += '<td' + (ca ? ' style="text-align:' + ca + ';"' : '') + '>' + (cells[c] !== undefined ? cells[c] : '') + '</td>';
      }
      html += '</tr>';
    }
    html += '</tbody></table></div>';
    return html;
  }

  function renderMD(text) {
    if (!text) return '';

    var fencedBlocks = [];
    var codes = [];
    var tags = [];
    var s = text;

    // Store fenced code blocks BEFORE any processing (protect color tags inside)
    s = s.replace(/```(\w*\n)?([\s\S]*?)```/g, function(_, lang, content) {
      fencedBlocks.push(content);
      return '\x00FENCED' + (fencedBlocks.length - 1) + '\x00';
    });

    // Store inline code
    s = s.replace(/`([^`]+)`/g, function(_, code) {
      codes.push(code);
      return '\x00CODE' + (codes.length - 1) + '\x00';
    });

    // Store hashtags
    s = s.replace(/#\w+/g, function(tag) {
      tags.push(tag);
      return '\x00TAG' + (tags.length - 1) + '\x00';
    });

    // Process color text tags BEFORE HTML escaping (they produce HTML)
    s = parseColorText(s);

    // Bold, italic, links
    s = s.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    s = s.replace(/\*(.+?)\*/g, '<em>$1</em>');
    s = s.replace(/\[([^\]]+)\]\(([^)]+)\)/g, function(_, text, url) {
      var safe = /^(https?:|mailto:|[\/#])/i.test(url);
      if (!safe) return _;
      return '<a href="' + url + '" target="_blank" rel="noopener noreferrer">' + text + '</a>';
    });

    // Tables (GitHub-flavored: header row, separator row, body rows)
    s = s.replace(/(?:^[ \t]*\|[^\n]*$\n?)+/gm, function(block) {
      return renderTable(block);
    });

    // Headings
    s = s.replace(/^### (.+)$/gm, '<h4>$1</h4>');
    s = s.replace(/^## (.+)$/gm, '<h3>$1</h3>');
    s = s.replace(/^# (.+)$/gm, '<h2>$1</h2>');
    // Blockquote
    s = s.replace(/^> (.+)$/gm, '<blockquote>$1</blockquote>');
    // List items
    s = s.replace(/^- (.+)$/gm, '<li>$1</li>');
    s = s.replace(/((?:<li>[\s\S]*?<\/li>\n?)+)/g, '<ul>$1</ul>');
    // Paragraphs
    s = s.replace(/^(.+)$/gm, function(m) {
      if (m.charAt(0) === '<') return m;
      return '<p>' + m + '</p>';
    });

    // Restore hashtags
    s = s.replace(/\x00TAG(\d+)\x00/g, function(_, i) {
      var t = tags[parseInt(i)] || '';
      return '<span class="hashtag">' + esc(t) + '</span>';
    });

    // Restore code
    s = s.replace(/\x00CODE(\d+)\x00/g, function(_, i) {
      return '<code>' + esc(codes[parseInt(i)] || '') + '</code>';
    });

    // Restore fenced code blocks
    s = s.replace(/\x00FENCED(\d+)\x00/g, function(_, i) {
      return '<pre><code>' + esc(fencedBlocks[parseInt(i)] || '') + '</code></pre>';
    });

    return s;
  }

  window.renderMarkdown = renderMD;
  window.parseColorText = parseColorText;
  window.attachToolbar = attachToolbar;
  window.attachAutosave = attachAutosave;
  window.attachAutosaveContainer = attachAutosaveContainer;

  // ---- Markdown Editor Toolbar ----

  var toolbarHTML =
    '<div class="md-toolbar">' +
      '<button type="button" class="md-tb-btn" data-md="bold" title="Bold (Ctrl+B)"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M6 4h8a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z"/><path d="M6 12h9a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z"/></svg></button>' +
      '<button type="button" class="md-tb-btn" data-md="italic" title="Italic (Ctrl+I)"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="19" y1="4" x2="10" y2="4"/><line x1="14" y1="20" x2="5" y2="20"/><line x1="15" y1="4" x2="9" y2="20"/></svg></button>' +
      '<button type="button" class="md-tb-btn" data-md="strikethrough" title="Strikethrough"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="4" y1="12" x2="20" y2="12"/><path d="M8 7h4a4 4 0 0 1 0 8H8"/><path d="M16 17H8"/></svg></button>' +
      '<span class="md-tb-sep"></span>' +
      '<button type="button" class="md-tb-btn" data-md="heading" title="Heading"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M6 4v16"/><path d="M18 4v16"/><line x1="6" y1="12" x2="18" y2="12"/></svg></button>' +
      '<button type="button" class="md-tb-btn" data-md="list" title="Bullet list"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg></button>' +
      '<button type="button" class="md-tb-btn" data-md="numlist" title="Numbered list"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="10" y1="6" x2="21" y2="6"/><line x1="10" y1="12" x2="21" y2="12"/><line x1="10" y1="18" x2="21" y2="18"/><path d="M4 6h1v4"/><path d="M4 16h2"/></svg></button>' +
      '<span class="md-tb-sep"></span>' +
      '<button type="button" class="md-tb-btn" data-md="link" title="Link"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg></button>' +
      '<button type="button" class="md-tb-btn" data-md="image" title="Image"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg></button>' +
      '<span class="md-tb-sep"></span>' +
      '<button type="button" class="md-tb-btn" data-md="code" title="Inline code"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg></button>' +
      '<button type="button" class="md-tb-btn" data-md="quote" title="Blockquote"><svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" stroke="none"><path d="M4 5h5v7H5v2h4v5H4v-5H2v-4h2V5z"/><path d="M14 5h5v7h-4v2h4v5h-5v-5h-2v-4h2V5z"/></svg></button>' +
      '<button type="button" class="md-tb-btn" data-md="hr" title="Horizontal rule"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="4" y1="12" x2="20" y2="12"/><line x1="8" y1="8" x2="8" y2="16"/><line x1="16" y1="8" x2="16" y2="16"/></svg></button>' +
      '<span class="md-tb-sep"></span>' +
      '<button type="button" class="md-tb-btn md-tb-color" data-md="color" title="Insert color">&lt;color&gt;</button>' +
    '</div>';

  function wrapSelection(textarea, before, after) {
    var start = textarea.selectionStart;
    var end = textarea.selectionEnd;
    var text = textarea.value;
    var selected = text.slice(start, end);
    var replacement = before + selected + after;
    textarea.value = text.slice(0, start) + replacement + text.slice(end);
    textarea.focus();
    textarea.setSelectionRange(start + before.length, start + before.length + selected.length);
    textarea.dispatchEvent(new Event('input', { bubbles: true }));
  }

  function insertAtCursor(textarea, text) {
    var start = textarea.selectionStart;
    textarea.value = textarea.value.slice(0, start) + text + textarea.value.slice(textarea.selectionEnd);
    textarea.focus();
    textarea.setSelectionRange(start + text.length, start + text.length);
    textarea.dispatchEvent(new Event('input', { bubbles: true }));
  }

  function attachToolbar(textarea) {
    if (!textarea || textarea.dataset.mdToolbar) return;
    textarea.dataset.mdToolbar = '1';

    var wrapper = document.createElement('div');
    wrapper.className = 'md-editor-wrap';
    wrapper.innerHTML = toolbarHTML;
    textarea.parentNode.insertBefore(wrapper, textarea);
    wrapper.appendChild(textarea);

    wrapper.querySelectorAll('.md-tb-btn').forEach(function(btn) {
      btn.addEventListener('click', function(e) {
        e.preventDefault();
        var action = this.dataset.md;
        switch (action) {
          case 'bold': wrapSelection(textarea, '**', '**'); break;
          case 'italic': wrapSelection(textarea, '*', '*'); break;
          case 'strikethrough': wrapSelection(textarea, '~~', '~~'); break;
          case 'heading': wrapSelection(textarea, '\n## ', ''); break;
          case 'link': wrapSelection(textarea, '[', '](url)'); break;
          case 'image': wrapSelection(textarea, '![', '](url)'); break;
          case 'list': wrapSelection(textarea, '\n- ', ''); break;
          case 'numlist': wrapSelection(textarea, '\n1. ', ''); break;
          case 'code': wrapSelection(textarea, '`', '`'); break;
          case 'quote': wrapSelection(textarea, '\n> ', ''); break;
          case 'hr': wrapSelection(textarea, '\n---\n', ''); break;
          case 'color': insertAtCursor(textarea, '<color=blue>text<reset>'); break;
        }
      });
    });

    textarea.addEventListener('keydown', function(e) {
      if (e.ctrlKey || e.metaKey) {
        switch (e.key) {
          case 'b': e.preventDefault(); wrapSelection(textarea, '**', '**'); break;
          case 'i': e.preventDefault(); wrapSelection(textarea, '*', '*'); break;
          case 'x': e.preventDefault(); wrapSelection(textarea, '~~', '~~'); break;
        }
      }
    });
  }

  // ---- Autosave helpers ----

  // Save a single editor whenever its value changes and it loses focus.
  function attachAutosave(element, saveFn) {
    if (!element || typeof saveFn !== 'function') return;
    if (element.dataset.autosaveBound) return;
    element.dataset.autosaveBound = '1';

    var lastValue = ('value' in element) ? element.value : '';
    function save() {
      var current = ('value' in element) ? element.value : '';
      if (current === lastValue) return;
      lastValue = current;
      saveFn(current, element);
    }
    element.addEventListener('change', save);
    element.addEventListener('blur', save);
  }

  // Autosave a group of editors: mark dirty on input/change, save when focus
  // leaves the container entirely (e.g. clicking away or switching tabs).
  function attachAutosaveContainer(container, saveFn) {
    if (!container || typeof saveFn !== 'function') return;
    if (container.dataset.autosaveContainer) return;
    container.dataset.autosaveContainer = '1';

    var dirty = false;
    container.addEventListener('input', function() { dirty = true; });
    container.addEventListener('change', function() { dirty = true; });
    container.addEventListener('focusout', function(e) {
      if (e.relatedTarget && container.contains(e.relatedTarget)) return;
      if (!dirty) return;
      dirty = false;
      saveFn();
    });
  }

  function initMarkdownEditors() {
    document.querySelectorAll('textarea[data-md], #f_bio').forEach(attachToolbar);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initMarkdownEditors);
  } else {
    initMarkdownEditors();
  }
})();
