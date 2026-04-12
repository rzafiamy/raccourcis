// Productivity / Utils — YouTube download, filename, math, hash, URL encode/decode
export default [
  {
    type: 'youtube-download',
    title: 'YouTube Download',
    desc: 'Download video or audio from YouTube (requires yt-dlp) → result (filePath)',
    icon: 'video',
    color: '#FF0000',
    outputType: 'file',
    defaults: {
      url: '{{result}}',
      format: 'best',
      outputDir: '',
      filename: '%(title)s.%(ext)s',
    },
    params: [
      { name: 'url', label: 'Video URL', kind: 'text', placeholder: 'https://youtube.com/...', acceptsVars: true },
      {
        name: 'format',
        label: 'Format',
        kind: 'select',
        options: [
          { value: 'best', label: 'Best Video + Audio' },
          { value: 'mp4', label: 'MP4 Video' },
          { value: 'mp3', label: 'MP3 Audio' },
          { value: 'wav', label: 'WAV Audio' },
        ],
      },
      { name: 'outputDir', label: 'Output Directory (optional)', kind: 'text', placeholder: '/home/user/Downloads', acceptsVars: true },
      { name: 'filename', label: 'Filename Pattern', kind: 'text', placeholder: '%(title)s.%(ext)s' },
    ],
  },
  {
    type: 'filename-generate',
    title: 'Clean Filename',
    desc: 'Transform a string into a safe, clean filename → result',
    icon: 'file-edit',
    color: '#0A84FF',
    outputType: 'text',
    defaults: { text: '{{result}}', extension: '' },
    params: [
      { name: 'text', label: 'Input text', kind: 'text', placeholder: 'My Awesome File', acceptsVars: true },
      { name: 'extension', label: 'Extension (optional)', kind: 'text', placeholder: 'mp4' },
    ],
  },
  {
    type: 'math-evaluate',
    title: 'Math Evaluate',
    desc: 'Evaluate a mathematical expression → result',
    icon: 'calculator',
    color: '#FF9F0A',
    outputType: 'number',
    defaults: { expression: '{{result}}' },
    params: [
      { name: 'expression', label: 'Expression', kind: 'text', placeholder: '2 + 2 * (10 / 5)', acceptsVars: true },
    ],
  },
  {
    type: 'hash-generate',
    title: 'Generate Hash',
    desc: 'Calculate MD5, SHA256 or SHA512 hash of text or file → result',
    icon: 'fingerprint',
    color: '#8E8E93',
    outputType: 'text',
    defaults: { input: '{{result}}', algorithm: 'sha256', isFile: false },
    params: [
      { name: 'input', label: 'Input (text or path)', kind: 'text', placeholder: '{{result}}', acceptsVars: true },
      {
        name: 'algorithm',
        label: 'Algorithm',
        kind: 'select',
        options: [
          { value: 'md5', label: 'MD5' },
          { value: 'sha1', label: 'SHA1' },
          { value: 'sha256', label: 'SHA256' },
          { value: 'sha512', label: 'SHA512' },
        ],
      },
      {
        name: 'isFile',
        label: 'Input is a file path',
        kind: 'select',
        options: [
          { value: false, label: 'No (hash text)' },
          { value: true, label: 'Yes (hash file contents)' },
        ],
      },
    ],
  },
  {
    type: 'url-encode',
    title: 'URL Encode',
    desc: 'Encode a string for use in a URL (e.g. "Hello World" → "Hello%20World") → result',
    icon: 'link-2',
    color: '#32D74B',
    outputType: 'text',
    defaults: { text: '{{result}}' },
    params: [
      { name: 'text', label: 'Text to encode', kind: 'text', placeholder: 'Hello World!', acceptsVars: true },
    ],
  },
  {
    type: 'url-decode',
    title: 'URL Decode',
    desc: 'Decode a URL-encoded string → result',
    icon: 'link-2',
    color: '#8E8E93',
    outputType: 'text',
    defaults: { text: '{{result}}' },
    params: [
      { name: 'text', label: 'Encoded text', kind: 'text', placeholder: 'Hello%20World!', acceptsVars: true },
    ],
  },
]
