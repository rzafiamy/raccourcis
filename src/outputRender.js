/**
 * outputRender.js — Smart output renderer for the result panel
 *
 * Public API:
 *   renderOutput(content, kind) → HTMLElement
 *   detectKind(content)         → 'text' | 'markdown' | 'json' | 'code'
 *                                  | 'image' | 'audio' | 'file' | 'list' | 'error'
 *   copyText(el)                → string  (plain text extracted from any rendered el)
 *
 * kind values match workflow outputType + special cases:
 *   'text'     → plain text, auto-upgrades to markdown/code/json if detected
 *   'markdown' → force markdown render
 *   'json'     → force JSON code block
 *   'code'     → force code block (syntax highlighted)
 *   'image'    → img viewer with zoom
 *   'audio'    → HTML5 audio player
 *   'file'     → local file path — show + open/reveal buttons
 *   'list'     → newline-separated items rendered as a styled list
 *   'error'    → red pre block
 */

// ── Detection helpers ─────────────────────────────────────────────────────────

const IMAGE_URL_RE = /\.(png|jpe?g|webp|gif|svg|bmp)(\?.*)?$/i
const AUDIO_EXT_RE = /\.(mp3|wav|ogg|flac|m4a|aac)$/i
const LOCAL_PATH_RE = /^(\/|~\/|[A-Z]:\\)/

function looksLikeJson(str) {
  const s = str.trim()
  return (s.startsWith('{') || s.startsWith('[')) && (s.endsWith('}') || s.endsWith(']'))
}

function looksLikeMarkdown(str) {
  // Presence of common MD patterns
  return /^#{1,6} .+/m.test(str) ||
    /\*\*.+\*\*/.test(str) ||
    /^\s*[-*] .+/m.test(str) ||
    /^\s*\d+\. .+/m.test(str) ||
    /```[\s\S]*```/.test(str) ||
    /\[.+\]\(.+\)/.test(str)
}

function looksLikeCode(str) {
  // Looks like source code but not markdown
  return /^(import |export |function |const |let |var |class |def |if \(|for \(|while \()/.test(str.trim()) ||
    /[{};]\s*$/.test(str.trim())
}

function looksLikeBulletList(str) {
  const lines = str.trim().split('\n').filter(l => l.trim())
  if (lines.length < 2) return false
  const bulletLines = lines.filter(l => /^[-*•]\s/.test(l.trim()))
  return bulletLines.length >= Math.floor(lines.length * 0.6)
}

function looksLikeNumberedList(str) {
  const lines = str.trim().split('\n').filter(l => l.trim())
  if (lines.length < 2) return false
  const numLines = lines.filter(l => /^\d+[.)]\s/.test(l.trim()))
  return numLines.length >= Math.floor(lines.length * 0.6)
}

/** Auto-detect the best rendering kind for a string value. */
export function detectKind(content) {
  if (typeof content !== 'string') return 'text'
  const s = content.trim()
  if (!s) return 'text'

  // Image
  if (s.startsWith('data:image/') || (s.startsWith('http') && IMAGE_URL_RE.test(s))) return 'image'
  if (s.startsWith('http') && (
    s.includes('oaidalleapiprodscus') || s.includes('replicate.delivery') ||
    s.includes('together.xyz') || s.includes('api.qrserver.com')
  )) return 'image'

  // Audio local path
  if (LOCAL_PATH_RE.test(s) && AUDIO_EXT_RE.test(s)) return 'audio'

  // Local file path (non-audio)
  if (LOCAL_PATH_RE.test(s) && !s.includes('\n')) return 'file'

  // JSON
  if (looksLikeJson(s)) return 'json'

  // Markdown (check before code — MD headers win)
  if (looksLikeMarkdown(s)) return 'markdown'

  // Code
  if (looksLikeCode(s)) return 'code'

  return 'text'
}

// ── Lightweight Markdown renderer ─────────────────────────────────────────────

function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

/** Minimal MD → HTML — no external deps. Handles the common subset. */
function renderMarkdown(md) {
  // Extract fenced code blocks first to protect them
  const codeBlocks = []
  let s = md.replace(/```([^\n]*)\n([\s\S]*?)```/g, (_, lang, code) => {
    const idx = codeBlocks.push({ lang: lang.trim(), code }) - 1
    return `%%CODE_BLOCK_${idx}%%`
  })

  // Inline code
  s = s.replace(/`([^`]+)`/g, (_, c) => `<code class="md-inline-code">${escapeHtml(c)}</code>`)

  // Headers
  s = s.replace(/^###### (.+)$/gm, '<h6>$1</h6>')
  s = s.replace(/^##### (.+)$/gm, '<h5>$1</h5>')
  s = s.replace(/^#### (.+)$/gm, '<h4>$1</h4>')
  s = s.replace(/^### (.+)$/gm, '<h3>$1</h3>')
  s = s.replace(/^## (.+)$/gm, '<h2>$1</h2>')
  s = s.replace(/^# (.+)$/gm, '<h1>$1</h1>')

  // Bold + italic
  s = s.replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>')
  s = s.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
  s = s.replace(/\*(.+?)\*/g, '<em>$1</em>')
  s = s.replace(/__(.+?)__/g, '<strong>$1</strong>')
  s = s.replace(/_(.+?)_/g, '<em>$1</em>')

  // Strikethrough
  s = s.replace(/~~(.+?)~~/g, '<del>$1</del>')

  // Horizontal rule
  s = s.replace(/^---+$/gm, '<hr>')

  // Links
  s = s.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="md-link" target="_blank" rel="noopener">$1</a>')

  // Blockquotes
  s = s.replace(/^> (.+)$/gm, '<blockquote>$1</blockquote>')

  // Unordered lists — group consecutive items
  s = s.replace(/((?:^[ \t]*[-*•] .+\n?)+)/gm, (block) => {
    const items = block.trim().split('\n')
      .map(l => l.replace(/^[ \t]*[-*•] /, '').trim())
      .filter(Boolean)
      .map(i => `<li>${i}</li>`)
      .join('')
    return `<ul>${items}</ul>`
  })

  // Ordered lists
  s = s.replace(/((?:^[ \t]*\d+[.)]\s.+\n?)+)/gm, (block) => {
    const items = block.trim().split('\n')
      .map(l => l.replace(/^[ \t]*\d+[.)]\s/, '').trim())
      .filter(Boolean)
      .map(i => `<li>${i}</li>`)
      .join('')
    return `<ol>${items}</ol>`
  })

  // Tables
  s = s.replace(/^[ \t]*\|(.+)\|[ \t]*\r?\n[ \t]*\|([- :|]+)\|[ \t]*\r?\n((?:[ \t]*\|.+\|[ \t]*\r?\n?)+)/gm, (match, header, separator, rows) => {
    const headers = header.split('|').map(h => h.trim()).filter(h => h !== '')
    const rowLines = rows.trim().split('\n')
    const htmlRows = rowLines.map(line => {
      // Split and filter out empty strings from start/end
      const cells = line.split('|').map(c => c.trim()).filter((_, i, arr) => i > 0 && i < arr.length - 1)
      return `<tr>${cells.map(c => `<td>${escapeHtml(c)}</td>`).join('')}</tr>`
    }).join('')
    const htmlHeaders = `<tr>${headers.map(h => `<th>${escapeHtml(h)}</th>`).join('')}</tr>`
    return `<div class="or-table-wrapper"><table class="or-table"><thead>${htmlHeaders}</thead><tbody>${htmlRows}</tbody></table></div>`
  })

  // Paragraphs — wrap remaining text lines
  s = s.replace(/^(?!<[a-z]|%%CODE_BLOCK)(.+)$/gm, (line) => {
    if (!line.trim()) return ''
    return `<p>${line}</p>`
  })

  // Restore code blocks
  s = s.replace(/%%CODE_BLOCK_(\d+)%%/g, (_, idx) => {
    const { lang, code } = codeBlocks[idx]
    const highlighted = syntaxHighlight(code, lang)
    return `<div class="or-code-block"><div class="or-code-header"><span class="or-code-lang">${escapeHtml(lang || 'code')}</span><button class="or-code-copy" data-code="${escapeHtml(code)}">Copy</button></div><pre class="or-code-pre">${highlighted}</pre></div>`
  })

  // Collapse multiple blank lines
  s = s.replace(/(<\/h[1-6]>|<\/p>|<\/ul>|<\/ol>|<\/blockquote>|<hr>)\s*\n\s*\n/g, '$1\n')

  return s
}

// ── Syntax highlighter (no deps — token-based) ────────────────────────────────

const KEYWORDS = new Set([
  'const', 'let', 'var', 'function', 'return', 'if', 'else', 'for', 'while',
  'class', 'import', 'export', 'default', 'from', 'async', 'await', 'new',
  'typeof', 'instanceof', 'null', 'undefined', 'true', 'false', 'try', 'catch',
  'throw', 'in', 'of', 'switch', 'case', 'break', 'continue', 'this', 'super',
  'extends', 'static', 'get', 'set', 'yield', 'delete', 'void',
  // Python
  'def', 'pass', 'lambda', 'with', 'as', 'not', 'and', 'or', 'is', 'elif',
  'except', 'finally', 'raise', 'global', 'nonlocal', 'assert',
])

function syntaxHighlight(code, _lang) {
  // Simple token-coloring without a real lexer — good enough for readability
  return escapeHtml(code)
    // Strings (single/double/template)
    .replace(/(&#34;[^&#34;]*&#34;|&#39;[^&#39;]*&#39;|`[^`]*`)/g, '<span class="tok-string">$1</span>')
    // Comments
    .replace(/(\/\/[^\n]*)/g, '<span class="tok-comment">$1</span>')
    .replace(/(#[^\n]*)/g, '<span class="tok-comment">$1</span>')
    // Numbers
    .replace(/\b(\d+\.?\d*)\b/g, '<span class="tok-number">$1</span>')
    // Keywords
    .replace(/\b(const|let|var|function|return|if|else|for|while|class|import|export|default|from|async|await|new|typeof|instanceof|null|undefined|true|false|try|catch|throw|in|of|switch|case|break|continue|this|super|extends|static|get|set|yield|delete|void|def|pass|lambda|with|as|not|and|or|is|elif|except|finally|raise|global|nonlocal|assert)\b/g,
      '<span class="tok-keyword">$1</span>')
    // Function calls
    .replace(/\b([a-zA-Z_$][\w$]*)\s*(?=\()/g, '<span class="tok-fn">$1</span>')
}

// ── JSON renderer ─────────────────────────────────────────────────────────────

function renderJson(str) {
  let parsed
  try {
    parsed = JSON.parse(str)
  } catch {
    // Not valid JSON — fall back to code block
    return renderCode(str, 'json')
  }
  const pretty = JSON.stringify(parsed, null, 2)
  const highlighted = syntaxHighlight(pretty, 'json')
  return `<div class="or-code-block"><div class="or-code-header"><span class="or-code-lang">json</span><button class="or-code-copy" data-code="${escapeHtml(pretty)}">Copy</button></div><pre class="or-code-pre">${highlighted}</pre></div>`
}

// ── Code renderer ─────────────────────────────────────────────────────────────

function renderCode(str, lang = '') {
  const highlighted = syntaxHighlight(str, lang)
  return `<div class="or-code-block"><div class="or-code-header"><span class="or-code-lang">${escapeHtml(lang || 'code')}</span><button class="or-code-copy" data-code="${escapeHtml(str)}">Copy</button></div><pre class="or-code-pre">${highlighted}</pre></div>`
}

// ── List renderer ─────────────────────────────────────────────────────────────

function renderList(str) {
  const lines = str.trim().split('\n').filter(l => l.trim())
  const items = lines.map(line => {
    const clean = line.replace(/^[-*•\d.)\s]+/, '').trim()
    return `<li class="or-list-item">${escapeHtml(clean)}</li>`
  }).join('')
  return `<ul class="or-list">${items}</ul>`
}

// ── File viewer ───────────────────────────────────────────────────────────────

function renderFile(filePath) {
  const name = filePath.split('/').pop()
  const ext  = name.split('.').pop().toLowerCase()

  if (/^(png|jpe?g|webp|gif|svg|bmp)$/.test(ext)) {
    return `
      <div class="or-file">
        <img src="file://${filePath}" class="or-image" alt="${escapeHtml(name)}" />
        <div class="or-file-meta">
          <span class="or-file-name">${escapeHtml(name)}</span>
          <div class="or-file-actions">
            <button class="or-btn" data-action="reveal" data-path="${escapeHtml(filePath)}">Show in folder</button>
          </div>
        </div>
      </div>`
  }

  if (/^(mp3|wav|ogg|flac|m4a|aac)$/.test(ext)) {
    return `
      <div class="or-file">
        <audio controls class="or-audio"><source src="file://${filePath}"></audio>
        <div class="or-file-meta">
          <span class="or-file-name">${escapeHtml(name)}</span>
          <div class="or-file-actions">
            <button class="or-btn" data-action="reveal" data-path="${escapeHtml(filePath)}">Show in folder</button>
          </div>
        </div>
      </div>`
  }

  if (/^(mp4|webm|mov|mkv|avi)$/.test(ext)) {
    return `
      <div class="or-file">
        <video controls class="or-video"><source src="file://${filePath}"></video>
        <div class="or-file-meta">
          <span class="or-file-name">${escapeHtml(name)}</span>
          <div class="or-file-actions">
            <button class="or-btn" data-action="reveal" data-path="${escapeHtml(filePath)}">Show in folder</button>
          </div>
        </div>
      </div>`
  }

  // Generic file
  return `
    <div class="or-file or-file-generic">
      <div class="or-file-icon">📄</div>
      <div class="or-file-meta">
        <span class="or-file-name">${escapeHtml(name)}</span>
        <span class="or-file-path">${escapeHtml(filePath)}</span>
        <div class="or-file-actions">
          <button class="or-btn" data-action="open" data-path="${escapeHtml(filePath)}">Open</button>
          <button class="or-btn" data-action="reveal" data-path="${escapeHtml(filePath)}">Show in folder</button>
        </div>
      </div>
    </div>`
}

// ── Image viewer ──────────────────────────────────────────────────────────────

function renderImage(src) {
  return `
    <div class="or-image-wrap">
      <img src="${escapeHtml(src)}" class="or-image" alt="Output image"
           onerror="this.parentElement.innerHTML='<div class=or-error>Image failed to load or URL expired.</div>'" />
    </div>`
}

// ── Audio player ──────────────────────────────────────────────────────────────

function renderAudio(src) {
  const resolved = src.startsWith('/') ? `file://${src}` : src
  return `<audio controls class="or-audio"><source src="${escapeHtml(resolved)}"></audio>`
}

// ── Plain text ────────────────────────────────────────────────────────────────

function renderText(str) {
  return `<pre class="or-pre">${escapeHtml(str)}</pre>`
}

// ── Error ─────────────────────────────────────────────────────────────────────

function renderError(str) {
  return `<pre class="or-pre or-error">${escapeHtml(str)}</pre>`
}

// ── Wire up interactive buttons inside a rendered element ─────────────────────

function wireInteractions(el) {
  // Code-block copy buttons
  el.querySelectorAll('.or-code-copy').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation()
      const code = btn.dataset.code || ''
      window.ipcRenderer.clipboard.writeText(code)
      btn.textContent = 'Copied!'
      setTimeout(() => (btn.textContent = 'Copy'), 1500)
    })
  })

  // File action buttons
  el.querySelectorAll('[data-action]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation()
      const { action, path } = btn.dataset
      if (action === 'reveal') window.ipcRenderer.revealInFolder(path)
      if (action === 'open')   window.ipcRenderer.send('open-external', `file://${path}`)
    })
  })

  // Image zoom on click
  el.querySelectorAll('.or-image').forEach(img => {
    img.style.cursor = 'zoom-in'
    img.addEventListener('click', () => {
      const overlay = document.createElement('div')
      overlay.className = 'or-zoom-overlay'
      overlay.innerHTML = `<img src="${img.src}" class="or-zoom-img" />`
      overlay.addEventListener('click', () => overlay.remove())
      document.body.appendChild(overlay)
    })
  })

  // Markdown links — open externally
  el.querySelectorAll('.md-link').forEach(a => {
    a.addEventListener('click', (e) => {
      e.preventDefault()
      window.ipcRenderer.send('open-external', a.href)
    })
  })
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Render `content` into a DOM element appropriate for its kind.
 * If kind is 'text' (or omitted), auto-detects the best renderer.
 *
 * @param {string} content
 * @param {'text'|'markdown'|'json'|'code'|'image'|'audio'|'file'|'list'|'error'|string} kind
 * @returns {{ el: HTMLElement, copyText: string, kind: string }}
 */
export function renderOutput(content, kind = 'text') {
  // Auto-detect when caller passes 'text' or nothing
  const resolvedKind = (kind === 'text' || !kind) ? detectKind(content) : kind

  const wrap = document.createElement('div')
  wrap.className = `or-output or-kind-${resolvedKind}`

  let html = ''
  let copyText = content

  switch (resolvedKind) {
    case 'markdown':
      html = renderMarkdown(content)
      copyText = content
      break
    case 'json':
      html = renderJson(content)
      try { copyText = JSON.stringify(JSON.parse(content), null, 2) } catch { copyText = content }
      break
    case 'code':
      html = renderCode(content)
      copyText = content
      break
    case 'image':
      html = renderImage(content)
      copyText = content   // the URL
      break
    case 'audio':
      html = renderAudio(content)
      copyText = content
      break
    case 'file':
      html = renderFile(content)
      copyText = content
      break
    case 'list':
      html = looksLikeMarkdown(content)
        ? renderMarkdown(content)
        : renderList(content)
      copyText = content
      break
    case 'error':
      html = renderError(content)
      copyText = content
      break
    default:
      html = renderText(content)
      copyText = content
  }

  wrap.innerHTML = html
  wireInteractions(wrap)

  return { el: wrap, copyText, kind: resolvedKind }
}

/**
 * Extract plain copyable text from any rendered output element.
 */
export function extractCopyText(el) {
  return el.innerText || el.textContent || ''
}
