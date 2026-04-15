/**
 * aiClients.js — Low-level API client wrappers for AI services
 *
 * Exports: optimizeImage, getSystemPreamble, callAI, callTTS, callASR,
 *          callImageGen, callVision
 */

import { loadConfig } from '../store.js'

/**
 * Resizes a base64 or data URL image to a max dimension for API efficiency.
 */
export async function optimizeImage(dataUrl, maxWidth = 1024) {
  return new Promise((resolve) => {
    const img = new Image()
    img.onload = () => {
      let { width, height } = img
      if (width > maxWidth) {
        const ratio = maxWidth / width
        width = maxWidth
        height = height * ratio
      }
      const canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = height
      const ctx = canvas.getContext('2d')
      ctx.drawImage(img, 0, 0, width, height)
      resolve(canvas.toDataURL('image/jpeg', 0.85))
    }
    img.onerror = () => resolve(dataUrl) // Fallback to original
    img.src = dataUrl
  })
}

export async function getSystemPreamble() {
  const cfg = await loadConfig()
  const now = new Date()
  const dateStr = now.toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
  const timeStr = now.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })

  let preamble = `Current time: ${dateStr}, ${timeStr}.\n`
  if (cfg.preferredLanguage) preamble += `User preferred language: ${cfg.preferredLanguage}. Please respond in this language unless the task implies otherwise.\n`
  if (cfg.userLocation) preamble += `User location: ${cfg.userLocation}.\n`

  return preamble.trim()
}

// ── AI chat completion ─────────────────────────────────────────────────────────

export async function callAI(prompt, systemPrompt, signal, onDebug) {
  const cfg = await loadConfig()
  if (!cfg.apiKey) throw new Error('API key not set. Open Settings to add your key.')

  const preamble = await getSystemPreamble()
  const finalSystemPrompt = `${preamble}\n\n${systemPrompt || 'You are a helpful assistant.'}`

  const url = `${cfg.baseUrl}/chat/completions`
  const body = {
    model: cfg.model,
    messages: [
      { role: 'system', content: finalSystemPrompt },
      { role: 'user', content: prompt },
    ],
  }

  if (onDebug) onDebug({ url, method: 'POST', body })

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${cfg.apiKey}`,
    },
    signal,
    body: JSON.stringify(body),
  })

  if (!res.ok) {
    const bodyErr = await res.json().catch(() => ({}))
    if (onDebug) onDebug(null, { status: res.status, body: bodyErr })
    throw new Error(bodyErr.error?.message || `AI request failed (${res.status})`)
  }

  const data = await res.json()
  if (onDebug) onDebug(null, { status: res.status, body: data })
  return data.choices[0].message.content
}

// ── TTS ───────────────────────────────────────────────────────────────────────

export async function callTTS(text, voice, model, signal, onDebug) {
  const cfg = await loadConfig()
  if (!cfg.apiKey) throw new Error('API key not set. Open Settings to add your key.')

  const url = `${cfg.baseUrl}/audio/speech`
  const body = { model: model || 'tts-1', input: text, voice: voice ?? '' }

  if (onDebug) onDebug({ url, method: 'POST', body })

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${cfg.apiKey}`,
    },
    signal,
    body: JSON.stringify(body),
  })

  if (!res.ok) {
    const bodyErr = await res.json().catch(() => ({}))
    if (onDebug) onDebug(null, { status: res.status, body: bodyErr })
    throw new Error(bodyErr.error?.message || `TTS request failed (${res.status})`)
  }

  const data = await res.arrayBuffer()
  if (onDebug) onDebug(null, { status: res.status, body: '<Binary Audio Data>' })
  return new Uint8Array(data)
}

// ── ASR ───────────────────────────────────────────────────────────────────────

export async function callASR(fileBase64, fileName, language, model, signal, onDebug) {
  const cfg = await loadConfig()
  if (!cfg.apiKey) throw new Error('API key not set. Open Settings to add your key.')

  // Rebuild binary from base64
  const binaryStr = atob(fileBase64)
  const bytes = new Uint8Array(binaryStr.length)
  for (let i = 0; i < binaryStr.length; i++) bytes[i] = binaryStr.charCodeAt(i)
  const blob = new Blob([bytes])

  const form = new FormData()
  form.append('file', blob, fileName)
  form.append('model', model || cfg.asrModel || 'whisper-1')
  if (language) form.append('language', language)

  const url = `${cfg.baseUrl}/audio/transcriptions`
  if (onDebug) onDebug({ url, method: 'POST', body: 'FormData (Audio File)' })

  const res = await fetch(url, {
    method: 'POST',
    headers: { Authorization: `Bearer ${cfg.apiKey}` },
    signal,
    body: form,
  })

  if (!res.ok) {
    const bodyErr = await res.json().catch(() => ({}))
    if (onDebug) onDebug(null, { status: res.status, body: bodyErr })
    throw new Error(bodyErr.error?.message || `ASR request failed (${res.status})`)
  }

  const data = await res.json()
  if (onDebug) onDebug(null, { status: res.status, body: data })
  return data.text
}

// ── Image generation ──────────────────────────────────────────────────────────

export async function callImageGen(prompt, size, quality, model, signal, onDebug) {
  const cfg = await loadConfig()
  if (!cfg.apiKey) throw new Error('API key not set. Open Settings to add your key.')

  const url = `${cfg.baseUrl}/images/generations`
  const body = {
    model: model || cfg.imageGenModel || 'dall-e-3',
    prompt,
    n: 1,
    size: size || '1024x1024',
    quality: quality || 'standard',
  }

  if (onDebug) onDebug({ url, method: 'POST', body })

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${cfg.apiKey}`,
    },
    signal,
    body: JSON.stringify(body),
  })

  if (!res.ok) {
    const bodyErr = await res.json().catch(() => ({}))
    if (onDebug) onDebug(null, { status: res.status, body: bodyErr })
    throw new Error(bodyErr.error?.message || `Image generation failed (${res.status})`)
  }

  const data = await res.json()
  if (onDebug) onDebug(null, { status: res.status, body: data })

  const img = data.data?.[0]
  if (!img) throw new Error('Image generation returned no data.')
  return img.url || `data:image/png;base64,${img.b64_json}`
}

// ── Vision ────────────────────────────────────────────────────────────────────

export async function callVision(imageUrl, prompt, systemPrompt, model, signal, onDebug) {
  const cfg = await loadConfig()
  if (!cfg.apiKey) throw new Error('API key not set. Open Settings to add your key.')

  const url = `${cfg.baseUrl}/chat/completions`

  // Move system prompt into user text for better compatibility with local vision models
  let finalPrompt = prompt || 'Describe this image.'
  if (systemPrompt && systemPrompt !== 'You are a helpful vision assistant.') {
    finalPrompt = `${systemPrompt}\n\nTask: ${finalPrompt}`
  }

  const messages = [
    {
      role: 'user',
      content: [
        { type: 'image_url', image_url: { url: imageUrl } },
        { type: 'text', text: finalPrompt },
      ],
    },
  ]

  const body = {
    model: model || cfg.model,
    messages
  }

  if (onDebug) onDebug({ url, method: 'POST', body: { ...body, messages: '[Image Data]' } })

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${cfg.apiKey}`,
    },
    signal,
    body: JSON.stringify(body),
  })

  if (!res.ok) {
    const bodyErr = await res.json().catch(() => ({}))
    if (onDebug) onDebug(null, { status: res.status, body: bodyErr })
    throw new Error(bodyErr.error?.message || `Vision request failed (${res.status})`)
  }

  const data = await res.json()
  if (onDebug) onDebug(null, { status: res.status, body: data })
  return data.choices[0].message.content
}
