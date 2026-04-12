/**
 * workflow.js — Deterministic workflow executor
 *
 * Responsibilities:
 *   - Execute steps sequentially, passing context between them
 *   - Variable substitution ({{result}}, {{clipboard}}, {{vars.foo}})
 *   - Per-step timing and debug log
 *   - Cancellation via AbortController
 *   - AI calls via fetch (OpenAI-compatible)
 *   - User-input prompts via callback
 *   - Shell execution via Electron IPC
 *
 * Public API:
 *   runWorkflow(shortcut, options) → Promise<RunResult>
 *
 * RunResult:
 *   { ok, result, log, error, durationMs }
 */

import { loadConfig } from './store.js'

/**
 * Substitute {{result}}, {{clipboard}}, {{vars.name}} in a string.
 */
function interpolate(template, ctx) {
  if (typeof template !== 'string') return template
  return template
    .replace(/\{\{result\}\}/g, ctx.result ?? '')
    .replace(/\{\{clipboard\}\}/g, ctx.clipboard ?? '')
    .replace(/\{\{vars\.(\w+)\}\}/g, (_, name) => ctx.vars[name] ?? '')
}

/**
 * Interpolate all string values in a step's params.
 */
function interpolateStep(step, ctx) {
  const out = {}
  for (const [k, v] of Object.entries(step)) {
    out[k] = typeof v === 'string' ? interpolate(v, ctx) : v
  }
  return out
}

async function getSystemPreamble() {
  const cfg = await loadConfig()
  const now = new Date()
  const dateStr = now.toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
  const timeStr = now.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })
  
  let preamble = `Current time: ${dateStr}, ${timeStr}.\n`
  if (cfg.preferredLanguage) preamble += `User preferred language: ${cfg.preferredLanguage}. Please respond in this language unless the task implies otherwise.\n`
  if (cfg.userLocation) preamble += `User location: ${cfg.userLocation}.\n`
  
  return preamble.trim()
}

// ── AI call ───────────────────────────────────────────────────────────────────

async function callAI(prompt, systemPrompt, signal) {
  const cfg = await loadConfig()
  if (!cfg.apiKey) throw new Error('API key not set. Open Settings to add your key.')

  const preamble = await getSystemPreamble()
  const finalSystemPrompt = `${preamble}\n\n${systemPrompt || 'You are a helpful assistant.'}`

  const res = await fetch(`${cfg.baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${cfg.apiKey}`,
    },
    signal,
    body: JSON.stringify({
      model: cfg.model,
      messages: [
        { role: 'system', content: finalSystemPrompt },

        { role: 'user', content: prompt },
      ],
    }),
  })

  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body.error?.message || `AI request failed (${res.status})`)
  }

  const data = await res.json()
  return data.choices[0].message.content
}

// ── TTS call ──────────────────────────────────────────────────────────────────

async function callTTS(text, voice, model, signal) {
  const cfg = await loadConfig()
  if (!cfg.apiKey) throw new Error('API key not set. Open Settings to add your key.')

  const res = await fetch(`${cfg.baseUrl}/audio/speech`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${cfg.apiKey}`,
    },
    signal,
    body: JSON.stringify({ model: model || 'tts-1', input: text, voice: voice || 'alloy' }),
  })

  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body.error?.message || `TTS request failed (${res.status})`)
  }

  // Return as Uint8Array so we can hand it to IPC for file saving
  const buf = await res.arrayBuffer()
  return new Uint8Array(buf)
}

// ── ASR call ──────────────────────────────────────────────────────────────────

async function callASR(fileBase64, fileName, language, signal) {
  const cfg = await loadConfig()
  if (!cfg.apiKey) throw new Error('API key not set. Open Settings to add your key.')

  // Rebuild binary from base64
  const binaryStr = atob(fileBase64)
  const bytes = new Uint8Array(binaryStr.length)
  for (let i = 0; i < binaryStr.length; i++) bytes[i] = binaryStr.charCodeAt(i)
  const blob = new Blob([bytes])

  const form = new FormData()
  form.append('file', blob, fileName)
  form.append('model', 'whisper-1')
  if (language) form.append('language', language)

  const res = await fetch(`${cfg.baseUrl}/audio/transcriptions`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${cfg.apiKey}` },
    signal,
    body: form,
  })

  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body.error?.message || `ASR request failed (${res.status})`)
  }

  const data = await res.json()
  return data.text
}

// ── Image generation call ─────────────────────────────────────────────────────

async function callImageGen(prompt, size, quality, signal) {
  const cfg = await loadConfig()
  if (!cfg.apiKey) throw new Error('API key not set. Open Settings to add your key.')

  const res = await fetch(`${cfg.baseUrl}/images/generations`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${cfg.apiKey}`,
    },
    signal,
    body: JSON.stringify({
      model: 'dall-e-3',
      prompt,
      n: 1,
      size: size || '1024x1024',
      quality: quality || 'standard',
    }),
  })

  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body.error?.message || `Image generation failed (${res.status})`)
  }

  const data = await res.json()
  return data.data[0].url
}

// ── Vision call ───────────────────────────────────────────────────────────────

async function callVision(imageUrl, prompt, systemPrompt, signal) {
  const cfg = await loadConfig()
  if (!cfg.apiKey) throw new Error('API key not set. Open Settings to add your key.')

  const preamble = await getSystemPreamble()
  const finalSystemPrompt = `${preamble}\n\n${systemPrompt || 'You are a helpful vision assistant.'}`

  const res = await fetch(`${cfg.baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${cfg.apiKey}`,
    },
    signal,
    body: JSON.stringify({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: finalSystemPrompt },

        {
          role: 'user',
          content: [
            { type: 'image_url', image_url: { url: imageUrl } },
            { type: 'text', text: prompt || 'Describe this image.' },
          ],
        },
      ],
    }),
  })

  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body.error?.message || `Vision request failed (${res.status})`)
  }

  const data = await res.json()
  return data.choices[0].message.content
}

// ── Step executors ────────────────────────────────────────────────────────────

const EXECUTORS = {
  'clipboard-read': async (_step, ctx, _opts) => {
    const text = await window.ipcRenderer.clipboard.readText()
    if (!text) throw new Error('Clipboard is empty.')
    ctx.clipboard = text
    ctx.result = text
  },

  'clipboard-write': async (step, ctx, _opts) => {
    const s = interpolateStep(step, ctx)
    const text = s.text || ctx.result
    window.ipcRenderer.clipboard.writeText(text)
    // result unchanged — write is a side effect
  },

  'user-input': async (step, ctx, opts) => {
    const s = interpolateStep(step, ctx)
    if (!opts.promptUser) throw new Error('user-input step requires a promptUser callback.')
    const value = await opts.promptUser({
      label: s.label || 'Your input',
      placeholder: s.placeholder || '',
      prefill: ctx.result,
    })
    if (value === null) throw new Error('User cancelled input.')
    ctx.result = value
  },

  'ai-prompt': async (step, ctx, opts) => {
    const s = interpolateStep(step, ctx)
    const prompt = s.prompt || ctx.result
    const systemPrompt = s.systemPrompt || 'You are a helpful assistant.'
    ctx.result = await callAI(prompt, systemPrompt, opts.signal)
  },

  'show-result': async (_step, ctx, opts) => {
    // Signals the runner to display result after completion; no-op here.
    if (opts.onShowResult) opts.onShowResult(ctx.result)
  },

  'url-open': async (step, ctx, _opts) => {
    const s = interpolateStep(step, ctx)
    const url = s.url || ctx.result
    window.ipcRenderer.send('open-external', url)
  },

  wait: async (step, _ctx, _opts) => {
    const ms = Number(step.duration) || 1000
    await new Promise((resolve) => setTimeout(resolve, ms))
  },

  shell: async (step, ctx, _opts) => {
    const s = interpolateStep(step, ctx)
    const { stdout, stderr, exitCode } = await window.ipcRenderer.invoke('shell-exec', s.command)
    if (exitCode !== 0) throw new Error(`Shell exited ${exitCode}: ${stderr}`)
    ctx.result = stdout.trimEnd()
  },

  'set-var': async (step, ctx, _opts) => {
    const name = step.varName || 'result'
    ctx.vars[name] = ctx.result
  },

  tts: async (step, ctx, opts) => {
    const s = interpolateStep(step, ctx)
    const text = s.text || ctx.result
    if (!text) throw new Error('TTS: no text to speak.')
    const audioBytes = await callTTS(text, s.voice, s.model, opts.signal)
    // Save to temp file so it can be played / previewed
    const filePath = await window.ipcRenderer.saveTempFile(Array.from(audioBytes), 'mp3')
    // Play immediately in background
    window.ipcRenderer.playAudio(filePath)
    // Expose path as result for downstream steps
    ctx.result = filePath
    ctx.vars._ttsFile = filePath
    if (opts.onShowResult) opts.onShowResult(filePath, 'audio')
  },

  asr: async (step, ctx, opts) => {
    const s = interpolateStep(step, ctx)
    const filePath = s.filePath || ctx.result
    if (!filePath) throw new Error('ASR: no audio file path provided.')
    const base64 = await window.ipcRenderer.readFileBase64(filePath)
    const fileName = filePath.split('/').pop() || 'audio.mp3'
    ctx.result = await callASR(base64, fileName, s.language || '', opts.signal)
  },

  'image-gen': async (step, ctx, opts) => {
    const s = interpolateStep(step, ctx)
    const prompt = s.prompt || ctx.result
    if (!prompt) throw new Error('Image generation: no prompt provided.')
    const url = await callImageGen(prompt, s.size, s.quality, opts.signal)
    ctx.result = url
    ctx.vars._imageUrl = url
    if (opts.onShowResult) opts.onShowResult(url, 'image')
  },

  'image-vision': async (step, ctx, opts) => {
    const s = interpolateStep(step, ctx)
    const imageUrl = s.imageUrl || ctx.result
    if (!imageUrl) throw new Error('Vision: no image URL provided.')
    ctx.result = await callVision(imageUrl, s.prompt, s.systemPrompt, opts.signal)
  },

  // ── Services ──────────────────────────────────────────────────────────────────

  'firecrawl-scrape': async (step, ctx, opts) => {
    const cfg = await loadConfig()
    if (!cfg.firecrawlApiKey) throw new Error('Firecrawl API key not set. Open Settings → Services.')
    const s = interpolateStep(step, ctx)
    const url = s.url || ctx.result
    if (!url) throw new Error('Firecrawl: no URL provided.')
    const res = await fetch(`${cfg.firecrawlBaseUrl || 'https://api.firecrawl.dev'}/v1/scrape`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${cfg.firecrawlApiKey}`,
      },
      signal: opts.signal,
      body: JSON.stringify({ url, formats: [s.formats || 'markdown'] }),
    })
    if (!res.ok) {
      const body = await res.json().catch(() => ({}))
      throw new Error(body.error || `Firecrawl scrape failed (${res.status})`)
    }
    const data = await res.json()
    ctx.result = data.data?.[s.formats || 'markdown'] || data.data?.markdown || JSON.stringify(data.data)
  },

  'google-search': async (step, ctx, opts) => {
    const cfg = await loadConfig()
    if (!cfg.googleApiKey) throw new Error('Google API key not set. Open Settings → Services.')
    if (!cfg.googleCseId) throw new Error('Google CSE ID not set. Open Settings → Services.')
    const s = interpolateStep(step, ctx)
    const query = s.query || ctx.result
    if (!query) throw new Error('Google Search: no query provided.')
    const num = Math.min(Math.max(Number(s.numResults) || 5, 1), 10)
    const url = `https://www.googleapis.com/customsearch/v1?key=${cfg.googleApiKey}&cx=${cfg.googleCseId}&q=${encodeURIComponent(query)}&num=${num}`
    const res = await fetch(url, { signal: opts.signal })
    if (!res.ok) {
      const body = await res.json().catch(() => ({}))
      throw new Error(body.error?.message || `Google Search failed (${res.status})`)
    }
    const data = await res.json()
    const items = data.items || []
    ctx.result = items
      .map((item, i) => `${i + 1}. ${item.title}\n   ${item.link}\n   ${item.snippet || ''}`)
      .join('\n\n')
  },

  'youtube-search': async (step, ctx, opts) => {
    const cfg = await loadConfig()
    if (!cfg.youtubeApiKey) throw new Error('YouTube API key not set. Open Settings → Services.')
    const s = interpolateStep(step, ctx)
    const query = s.query || ctx.result
    if (!query) throw new Error('YouTube Search: no query provided.')
    const maxResults = Math.min(Math.max(Number(s.maxResults) || 5, 1), 50)
    const url = `https://www.googleapis.com/youtube/v3/search?key=${cfg.youtubeApiKey}&q=${encodeURIComponent(query)}&part=snippet&type=video&maxResults=${maxResults}`
    const res = await fetch(url, { signal: opts.signal })
    if (!res.ok) {
      const body = await res.json().catch(() => ({}))
      throw new Error(body.error?.message || `YouTube Search failed (${res.status})`)
    }
    const data = await res.json()
    const items = data.items || []
    ctx.result = items
      .map((item, i) => {
        const vid = item.id?.videoId
        const title = item.snippet?.title || 'Untitled'
        const channel = item.snippet?.channelTitle || ''
        return `${i + 1}. ${title} — ${channel}\n   https://www.youtube.com/watch?v=${vid}`
      })
      .join('\n\n')
  },

  'wikipedia-search': async (step, ctx, opts) => {
    const s = interpolateStep(step, ctx)
    const query = s.query || ctx.result
    if (!query) throw new Error('Wikipedia: no query provided.')
    const sentences = Math.max(Number(s.sentences) || 5, 1)
    const searchUrl = `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(query)}&format=json&origin=*&srlimit=1`
    const searchRes = await fetch(searchUrl, { signal: opts.signal })
    if (!searchRes.ok) throw new Error(`Wikipedia search failed (${searchRes.status})`)
    const searchData = await searchRes.json()
    const firstResult = searchData.query?.search?.[0]
    if (!firstResult) { ctx.result = 'No Wikipedia article found.'; return }
    const title = firstResult.title
    const summaryUrl = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`
    const summaryRes = await fetch(summaryUrl, { signal: opts.signal })
    if (!summaryRes.ok) throw new Error(`Wikipedia summary failed (${summaryRes.status})`)
    const summaryData = await summaryRes.json()
    const fullExtract = summaryData.extract || ''
    const sentenceArr = fullExtract.match(/[^.!?]+[.!?]+/g) || [fullExtract]
    ctx.result = `${summaryData.title}\n\n${sentenceArr.slice(0, sentences).join(' ')}\n\nSource: ${summaryData.content_urls?.desktop?.page || ''}`
  },

  'google-calendar-list': async (step, ctx, opts) => {
    const cfg = await loadConfig()
    if (!cfg.googleCalendarToken) throw new Error('Google Calendar token not set. Open Settings → Services.')
    const s = interpolateStep(step, ctx)
    const maxResults = Math.max(Number(s.maxResults) || 10, 1)
    const timeMin = s.timeMin || new Date().toISOString()
    const url = `https://www.googleapis.com/calendar/v3/calendars/primary/events?maxResults=${maxResults}&timeMin=${encodeURIComponent(timeMin)}&singleEvents=true&orderBy=startTime`
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${cfg.googleCalendarToken}` },
      signal: opts.signal,
    })
    if (!res.ok) {
      const body = await res.json().catch(() => ({}))
      throw new Error(body.error?.message || `Google Calendar failed (${res.status})`)
    }
    const data = await res.json()
    const events = data.items || []
    if (events.length === 0) { ctx.result = 'No upcoming events found.'; return }
    ctx.result = events
      .map((ev, i) => {
        const start = ev.start?.dateTime || ev.start?.date || ''
        return `${i + 1}. ${ev.summary || '(no title)'}\n   ${start}${ev.location ? '\n   ' + ev.location : ''}`
      })
      .join('\n\n')
  },

  'gmail-send': async (step, ctx, opts) => {
    const cfg = await loadConfig()
    if (!cfg.gmailToken) throw new Error('Gmail token not set. Open Settings → Services.')
    const s = interpolateStep(step, ctx)
    if (!s.to) throw new Error('Gmail: recipient address is required.')
    const subject = s.subject || '(no subject)'
    const body = s.body || ctx.result
    const raw = btoa(
      `To: ${s.to}\r\nSubject: ${subject}\r\nContent-Type: text/plain; charset=UTF-8\r\n\r\n${body}`,
    ).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
    const res = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${cfg.gmailToken}`,
      },
      signal: opts.signal,
      body: JSON.stringify({ raw }),
    })
    if (!res.ok) {
      const b = await res.json().catch(() => ({}))
      throw new Error(b.error?.message || `Gmail send failed (${res.status})`)
    }
    ctx.result = `Email sent to ${s.to}`
  },

  weather: async (step, ctx, opts) => {
    const cfg = await loadConfig()
    if (!cfg.openWeatherApiKey) throw new Error('OpenWeatherMap API key not set. Open Settings → Services.')
    const s = interpolateStep(step, ctx)
    const location = s.location || ctx.result
    if (!location) throw new Error('Weather: no location provided.')
    const units = s.units || 'metric'
    const url = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(location)}&units=${units}&appid=${cfg.openWeatherApiKey}`
    const res = await fetch(url, { signal: opts.signal })
    if (!res.ok) {
      const body = await res.json().catch(() => ({}))
      throw new Error(body.message || `Weather request failed (${res.status})`)
    }
    const d = await res.json()
    const unitSymbol = units === 'imperial' ? '°F' : units === 'standard' ? 'K' : '°C'
    ctx.result = [
      `Weather in ${d.name}, ${d.sys?.country}`,
      `Condition: ${d.weather?.[0]?.description}`,
      `Temperature: ${d.main?.temp}${unitSymbol} (feels like ${d.main?.feels_like}${unitSymbol})`,
      `Humidity: ${d.main?.humidity}%`,
      `Wind: ${d.wind?.speed} ${units === 'imperial' ? 'mph' : 'm/s'}`,
      `Visibility: ${d.visibility ? (d.visibility / 1000).toFixed(1) + ' km' : 'N/A'}`,
    ].join('\n')
  },

  'smtp-send': async (step, ctx, opts) => {
    const cfg = await loadConfig()
    if (!cfg.smtpHost) throw new Error('SMTP host not set. Open Settings → SMTP.')
    const s = interpolateStep(step, ctx)
    if (!s.to) throw new Error('SMTP: recipient address is required.')
    const result = await window.ipcRenderer.invoke('smtp-send', {
      host:     cfg.smtpHost,
      port:     Number(cfg.smtpPort) || 587,
      secure:   cfg.smtpSecure === true || cfg.smtpSecure === 'true',
      user:     cfg.smtpUser,
      pass:     cfg.smtpPass,
      from:     cfg.smtpFrom || cfg.smtpUser,
      to:       s.to,
      subject:  s.subject || '(no subject)',
      text:     s.body || ctx.result,
    })
    if (!result.ok) throw new Error(result.error || 'SMTP send failed')
    ctx.result = `Email sent to ${s.to}`
  },

  // ── GitLab ────────────────────────────────────────────────────────────────────

  'gitlab-list-issues': async (step, ctx, opts) => {
    const cfg = await loadConfig()
    if (!cfg.gitlabToken) throw new Error('GitLab token not set. Open Settings → GitLab.')
    const s = interpolateStep(step, ctx)
    const projectId = encodeURIComponent(s.projectId || ctx.result)
    if (!projectId) throw new Error('GitLab: project ID or path is required.')
    const max = Math.max(Number(s.maxResults) || 10, 1)
    const base = (cfg.gitlabBaseUrl || 'https://gitlab.com').replace(/\/$/, '')
    const params = new URLSearchParams({ state: s.state || 'opened', per_page: max })
    const res = await fetch(`${base}/api/v4/projects/${projectId}/issues?${params}`, {
      headers: { 'PRIVATE-TOKEN': cfg.gitlabToken },
      signal: opts.signal,
    })
    if (!res.ok) {
      const b = await res.json().catch(() => ({}))
      throw new Error(b.message || `GitLab issues failed (${res.status})`)
    }
    const items = await res.json()
    ctx.result = items.map((i, idx) =>
      `${idx + 1}. #${i.iid} ${i.title}\n   State: ${i.state} | Author: ${i.author?.name}\n   ${i.web_url}`,
    ).join('\n\n') || 'No issues found.'
  },

  'gitlab-create-issue': async (step, ctx, opts) => {
    const cfg = await loadConfig()
    if (!cfg.gitlabToken) throw new Error('GitLab token not set. Open Settings → GitLab.')
    const s = interpolateStep(step, ctx)
    const projectId = encodeURIComponent(s.projectId || '')
    if (!projectId) throw new Error('GitLab: project ID or path is required.')
    const base = (cfg.gitlabBaseUrl || 'https://gitlab.com').replace(/\/$/, '')
    const body = { title: s.title || 'New Issue', description: s.description || ctx.result }
    const res = await fetch(`${base}/api/v4/projects/${projectId}/issues`, {
      method: 'POST',
      headers: { 'PRIVATE-TOKEN': cfg.gitlabToken, 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: opts.signal,
    })
    if (!res.ok) {
      const b = await res.json().catch(() => ({}))
      throw new Error(b.message || `GitLab create issue failed (${res.status})`)
    }
    const issue = await res.json()
    ctx.result = `Issue created: #${issue.iid} ${issue.title}\n${issue.web_url}`
  },

  'gitlab-list-mrs': async (step, ctx, opts) => {

    const cfg = await loadConfig()
    if (!cfg.gitlabToken) throw new Error('GitLab token not set. Open Settings → GitLab.')
    const s = interpolateStep(step, ctx)
    const projectId = encodeURIComponent(s.projectId || ctx.result)
    if (!projectId) throw new Error('GitLab: project ID or path is required.')
    const max = Math.max(Number(s.maxResults) || 10, 1)
    const base = (cfg.gitlabBaseUrl || 'https://gitlab.com').replace(/\/$/, '')
    const params = new URLSearchParams({ state: s.state || 'opened', per_page: max })
    const res = await fetch(`${base}/api/v4/projects/${projectId}/merge_requests?${params}`, {
      headers: { 'PRIVATE-TOKEN': cfg.gitlabToken },
      signal: opts.signal,
    })
    if (!res.ok) {
      const b = await res.json().catch(() => ({}))
      throw new Error(b.message || `GitLab MRs failed (${res.status})`)
    }
    const items = await res.json()
    ctx.result = items.map((mr, idx) =>
      `${idx + 1}. !${mr.iid} ${mr.title}\n   ${mr.source_branch} → ${mr.target_branch} | ${mr.state}\n   ${mr.web_url}`,
    ).join('\n\n') || 'No merge requests found.'
  },

  'gitlab-pipelines': async (step, ctx, opts) => {
    const cfg = await loadConfig()
    if (!cfg.gitlabToken) throw new Error('GitLab token not set. Open Settings → GitLab.')
    const s = interpolateStep(step, ctx)
    const projectId = encodeURIComponent(s.projectId || ctx.result)
    if (!projectId) throw new Error('GitLab: project ID or path is required.')
    const max = Math.max(Number(s.maxResults) || 10, 1)
    const base = (cfg.gitlabBaseUrl || 'https://gitlab.com').replace(/\/$/, '')
    const params = new URLSearchParams({ per_page: max })
    if (s.status) params.set('status', s.status)
    const res = await fetch(`${base}/api/v4/projects/${projectId}/pipelines?${params}`, {
      headers: { 'PRIVATE-TOKEN': cfg.gitlabToken },
      signal: opts.signal,
    })
    if (!res.ok) {
      const b = await res.json().catch(() => ({}))
      throw new Error(b.message || `GitLab pipelines failed (${res.status})`)
    }
    const items = await res.json()
    ctx.result = items.map((p, idx) =>
      `${idx + 1}. #${p.id} [${p.status.toUpperCase()}] ${p.ref}\n   ${p.created_at?.slice(0, 10)} — ${p.web_url}`,
    ).join('\n\n') || 'No pipelines found.'
  },

  // ── QR Code ───────────────────────────────────────────────────────────────────

  'qr-code': async (step, ctx, opts) => {
    const s = interpolateStep(step, ctx)
    const text = s.text || ctx.result
    if (!text) throw new Error('QR Code: no text provided.')
    const size = Math.max(Number(s.size) || 300, 50)
    const ecc  = s.ecc || 'M'
    const url = `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&ecc=${ecc}&data=${encodeURIComponent(text)}`
    ctx.result = url
    ctx.vars._qrUrl = url
    if (opts.onShowResult) opts.onShowResult(url, 'image')
  },

  // ── Nextcloud ─────────────────────────────────────────────────────────────────

  'nextcloud-list-files': async (step, ctx, opts) => {
    const cfg = await loadConfig()
    if (!cfg.nextcloudUrl || !cfg.nextcloudUser) throw new Error('Nextcloud settings incomplete. Open Settings → Nextcloud.')
    const s = interpolateStep(step, ctx)
    const remotePath = (s.path || '/').replace(/\/+$/, '') || '/'
    
    // Use user-provided WebDAV URL or construct from base URL
    let davUrl = cfg.nextcloudWebdavUrl 
      ? cfg.nextcloudWebdavUrl.replace(/\/$/, '') 
      : `${cfg.nextcloudUrl.replace(/\/$/, '')}/remote.php/dav/files/${encodeURIComponent(cfg.nextcloudUser)}`
    
    davUrl += remotePath

    const creds  = btoa(`${cfg.nextcloudUser}:${cfg.nextcloudPassword || ''}`)
    const res = await fetch(davUrl, {
      method: 'PROPFIND',
      headers: {
        Authorization: `Basic ${creds}`,
        Depth: '1',
        'Content-Type': 'application/xml',
      },
      body: `<?xml version="1.0"?><d:propfind xmlns:d="DAV:"><d:prop><d:displayname/><d:getcontenttype/><d:getlastmodified/></d:prop></d:propfind>`,
      signal: opts.signal,
    })
    if (!res.ok) throw new Error(`Nextcloud list failed (${res.status})`)
    const xml = await res.text()
    const matches = [...xml.matchAll(/<d:displayname>([^<]+)<\/d:displayname>/g)]
    const names = matches.map((m) => m[1]).filter((n) => n !== remotePath.split('/').pop())
    ctx.result = names.length > 0 ? names.join('\n') : 'Directory is empty.'
  },


  'nextcloud-upload': async (step, ctx, opts) => {
    const cfg = await loadConfig()
    if (!cfg.nextcloudUrl || !cfg.nextcloudUser) throw new Error('Nextcloud settings incomplete. Open Settings → Nextcloud.')
    const s = interpolateStep(step, ctx)
    const localPath  = s.localPath || ctx.result
    const remotePath = s.remotePath || `/Uploads/${localPath.split('/').pop()}`
    if (!localPath) throw new Error('Nextcloud upload: no local file path provided.')
    
    const base64 = await window.ipcRenderer.readFileBase64(localPath)
    const binaryStr = atob(base64)
    const bytes = new Uint8Array(binaryStr.length)
    for (let i = 0; i < binaryStr.length; i++) bytes[i] = binaryStr.charCodeAt(i)

    let davUrl = cfg.nextcloudWebdavUrl 
      ? cfg.nextcloudWebdavUrl.replace(/\/$/, '') 
      : `${cfg.nextcloudUrl.replace(/\/$/, '')}/remote.php/dav/files/${encodeURIComponent(cfg.nextcloudUser)}`
    
    davUrl += remotePath

    const creds   = btoa(`${cfg.nextcloudUser}:${cfg.nextcloudPassword || ''}`)
    const res = await fetch(davUrl, {
      method: 'PUT',
      headers: { Authorization: `Basic ${creds}` },
      body: bytes,
      signal: opts.signal,
    })
    if (!res.ok) throw new Error(`Nextcloud upload failed (${res.status})`)
    ctx.result = `Uploaded to ${remotePath}`
  },


  'nextcloud-note': async (step, ctx, opts) => {
    const cfg = await loadConfig()
    if (!cfg.nextcloudUrl || !cfg.nextcloudUser) throw new Error('Nextcloud settings incomplete. Open Settings → Nextcloud.')
    const s = interpolateStep(step, ctx)
    const base  = cfg.nextcloudUrl.replace(/\/$/, '')
    const creds = btoa(`${cfg.nextcloudUser}:${cfg.nextcloudPassword || ''}`)
    const body  = { title: s.title || 'New Note', content: s.content || ctx.result }
    if (s.category) body.category = s.category
    const res = await fetch(`${base}/index.php/apps/notes/api/v1/notes`, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${creds}`,
        'Content-Type': 'application/json',
        'OCS-APIRequest': 'true',
      },
      body: JSON.stringify(body),
      signal: opts.signal,
    })
    if (!res.ok) throw new Error(`Nextcloud note creation failed (${res.status})`)
    const note = await res.json()
    ctx.result = `Note created: ${note.title} (ID: ${note.id})`
  },


  'nextcloud-create-folder': async (step, ctx, opts) => {
    const cfg = await loadConfig()
    if (!cfg.nextcloudUrl || !cfg.nextcloudUser) throw new Error('Nextcloud settings incomplete. Open Settings → Nextcloud.')
    const s = interpolateStep(step, ctx)
    const remotePath = (s.path || '/New Folder').replace(/\/+$/, '')
    
    let davUrl = cfg.nextcloudWebdavUrl 
      ? cfg.nextcloudWebdavUrl.replace(/\/$/, '') 
      : `${cfg.nextcloudUrl.replace(/\/$/, '')}/remote.php/dav/files/${encodeURIComponent(cfg.nextcloudUser)}`
    
    davUrl += remotePath

    const creds  = btoa(`${cfg.nextcloudUser}:${cfg.nextcloudPassword || ''}`)
    const res = await fetch(davUrl, {
      method: 'MKCOL',
      headers: { Authorization: `Basic ${creds}` },
      signal: opts.signal,
    })
    if (!res.ok) throw new Error(`Nextcloud create folder failed (${res.status})`)
    ctx.result = `Folder created: ${remotePath}`
  },


  // ── Supabase ──────────────────────────────────────────────────────────────────

  'supabase-select': async (step, ctx, opts) => {
    const cfg = await loadConfig()
    if (!cfg.supabaseUrl) throw new Error('Supabase URL not set. Open Settings → Supabase.')
    const s = interpolateStep(step, ctx)
    const url = `${cfg.supabaseUrl.replace(/\/$/, '')}/rest/v1/${s.table}?select=${encodeURIComponent(s.select || '*')}${s.filter ? '&' + s.filter : ''}`
    const res = await fetch(url, {
      method: 'GET',
      headers: {
        'apikey': cfg.supabaseAnonKey,
        'Authorization': `Bearer ${cfg.supabaseServiceKey || cfg.supabaseAnonKey}`,
        'Content-Type': 'application/json',
      },
      signal: opts.signal,
    })
    if (!res.ok) {
      const b = await res.json().catch(() => ({}))
      throw new Error(b.message || `Supabase select failed (${res.status})`)
    }
    const data = await res.json()
    ctx.result = JSON.stringify(data, null, 2)
  },

  'supabase-insert': async (step, ctx, opts) => {
    const cfg = await loadConfig()
    if (!cfg.supabaseUrl) throw new Error('Supabase URL not set. Open Settings → Supabase.')
    const s = interpolateStep(step, ctx)
    const url = `${cfg.supabaseUrl.replace(/\/$/, '')}/rest/v1/${s.table}`
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'apikey': cfg.supabaseAnonKey,
        'Authorization': `Bearer ${cfg.supabaseServiceKey || cfg.supabaseAnonKey}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation',
      },
      body: s.data || ctx.result,
      signal: opts.signal,
    })
    if (!res.ok) {
      const b = await res.json().catch(() => ({}))
      throw new Error(b.message || `Supabase insert failed (${res.status})`)
    }
    const data = await res.json()
    ctx.result = JSON.stringify(data[0] || data, null, 2)
  },

  'supabase-update': async (step, ctx, opts) => {
    const cfg = await loadConfig()
    if (!cfg.supabaseUrl) throw new Error('Supabase URL not set. Open Settings → Supabase.')
    const s = interpolateStep(step, ctx)
    const url = `${cfg.supabaseUrl.replace(/\/$/, '')}/rest/v1/${s.table}?${s.filter}`
    const res = await fetch(url, {
      method: 'PATCH',
      headers: {
        'apikey': cfg.supabaseAnonKey,
        'Authorization': `Bearer ${cfg.supabaseServiceKey || cfg.supabaseAnonKey}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation',
      },
      body: s.data || ctx.result,
      signal: opts.signal,
    })
    if (!res.ok) {
      const b = await res.json().catch(() => ({}))
      throw new Error(b.message || `Supabase update failed (${res.status})`)
    }
    const data = await res.json()
    ctx.result = JSON.stringify(data, null, 2)
  },

  'supabase-delete': async (step, ctx, opts) => {
    const cfg = await loadConfig()
    if (!cfg.supabaseUrl) throw new Error('Supabase URL not set. Open Settings → Supabase.')
    const s = interpolateStep(step, ctx)
    const url = `${cfg.supabaseUrl.replace(/\/$/, '')}/rest/v1/${s.table}?${s.filter}`
    const res = await fetch(url, {
      method: 'DELETE',
      headers: {
        'apikey': cfg.supabaseAnonKey,
        'Authorization': `Bearer ${cfg.supabaseServiceKey || cfg.supabaseAnonKey}`,
        'Content-Type': 'application/json',
      },
      signal: opts.signal,
    })
    if (!res.ok) {
      const b = await res.json().catch(() => ({}))
      throw new Error(b.message || `Supabase delete failed (${res.status})`)
    }
    ctx.result = `Deleted from ${s.table} where ${s.filter}`
  },
}



// ── Main runner ───────────────────────────────────────────────────────────────

/**
 * @param {object} shortcut — the shortcut definition with .steps[]
 * @param {object} options
 *   signal         AbortSignal   — for cancellation
 *   promptUser     async fn      — for user-input steps
 *   onStepStart    fn(i, step)   — progress callback
 *   onStepEnd      fn(i, entry)  — called after each step with log entry
 *   onShowResult   fn(text)      — called by show-result step
 * @returns {Promise<{ok, result, log, error, durationMs}>}
 */
export async function runWorkflow(shortcut, options = {}) {
  const { signal, promptUser, onStepStart, onStepEnd, onShowResult } = options

  /** Mutable shared context — the "pipe" between steps */
  const ctx = {
    result: '',
    clipboard: '',
    vars: {},
    log: [],
  }

  const opts = { signal, promptUser, onShowResult }
  const wallStart = Date.now()

  try {
    for (let i = 0; i < shortcut.steps.length; i++) {
      if (signal?.aborted) throw new Error('Workflow cancelled.')

      const step = shortcut.steps[i]
      const stepStart = Date.now()

      if (onStepStart) onStepStart(i, step)

      const inputSnapshot = ctx.result

      const executor = EXECUTORS[step.type]
      if (!executor) {
        throw new Error(`Unknown action type: "${step.type}". Add it to actions.js.`)
      }

      try {
        await executor(step, ctx, opts)

        const entry = {
          index: i,
          type: step.type,
          title: step.title,
          ms: Date.now() - stepStart,
          input: inputSnapshot,
          output: ctx.result,
          error: null,
        }
        ctx.log.push(entry)
        if (onStepEnd) onStepEnd(i, entry)
      } catch (err) {
        const entry = {
          index: i,
          type: step.type,
          title: step.title,
          ms: Date.now() - stepStart,
          input: inputSnapshot,
          output: null,
          error: err.message,
        }
        ctx.log.push(entry)
        if (onStepEnd) onStepEnd(i, entry)
        throw err // re-throw to stop the workflow
      }
    }

    return {
      ok: true,
      result: ctx.result,
      log: ctx.log,
      error: null,
      durationMs: Date.now() - wallStart,
    }
  } catch (err) {
    return {
      ok: false,
      result: ctx.result,
      log: ctx.log,
      error: err.message,
      durationMs: Date.now() - wallStart,
    }
  }
}
