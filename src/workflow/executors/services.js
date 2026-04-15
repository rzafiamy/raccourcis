/**
 * executors/services.js — Third-party web service action executors
 *
 * Covers: firecrawl, google-search, youtube-search, wikipedia-search,
 *         google-calendar-list, gmail-send, smtp-send, weather, weather-forecast,
 *         qr-code, webhook-post, youtube-download
 */

import { loadConfig } from '../../store.js'
import { interpolateStep } from '../interpolate.js'

export default {
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

  'weather-forecast': async (step, ctx, opts) => {
    const cfg = await loadConfig()
    if (!cfg.openWeatherApiKey) throw new Error('OpenWeatherMap API key not set. Open Settings → Services.')
    const s = interpolateStep(step, ctx)
    const location = s.location || ctx.result
    if (!location) throw new Error('Weather Forecast: no location provided.')
    const units = s.units || 'metric'
    const url = `https://api.openweathermap.org/data/2.5/forecast?q=${encodeURIComponent(location)}&units=${units}&appid=${cfg.openWeatherApiKey}`
    const res = await fetch(url, { signal: opts.signal })
    if (!res.ok) {
      const body = await res.json().catch(() => ({}))
      throw new Error(body.message || `Weather forecast request failed (${res.status})`)
    }
    const d = await res.json()
    ctx.result = JSON.stringify(d)
  },

  'smtp-send': async (step, ctx, opts) => {
    const cfg = await loadConfig()
    if (!cfg.smtpHost) throw new Error('SMTP host not set. Open Settings → SMTP.')
    const s = interpolateStep(step, ctx)
    if (!s.to) throw new Error('SMTP: recipient address is required.')
    const body = s.body || ctx.result
    const isHtml = /<[a-z][\s\S]*>/i.test(body)
    const result = await window.ipcRenderer.invoke('smtp-send', {
      host:     cfg.smtpHost,
      port:     Number(cfg.smtpPort) || 587,
      secure:   cfg.smtpSecure === true || cfg.smtpSecure === 'true',
      user:     cfg.smtpUser,
      pass:     cfg.smtpPass,
      from:     cfg.smtpFrom || cfg.smtpUser,
      to:       s.to,
      subject:  s.subject || '(no subject)',
      text:     isHtml ? undefined : body,
      html:     isHtml ? body : undefined,
    })
    if (!result.ok) throw new Error(result.error || 'SMTP send failed')
    ctx.result = `Email sent to ${s.to}`
  },

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

  'webhook-post': async (step, ctx, opts) => {
    const s = interpolateStep(step, ctx)
    const url = s.url
    if (!url) throw new Error('Webhook POST: URL is required.')
    const rawBody = s.body || JSON.stringify({ text: ctx.result })

    let extraHeaders = {}
    if (s.headers) {
      try { extraHeaders = JSON.parse(s.headers) } catch { throw new Error('Webhook POST: headers must be valid JSON.') }
    }

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...extraHeaders,
      },
      signal: opts.signal,
      body: rawBody,
    })
    if (!res.ok) {
      const b = await res.text().catch(() => '')
      throw new Error(`Webhook POST failed (${res.status}): ${b.slice(0, 200)}`)
    }
    const responseText = await res.text()
    ctx.result = responseText || `Webhook delivered (${res.status})`
  },

  'youtube-download': async (step, ctx, opts) => {
    const s = interpolateStep(step, ctx)
    const url = s.url || ctx.result
    if (!url) throw new Error('YouTube Download: no URL provided.')
    const format = s.format || 'best'
    const outputDir = s.outputDir || ''
    const filename = s.filename || '%(title)s.%(ext)s'

    let cmd = `yt-dlp -o "${outputDir ? outputDir + '/' : ''}${filename}"`
    if (format === 'mp3') cmd += ' -x --audio-format mp3'
    else if (format === 'wav') cmd += ' -x --audio-format wav'
    else if (format === 'mp4') cmd += ' -f "bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best"'

    cmd += ` "${url}"`

    const { stdout, stderr, exitCode } = await window.ipcRenderer.invoke('shell-exec', {
      command: cmd,
      runId: opts.runId
    })
    if (exitCode !== 0) throw new Error(`YouTube Download failed: ${stderr}`)

    const match = stdout.match(/\[download\] Destination: (.+)/)
    if (match) ctx.result = match[1].trim()
    else ctx.result = 'Download completed in ' + (outputDir || 'current directory')
  },
}
