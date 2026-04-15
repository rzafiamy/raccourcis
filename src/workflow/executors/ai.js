/**
 * executors/ai.js — AI-powered action executors
 *
 * Covers: ai-prompt, tts, asr, image-gen, image-vision, image-clean
 */

import { interpolateStep } from '../interpolate.js'
import { callAI, callTTS, callASR, callImageGen, callVision, optimizeImage } from '../aiClients.js'

export default {
  'ai-prompt': async (step, ctx, opts) => {
    const s = interpolateStep(step, ctx)
    const prompt = s.prompt || ctx.result

    let systemPrompt
    const fmt = s.outputFormat || 'plain'
    if (fmt === 'custom') {
      systemPrompt = s.systemPrompt || 'You are a helpful assistant.'
    } else {
      const formatInstructions = {
        plain:    'You are a helpful assistant. Respond in plain text only. No markdown formatting.',
        list:     'You are a helpful assistant. Respond as a bulleted list using "- " for each item. No intro sentence.',
        numbered: 'You are a helpful assistant. Respond as a numbered list. No intro sentence.',
        markdown: 'You are a helpful assistant. Format your response using Markdown with headers, bold, and lists where appropriate.',
        json:     'You are a helpful assistant. Respond with valid JSON only. No explanation, no markdown code fences.',
      }
      systemPrompt = formatInstructions[fmt] || 'You are a helpful assistant.'
    }

    ctx.result = await callAI(prompt, systemPrompt, opts.signal, opts.onDebug)
  },

  tts: async (step, ctx, opts) => {
    const s = interpolateStep(step, ctx)
    const text = s.text || ctx.result
    if (!text) throw new Error('TTS: no text to speak.')
    const audioBytes = await callTTS(text, s.voice, s.model, opts.signal, opts.onDebug)
    const filePath = await window.ipcRenderer.saveTempFile(Array.from(audioBytes), 'mp3')
    window.ipcRenderer.playAudio(filePath)
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
    ctx.result = await callASR(base64, fileName, s.language || '', s.model, opts.signal, opts.onDebug)
  },

  'image-gen': async (step, ctx, opts) => {
    const s = interpolateStep(step, ctx)
    const prompt = s.prompt || ctx.result
    if (!prompt) throw new Error('Image generation: no prompt provided.')
    const url = await callImageGen(prompt, s.size, s.quality, s.model, opts.signal, opts.onDebug)
    ctx.result = url
    ctx.vars._imageUrl = url
    if (opts.onShowResult) opts.onShowResult(url, 'image')
  },

  'image-vision': async (step, ctx, opts) => {
    const s = interpolateStep(step, ctx)
    let imageUrl = s.imageUrl || s.filePath || ctx.result
    if (!imageUrl) throw new Error('Vision: no image source provided.')

    // If it looks like a local path, convert to base64 data URI
    if (imageUrl.startsWith('/') || imageUrl.startsWith('~') || imageUrl.match(/^[a-zA-Z]:\\/)) {
      const base64 = await window.ipcRenderer.readFileBase64(imageUrl)
      const ext = imageUrl.split('.').pop().toLowerCase()
      const mime = ext === 'png' ? 'image/png' : ext === 'webp' ? 'image/webp' : 'image/jpeg'
      imageUrl = `data:${mime};base64,${base64}`
    }

    // Optimize image (resize to avoid OOM on local servers)
    if (imageUrl.startsWith('data:image/')) {
      imageUrl = await optimizeImage(imageUrl)
    }

    ctx.result = await callVision(imageUrl, s.prompt, s.systemPrompt, s.model, opts.signal, opts.onDebug)
  },

  'image-clean': async (step, ctx, _opts) => {
    const s = interpolateStep(step, ctx)
    const filePath = s.filePath || ctx.result
    if (!filePath) throw new Error('Image Clean: No file path provided.')

    await window.ipcRenderer.invoke('shell-exec', `exiftool -all= -overwrite_original "${filePath}"`)

    const changeRes = await window.ipcRenderer.invoke('shell-exec',
      `mogrify -strip -quality 92 -scale 99.9% "${filePath}"`
    )

    if (changeRes.exitCode !== 0) {
      throw new Error(`Image Clean failed: ${changeRes.stderr}`)
    }

    ctx.result = filePath
  },

  'pdf-ocr-batch': async (step, ctx, opts) => {
    const s = interpolateStep(step, ctx)
    const paths = (s.imagePaths || ctx.result || '').split('\n').filter(Boolean)
    if (paths.length === 0) throw new Error('Batch OCR: no image paths provided.')

    let combinedText = ''
    for (let i = 0; i < paths.length; i++) {
      const path = paths[i]
      const base64 = await window.ipcRenderer.readFileBase64(path)
      const ext = path.split('.').pop().toLowerCase()
      const mime = ext === 'png' ? 'image/png' : 'image/jpeg'
      let imageUrl = `data:${mime};base64,${base64}`
      imageUrl = await optimizeImage(imageUrl)

      const pageText = await callVision(imageUrl, s.prompt, 'You are an OCR assistant.', s.model, opts.signal, opts.onDebug)
      combinedText += `### Page ${i + 1}\n${pageText}\n\n`
    }

    ctx.result = combinedText.trim()
  },
}
