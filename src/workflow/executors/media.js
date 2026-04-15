/**
 * executors/media.js — Media & office document action executors
 *
 * Covers: media (ffmpeg), image compress, zip/archive, office docs (docx, xlsx, pptx),
 *         PDF generation, PDF processing
 */

import { interpolateStep } from '../interpolate.js'

export default {
  // ── Media ────────────────────────────────────────────────────────────────────

  'media-metadata-tag': async (step, ctx, opts) => {
    const s = interpolateStep(step, ctx)
    const filePath = s.filePath || ctx.result
    if (!filePath) throw new Error('Media Tag: No file path provided.')

    let cmd = `ffmpeg -i "${filePath}" -y`
    if (s.title) cmd += ` -metadata title="${s.title}"`
    if (s.artist) cmd += ` -metadata artist="${s.artist}"`
    if (s.album) cmd += ` -metadata album="${s.album}"`

    const ext = filePath.split('.').pop()
    const tmpFile = filePath.replace(`.${ext}`, `_tagged.${ext}`)
    cmd += ` -codec copy "${tmpFile}" && mv "${tmpFile}" "${filePath}"`

    const result = await window.ipcRenderer.invoke('shell-exec', {
      command: cmd,
      runId: opts.runId
    })
    if (result.exitCode !== 0) throw new Error(`Media Tag failed: ${result.stderr}`)
    ctx.result = filePath
  },

  'media-merge-poster': async (step, ctx, opts) => {
    const s = interpolateStep(step, ctx)
    if (!s.audioPath || !s.imagePath) throw new Error('Merge Poster: Missing audio or image path.')

    let out = s.outputPath
    if (!out) {
      out = s.audioPath.replace(/\.[^.]+$/, '') + '.mp4'
    }

    const cmd = `ffmpeg -loop 1 -i "${s.imagePath}" -i "${s.audioPath}" -c:v libx264 -tune stillimage -c:a aac -b:a 192k -pix_fmt yuv420p -shortest -y "${out}"`
    const result = await window.ipcRenderer.invoke('shell-exec', {
      command: cmd,
      runId: opts.runId
    })
    if (result.exitCode !== 0) throw new Error(`Merge Poster failed: ${result.stderr}`)
    ctx.result = out
  },

  'media-extract-audio': async (step, ctx, opts) => {
    const s = interpolateStep(step, ctx)
    const videoPath = s.videoPath || ctx.result
    if (!videoPath) throw new Error('Extract Audio: No video path.')

    const ext = s.format || 'mp3'
    const out = videoPath.replace(/\.[^.]+$/, '') + '.' + ext

    let acodec = 'libmp3lame'
    if (ext === 'aac') acodec = 'aac'
    if (ext === 'wav') acodec = 'pcm_s16le'
    if (ext === 'flac') acodec = 'flac'

    const cmd = `ffmpeg -i "${videoPath}" -vn -c:a ${acodec} -q:a 2 -y "${out}"`
    const result = await window.ipcRenderer.invoke('shell-exec', {
      command: cmd,
      runId: opts.runId
    })
    if (result.exitCode !== 0) throw new Error(`Extract Audio failed: ${result.stderr}`)
    ctx.result = out
  },

  'media-convert': async (step, ctx, opts) => {
    const s = interpolateStep(step, ctx)
    const inputPath = s.inputPath || ctx.result
    if (!inputPath) throw new Error('Convert Media: No input path.')

    const ext = s.format || 'mp4'
    const out = inputPath.replace(/\.[^.]+$/, '') + '_converted.' + ext

    const cmd = `ffmpeg -i "${inputPath}" -y "${out}"`
    const result = await window.ipcRenderer.invoke('shell-exec', {
      command: cmd,
      runId: opts.runId
    })
    if (result.exitCode !== 0) throw new Error(`Convert Media failed: ${result.stderr}`)
    ctx.result = out
  },

  'image-compress': async (step, ctx, opts) => {
    const s = interpolateStep(step, ctx)
    const filePath = s.filePath || ctx.result
    if (!filePath) throw new Error('Image Compress: No file path.')

    const quality = s.quality || 80
    const cmd = `mogrify -quality ${quality} "${filePath}"`
    const res = await window.ipcRenderer.invoke('shell-exec', {
      command: cmd,
      runId: opts.runId
    })
    if (res.exitCode !== 0) {
      // Fallback to ffmpeg if mogrify fails
      const tmp = filePath.replace(/\.[^.]+$/, '') + `_q${quality}.jpg`
      const cmd2 = `ffmpeg -i "${filePath}" -q:v ${Math.floor((100 - quality) / 2)} -y "${tmp}" && mv "${tmp}" "${filePath}"`
      const res2 = await window.ipcRenderer.invoke('shell-exec', {
        command: cmd2,
        runId: opts.runId
      })
      if (res2.exitCode !== 0) throw new Error(`Image Compress failed: ${res2.stderr}`)
    }
    ctx.result = filePath
  },

  // ── Archives ─────────────────────────────────────────────────────────────────

  'zip-extract': async (step, ctx, opts) => {
    const s = interpolateStep(step, ctx)
    const zipPath = s.zipPath || ctx.result
    if (!zipPath) throw new Error('Extract ZIP: no zip file path provided.')
    const destDir = s.destDir || zipPath.replace(/\.zip$/i, '')
    const cmd = `unzip -o "${zipPath}" -d "${destDir}"`
    const { stderr, exitCode } = await window.ipcRenderer.invoke('shell-exec', {
      command: cmd,
      runId: opts.runId
    })
    if (exitCode !== 0) throw new Error(`Extract ZIP failed: ${stderr}`)
    ctx.result = destDir
  },

  'folder-compress': async (step, ctx, opts) => {
    const s = interpolateStep(step, ctx)
    const sourcePath = s.sourcePath || ctx.result
    if (!sourcePath) throw new Error('Compress ZIP: no source path provided.')
    const zipPath = s.zipPath || sourcePath.replace(/\/+$/, '') + '.zip'
    const cmd = `zip -r "${zipPath}" "${sourcePath}"`
    const { stderr, exitCode } = await window.ipcRenderer.invoke('shell-exec', {
      command: cmd,
      runId: opts.runId
    })
    if (exitCode !== 0) throw new Error(`Compress ZIP failed: ${stderr}`)
    ctx.result = zipPath
  },

  // ── Office documents ─────────────────────────────────────────────────────────

  'create-docx': async (step, ctx, _opts) => {
    const s = interpolateStep(step, ctx)
    const content = s.content || ctx.result
    if (!content) throw new Error('Create DOCX: no content provided.')
    const res = await window.ipcRenderer.invoke('create-docx', {
      content,
      title: s.title || '',
      outputPath: s.outputPath || '',
    })
    if (!res.ok) throw new Error(res.error)
    ctx.result = res.filePath
  },

  'create-xlsx': async (step, ctx, _opts) => {
    const s = interpolateStep(step, ctx)
    const data = s.data || ctx.result
    if (!data) throw new Error('Create XLSX: no data provided.')
    const res = await window.ipcRenderer.invoke('create-xlsx', {
      data,
      sheetName: s.sheetName || 'Sheet1',
      outputPath: s.outputPath || '',
    })
    if (!res.ok) throw new Error(res.error)
    ctx.result = res.filePath
  },

  'create-pptx': async (step, ctx, _opts) => {
    const s = interpolateStep(step, ctx)
    const slides = s.slides || ctx.result
    if (!slides) throw new Error('Create PPTX: no slides data provided.')
    const res = await window.ipcRenderer.invoke('create-pptx', {
      slides,
      title: s.title || '',
      outputPath: s.outputPath || '',
    })
    if (!res.ok) throw new Error(res.error)
    ctx.result = res.filePath
  },

  // ── PDF ──────────────────────────────────────────────────────────────────────

  'text-to-pdf': async (step, ctx, _opts) => {
    const s = interpolateStep(step, ctx)
    const content = s.content || ctx.result
    if (!content) throw new Error('Text to PDF: no content provided.')
    const tmpMd  = `/tmp/raccourci_${Date.now()}.md`
    const outPdf = s.outputPath || `/tmp/raccourci_${Date.now()}.pdf`
    const fontSize = s.fontSize || '12'
    const escaped = content.replace(/'/g, "'\\''")
    const writeCmd = `printf '%s' '${escaped}' > "${tmpMd}"`
    await window.ipcRenderer.invoke('shell-exec', writeCmd)
    const cmd = `pandoc "${tmpMd}" -o "${outPdf}" --pdf-engine=wkhtmltopdf -V fontsize:${fontSize}pt 2>/dev/null || pandoc "${tmpMd}" -o "${outPdf}" -V fontsize:${fontSize}pt`
    const { stderr, exitCode } = await window.ipcRenderer.invoke('shell-exec', cmd)
    if (exitCode !== 0) throw new Error(`Text to PDF failed: ${stderr}`)
    ctx.result = outPdf
  },

  'html-to-pdf': async (step, ctx, _opts) => {
    const s = interpolateStep(step, ctx)
    const input = s.input || ctx.result
    if (!input) throw new Error('HTML to PDF: no input provided.')
    const outPdf = s.outputPath || `/tmp/raccourci_${Date.now()}.pdf`
    let cmd
    const isFilePath = !input.trim().startsWith('<') && !input.includes('\n') && input.length < 512
    if (isFilePath) {
      cmd = `wkhtmltopdf "${input}" "${outPdf}"`
    } else {
      const tmpHtml = `/tmp/raccourci_${Date.now()}.html`
      const escaped = input.replace(/'/g, "'\\''")
      await window.ipcRenderer.invoke('shell-exec', `printf '%s' '${escaped}' > "${tmpHtml}"`)
      cmd = `wkhtmltopdf "${tmpHtml}" "${outPdf}"`
    }
    const { stderr, exitCode } = await window.ipcRenderer.invoke('shell-exec', cmd)
    if (exitCode !== 0) throw new Error(`HTML to PDF failed: ${stderr}`)
    ctx.result = outPdf
  },

  'website-to-pdf': async (step, ctx, _opts) => {
    const s = interpolateStep(step, ctx)
    const url = s.url || ctx.result
    if (!url) throw new Error('Website to PDF: no URL provided.')
    const outPdf = s.outputPath || `/tmp/raccourci_${Date.now()}.pdf`
    const cmd = `wkhtmltopdf "${url}" "${outPdf}"`
    const { stderr, exitCode } = await window.ipcRenderer.invoke('shell-exec', cmd)
    if (exitCode !== 0) throw new Error(`Website to PDF failed: ${stderr}`)
    ctx.result = outPdf
  },

  'pdf-to-images': async (step, ctx, opts) => {
    const s = interpolateStep(step, ctx)
    const pdfPath = s.pdfPath || ctx.result
    if (!pdfPath) throw new Error('PDF to Images: no file path provided.')
    const maxPages = Number(s.maxPages) || 5
    const tmpPrefix = `/tmp/raccourci_pdf_${Date.now()}`

    const cmd = `pdftoppm -png -f 1 -l ${maxPages} "${pdfPath}" "${tmpPrefix}"`
    const { stderr, exitCode } = await window.ipcRenderer.invoke('shell-exec', {
      command: cmd,
      runId: opts.runId
    })

    if (exitCode !== 0) throw new Error(`PDF conversion failed: ${stderr}. Make sure poppler-utils is installed.`)

    const listResult = await window.ipcRenderer.invoke('folder-list', { path: '/tmp', showHidden: false })
    if (!listResult.ok) throw new Error(`Failed to list temp files: ${listResult.error}`)

    const prefixBase = tmpPrefix.split('/').pop()
    const matchingFiles = listResult.entries
      .filter(f => f.includes(prefixBase))
      .sort((a, b) => {
        const numA = parseInt(a.match(/-(\d+)\.png$/)?.[1] || '0')
        const numB = parseInt(b.match(/-(\d+)\.png$/)?.[1] || '0')
        return numA - numB
      })

    ctx.result = matchingFiles.join('\n')
  },
}
