// Lightweight Markdown + color-text renderer.
// Named colors resolve to CSS variables so they follow the configured theme.
(function() {
  'use strict';

  var NAMED = {
    red: 'var(--red)',
    dark_red: 'var(--red)',
    blue: 'var(--blue)',
    dark_blue: 'var(--blue)',
    green: 'var(--green)',
    dark_green: 'var(--green)',
    gold: 'var(--accent)',
    accent: 'var(--accent)',
    purple: 'var(--purple)',
    dark_purple: 'var(--purple)',
    pink: 'var(--pink)',
    cyan: 'var(--cyan)',
    aqua: 'var(--cyan)',
    orange: 'var(--orange)',
    yellow: 'var(--yellow)',
    teal: 'var(--teal)',
    lime: 'var(--lime)',
    gray: 'var(--gray)',
    white: 'var(--white)'
  };

  function resolveColor(name) {
    if (Object.prototype.hasOwnProperty.call(NAMED, name)) return NAMED[name];
    if (/^#[0-9a-fA-F]{3,8}$/.test(name)) return name;
    if (/^[0-9a-fA-F]{6}$/.test(name)) return '#' + name;
    return null;
  }

  function esc(str) {
    var d = document.createElement('div');
    d.textContent = str == null ? '' : String(str);
    return d.innerHTML;
  }

  function parseGradient(token) {
    var match = token.match(/^gradient:(.+)$/i);
    if (!match) return null;
    var colors = match[1].split(':').filter(Boolean);
    if (colors.length < 2) return null;
    var stops = colors.map(function(c, i) {
      var color = resolveColor(c) || '#fff';
      return color + ' ' + (i / (colors.length - 1) * 100) + '%';
    });
    return 'linear-gradient(90deg, ' + stops.join(', ') + ')';
  }

  // Convert <color>, <gradient:...>, <reset> tags into nested spans.
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
          var gradient = tag.toLowerCase().indexOf('gradient:') === 0 ? parseGradient(tag) : null;
          if (gradient) {
            result += '<span class="ct-gradient" style="--ct-grad:' + gradient + '">';
            stack.push({ name: 'gradient', close: '</span>' });
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

  // Inline formatting only — no block-level tags. Used for titles, descriptions,
  // list items, single paragraphs and FAQ answers.
  function renderInline(text) {
    if (text == null) return '';
    var codes = [];
    var s = String(text);

    s = s.replace(/`([^`]+)`/g, function(_, code) {
      codes.push(code);
      return '\x00CODE' + (codes.length - 1) + '\x00';
    });

    s = parseColorText(s);

    s = s.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    s = s.replace(/\*(.+?)\*/g, '<em>$1</em>');
    s = s.replace(/\~\~(.+?)\~\~/g, '<del>$1</del>');
    s = s.replace(/\[([^\]]+)\]\(([^)]+)\)/g, function(_, txt, url) {
      var safe = /^(https?:|mailto:|[\/#])/i.test(url);
      if (!safe) return _;
      return '<a href="' + url + '" target="_blank" rel="noopener noreferrer">' + txt + '</a>';
    });

    s = s.replace(/\x00CODE(\d+)\x00/g, function(_, i) {
      return '<code>' + esc(codes[parseInt(i)] || '') + '</code>';
    });

    return s;
  }

  // Full block renderer (fences, tables, headings, lists, quotes, paragraphs).
  function splitTableRow(line) {
    var s = line.trim();
    if (s.charAt(0) === '|') s = s.slice(1);
    if (s.charAt(s.length - 1) === '|') s = s.slice(0, -1);
    var cells = [], cur = '';
    for (var i = 0; i < s.length; i++) {
      var ch = s.charAt(i);
      if (ch === '\\' && i + 1 < s.length && s.charAt(i + 1) === '|') { cur += '|'; i++; }
      else if (ch === '|') { cells.push(cur.trim()); cur = ''; }
      else cur += ch;
    }
    cells.push(cur.trim());
    return cells;
  }

  function renderMarkdown(text) {
    if (text == null) return '';

    var fenced = [], codes = [], tags = [];
    var s = String(text);

    s = s.replace(/```(\w*\n)?([\s\S]*?)```/g, function(_, lang, content) {
      fenced.push(content);
      return '\x00FENCED' + (fenced.length - 1) + '\x00';
    });
    s = s.replace(/`([^`]+)`/g, function(_, code) {
      codes.push(code);
      return '\x00CODE' + (codes.length - 1) + '\x00';
    });
    s = s.replace(/#\w+/g, function(tag) {
      tags.push(tag);
      return '\x00TAG' + (tags.length - 1) + '\x00';
    });

    s = parseColorText(s);

    s = s.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    s = s.replace(/\*(.+?)\*/g, '<em>$1</em>');
    s = s.replace(/\[([^\]]+)\]\(([^)]+)\)/g, function(_, txt, url) {
      var safe = /^(https?:|mailto:|[\/#])/i.test(url);
      if (!safe) return _;
      return '<a href="' + url + '" target="_blank" rel="noopener noreferrer">' + txt + '</a>';
    });

    s = s.replace(/(?:^[ \t]*\|[^\n]*$\n?)+/gm, function(block) {
      var lines = block.split('\n').filter(function(l) { return l.trim() !== ''; });
      if (lines.length < 2) return block;
      var header = splitTableRow(lines[0]);
      var sep = splitTableRow(lines[1]);
      if (!sep.every(function(c) { return /^:?-+:?$/.test(c); })) return block;
      var html = '<div class="md-table-wrap"><table class="md-table"><thead><tr>';
      for (var h = 0; h < header.length; h++) html += '<th>' + header[h] + '</th>';
      html += '</tr></thead><tbody>';
      for (var r = 2; r < lines.length; r++) {
        var cells = splitTableRow(lines[r]);
        html += '<tr>';
        for (var c = 0; c < header.length; c++) html += '<td>' + (cells[c] !== undefined ? cells[c] : '') + '</td>';
        html += '</tr>';
      }
      html += '</tbody></table></div>';
      return html;
    });

    s = s.replace(/^### (.+)$/gm, '<h4>$1</h4>');
    s = s.replace(/^## (.+)$/gm, '<h3>$1</h3>');
    s = s.replace(/^# (.+)$/gm, '<h2>$1</h2>');
    s = s.replace(/^> (.+)$/gm, '<blockquote>$1</blockquote>');
    s = s.replace(/^- (.+)$/gm, '<li>$1</li>');
    s = s.replace(/((?:<li>[\s\S]*?<\/li>\n?)+)/g, '<ul>$1</ul>');
    s = s.replace(/^(.+)$/gm, function(m) {
      if (m.charAt(0) === '<') return m;
      return '<p>' + m + '</p>';
    });

    s = s.replace(/\x00TAG(\d+)\x00/g, function(_, i) {
      var t = tags[parseInt(i)] || '';
      return '<span class="hashtag">' + esc(t) + '</span>';
    });
    s = s.replace(/\x00CODE(\d+)\x00/g, function(_, i) {
      return '<code>' + esc(codes[parseInt(i)] || '') + '</code>';
    });
    s = s.replace(/\x00FENCED(\d+)\x00/g, function(_, i) {
      return '<pre><code>' + esc(fenced[parseInt(i)] || '') + '</code></pre>';
    });

    return s;
  }

  window.renderMarkdown = renderMarkdown;
  window.renderInline = renderInline;
  window.parseColorText = parseColorText;
})();
