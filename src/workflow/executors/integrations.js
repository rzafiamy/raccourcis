/**
 * executors/integrations.js — Platform integration action executors
 *
 * Covers: gitlab, nextcloud, supabase, telegram, signal-cli,
 *         twitter, linkedin
 */

import { loadConfig } from '../../store.js'
import { interpolateStep } from '../interpolate.js'

export default {
  // ── GitLab ──────────────────────────────────────────────────────────────────

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

  // ── Nextcloud ────────────────────────────────────────────────────────────────

  'nextcloud-list-files': async (step, ctx, opts) => {
    const cfg = await loadConfig()
    if (!cfg.nextcloudUrl || !cfg.nextcloudUser) throw new Error('Nextcloud settings incomplete. Open Settings → Nextcloud.')
    const s = interpolateStep(step, ctx)
    const remotePath = (s.path || '/').replace(/\/+$/, '') || '/'

    let davUrl = cfg.nextcloudWebdavUrl
      ? cfg.nextcloudWebdavUrl.replace(/\/$/, '')
      : `${cfg.nextcloudUrl.replace(/\/$/, '')}/remote.php/dav/files/${encodeURIComponent(cfg.nextcloudUser)}`

    davUrl += remotePath

    const creds = btoa(`${cfg.nextcloudUser}:${cfg.nextcloudPassword || ''}`)
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

    const creds = btoa(`${cfg.nextcloudUser}:${cfg.nextcloudPassword || ''}`)
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

    const creds = btoa(`${cfg.nextcloudUser}:${cfg.nextcloudPassword || ''}`)
    const res = await fetch(davUrl, {
      method: 'MKCOL',
      headers: { Authorization: `Basic ${creds}` },
      signal: opts.signal,
    })
    if (!res.ok) throw new Error(`Nextcloud create folder failed (${res.status})`)
    ctx.result = `Folder created: ${remotePath}`
  },

  // ── Supabase ─────────────────────────────────────────────────────────────────

  'supabase-select': async (step, ctx, opts) => {
    const cfg = await loadConfig()
    if (!cfg.supabaseUrl) throw new Error('Supabase URL not set. Open Settings → Supabase.')
    const s = interpolateStep(step, ctx)
    let table = s.table
    let schema = 'public'
    if (table.includes('.')) {
      const parts = table.split('.')
      schema = parts[0]
      table = parts[1]
    }
    const key = cfg.supabaseServiceKey || cfg.supabaseAnonKey
    const url = `${cfg.supabaseUrl.replace(/\/$/, '')}/rest/v1/${table}?select=${encodeURIComponent(s.select || '*')}${s.filter ? '&' + s.filter : ''}`
    const res = await fetch(url, {
      method: 'GET',
      headers: {
        'apikey': key,
        'Authorization': `Bearer ${key}`,
        'Content-Type': 'application/json',
        'Accept-Profile': schema,
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
    let table = s.table
    let schema = 'public'
    if (table.includes('.')) {
      const parts = table.split('.')
      schema = parts[0]
      table = parts[1]
    }
    const key = cfg.supabaseServiceKey || cfg.supabaseAnonKey
    const url = `${cfg.supabaseUrl.replace(/\/$/, '')}/rest/v1/${table}`
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'apikey': key,
        'Authorization': `Bearer ${key}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation',
        'Content-Profile': schema,
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
    let table = s.table
    let schema = 'public'
    if (table.includes('.')) {
      const parts = table.split('.')
      schema = parts[0]
      table = parts[1]
    }
    const key = cfg.supabaseServiceKey || cfg.supabaseAnonKey
    const url = `${cfg.supabaseUrl.replace(/\/$/, '')}/rest/v1/${table}?${s.filter}`
    const res = await fetch(url, {
      method: 'PATCH',
      headers: {
        'apikey': key,
        'Authorization': `Bearer ${key}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation',
        'Content-Profile': schema,
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
    let table = s.table
    let schema = 'public'
    if (table.includes('.')) {
      const parts = table.split('.')
      schema = parts[0]
      table = parts[1]
    }
    const key = cfg.supabaseServiceKey || cfg.supabaseAnonKey
    const url = `${cfg.supabaseUrl.replace(/\/$/, '')}/rest/v1/${table}?${s.filter}`
    const res = await fetch(url, {
      method: 'DELETE',
      headers: {
        'apikey': key,
        'Authorization': `Bearer ${key}`,
        'Content-Type': 'application/json',
        'Content-Profile': schema,
      },
      signal: opts.signal,
    })
    if (!res.ok) {
      const b = await res.json().catch(() => ({}))
      throw new Error(b.message || `Supabase delete failed (${res.status})`)
    }
    ctx.result = `Deleted from ${table} in ${schema} where ${s.filter}`
  },

  'supabase-rpc': async (step, ctx, opts) => {
    const cfg = await loadConfig()
    if (!cfg.supabaseUrl) throw new Error('Supabase URL not set. Open Settings → Supabase.')
    const s = interpolateStep(step, ctx)
    let functionName = s.functionName
    let schema = 'public'
    if (functionName.includes('.')) {
      const parts = functionName.split('.')
      schema = parts[0]
      functionName = parts[1]
    }
    const key = cfg.supabaseServiceKey || cfg.supabaseAnonKey
    const url = `${cfg.supabaseUrl.replace(/\/$/, '')}/rest/v1/rpc/${functionName}`
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'apikey': key,
        'Authorization': `Bearer ${key}`,
        'Content-Type': 'application/json',
        'Accept-Profile': schema,
        'Content-Profile': schema,
      },
      body: s.params || '{}',
      signal: opts.signal,
    })
    if (!res.ok) {
      const b = await res.json().catch(() => ({}))
      throw new Error(b.message || `Supabase RPC failed (${res.status})`)
    }
    const data = await res.json()
    ctx.result = JSON.stringify(data, null, 2)
  },

  'supabase-upload': async (step, ctx, opts) => {
    const cfg = await loadConfig()
    if (!cfg.supabaseUrl) throw new Error('Supabase URL not set. Open Settings → Supabase.')
    const s = interpolateStep(step, ctx)
    const rawPaths = s.path || ctx.result
    if (!rawPaths) throw new Error('Supabase Upload: no file path provided.')

    const filePaths = rawPaths.split('\n').filter(Boolean)
    const uploadedFiles = []
    const key = cfg.supabaseServiceKey || cfg.supabaseAnonKey

    for (const filePath of filePaths) {
      const fileName = filePath.split('/').pop()
      const destPath = s.destPath || fileName
      const url = `${cfg.supabaseUrl.replace(/\/$/, '')}/storage/v1/object/${s.bucket}/${destPath}`

      const base64 = await window.ipcRenderer.readFileBase64(filePath)
      const binaryStr = atob(base64)
      const bytes = new Uint8Array(binaryStr.length)
      for (let i = 0; i < binaryStr.length; i++) bytes[i] = binaryStr.charCodeAt(i)

      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'apikey': key,
          'Authorization': `Bearer ${key}`,
          'Content-Type': 'application/octet-stream',
          'x-upsert': 'true'
        },
        body: bytes,
        signal: opts.signal,
      })

      if (!res.ok) {
        const b = await res.json().catch(() => ({}))
        throw new Error(b.error || b.message || `Supabase upload failed for ${fileName} (${res.status})`)
      }
      uploadedFiles.push(destPath)
    }

    ctx.result = uploadedFiles.join(', ')
  },

  // ── Messaging ────────────────────────────────────────────────────────────────

  'telegram-send': async (step, ctx, opts) => {
    const cfg = await loadConfig()
    if (!cfg.telegramBotToken) throw new Error('Telegram bot token not set. Open Settings → Services.')
    const s = interpolateStep(step, ctx)
    const chatId = s.chatId
    if (!chatId) throw new Error('Telegram: chat ID is required.')
    const text = s.text || ctx.result
    if (!text) throw new Error('Telegram: message text is required.')
    const body = { chat_id: chatId, text }
    if (s.parseMode) body.parse_mode = s.parseMode
    const res = await fetch(`https://api.telegram.org/bot${cfg.telegramBotToken}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: opts.signal,
      body: JSON.stringify(body),
    })
    if (!res.ok) {
      const b = await res.json().catch(() => ({}))
      throw new Error(b.description || `Telegram sendMessage failed (${res.status})`)
    }
    const data = await res.json()
    ctx.result = `Message sent (id: ${data.result?.message_id})`
  },

  'telegram-send-file': async (step, ctx, _opts) => {
    const cfg = await loadConfig()
    if (!cfg.telegramBotToken) throw new Error('Telegram bot token not set. Open Settings → Services.')
    const s = interpolateStep(step, ctx)
    const chatId = s.chatId
    if (!chatId) throw new Error('Telegram: chat ID is required.')
    const filePath = s.filePath || ctx.result
    if (!filePath) throw new Error('Telegram Send File: no file path provided.')

    const result = await window.ipcRenderer.invoke('telegram-send-file', {
      token: cfg.telegramBotToken,
      chatId,
      filePath,
      caption: s.caption || '',
    })
    if (!result.ok) throw new Error(result.error || 'Telegram file send failed')
    ctx.result = `File sent (id: ${result.messageId})`
  },

  'signal-cli-send': async (step, ctx, _opts) => {
    const cfg = await loadConfig()
    const sender = cfg.signalSender
    if (!sender) throw new Error('Signal sender number not set. Open Settings → Services.')
    const s = interpolateStep(step, ctx)
    const recipient = s.recipient
    if (!recipient) throw new Error('Signal: recipient is required.')
    const message = s.message || ctx.result
    if (!message) throw new Error('Signal: message is required.')

    const result = await window.ipcRenderer.invoke('signal-cli-send', {
      sender,
      recipient,
      message,
    })
    if (!result.ok) throw new Error(result.error || 'signal-cli send failed')
    ctx.result = `Signal message sent to ${recipient}`
  },

  'twitter-post': async (step, ctx, opts) => {
    const cfg = await loadConfig()
    if (!cfg.twitterBearerToken && !cfg.twitterOAuthToken) throw new Error('Twitter credentials not set. Open Settings → Services.')
    const s = interpolateStep(step, ctx)
    const text = s.text || ctx.result
    if (!text) throw new Error('Twitter: tweet text is required.')
    if (text.length > 280) throw new Error(`Twitter: tweet is ${text.length} chars, max is 280.`)

    const authHeader = cfg.twitterOAuthToken
      ? `OAuth ${cfg.twitterOAuthToken}`
      : `Bearer ${cfg.twitterBearerToken}`

    const res = await fetch('https://api.twitter.com/2/tweets', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: authHeader,
      },
      signal: opts.signal,
      body: JSON.stringify({ text }),
    })
    if (!res.ok) {
      const b = await res.json().catch(() => ({}))
      const msg = b.detail || b.errors?.[0]?.message || `Twitter post failed (${res.status})`
      throw new Error(msg)
    }
    const data = await res.json()
    const tweetId = data.data?.id
    ctx.result = tweetId
      ? `https://twitter.com/i/web/status/${tweetId}`
      : 'Tweet posted.'
  },

  'linkedin-post': async (step, ctx, opts) => {
    const cfg = await loadConfig()
    if (!cfg.linkedinAccessToken || !cfg.linkedinPersonUrn) throw new Error('LinkedIn access token / person URN not set. Open Settings → Services.')
    const s = interpolateStep(step, ctx)
    const text = s.text || ctx.result
    if (!text) throw new Error('LinkedIn: post content is required.')
    const visibility = s.visibility || 'PUBLIC'

    const body = {
      author: cfg.linkedinPersonUrn,
      lifecycleState: 'PUBLISHED',
      specificContent: {
        'com.linkedin.ugc.ShareContent': {
          shareCommentary: { text },
          shareMediaCategory: 'NONE',
        },
      },
      visibility: { 'com.linkedin.ugc.MemberNetworkVisibility': visibility },
    }
    const res = await fetch('https://api.linkedin.com/v2/ugcPosts', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${cfg.linkedinAccessToken}`,
        'X-Restli-Protocol-Version': '2.0.0',
      },
      signal: opts.signal,
      body: JSON.stringify(body),
    })
    if (!res.ok) {
      const b = await res.json().catch(() => ({}))
      throw new Error(b.message || `LinkedIn post failed (${res.status})`)
    }
    const postUrn = res.headers.get('x-restli-id') || 'unknown'
    ctx.result = `LinkedIn post published (URN: ${postUrn})`
  },
}
