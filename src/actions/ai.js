// AI actions — text prompts, TTS, ASR, image generation, vision
export default [
  // ── Text AI ────────────────────────────────────────────────────
  {
    type: 'ai-prompt',
    title: 'AI Prompt',
    desc: 'Send a prompt to the LLM → result',
    icon: 'sparkles',
    color: '#FF375F',
    outputType: 'text',
    defaults: {
      prompt: '{{result}}',
      systemPrompt: 'You are a helpful assistant.',
      outputFormat: 'plain',
    },
    params: [
      {
        name: 'prompt',
        label: 'Prompt',
        kind: 'textarea',
        placeholder: 'Summarize the following:\n\n{{result}}',
        acceptsVars: true,
      },
      {
        name: 'outputFormat',
        label: 'Output Format',
        kind: 'select',
        options: [
          { value: 'plain',    label: 'Plain text' },
          { value: 'list',     label: 'Bulleted list' },
          { value: 'numbered', label: 'Numbered list' },
          { value: 'markdown', label: 'Markdown' },
          { value: 'json',     label: 'JSON' },
          { value: 'custom',   label: 'Custom (advanced)' },
        ],
      },
      {
        name: 'systemPrompt',
        label: 'Custom instructions (advanced)',
        kind: 'textarea',
        placeholder: 'You are a helpful assistant.',
        hidden: true,   // only shown when outputFormat === 'custom'
      },
    ],
  },

  // ── AI Media ───────────────────────────────────────────────────
  {
    type: 'tts',
    title: 'Text to Speech',
    desc: 'Convert text to spoken audio (OpenAI TTS) → audio result',
    icon: 'volume-2',
    color: '#FF9F0A',
    outputType: 'audio',
    defaults: {
      text: '{{result}}',
      voice: 'alloy',
      model: 'tts-1',
    },
    params: [
      {
        name: 'text',
        label: 'Text',
        kind: 'textarea',
        placeholder: '{{result}}',
        acceptsVars: true,
      },
      {
        name: 'voice',
        label: 'Voice',
        kind: 'select',
        options: [
          { value: 'alloy', label: 'Alloy' },
          { value: 'echo', label: 'Echo' },
          { value: 'fable', label: 'Fable' },
          { value: 'onyx', label: 'Onyx' },
          { value: 'nova', label: 'Nova' },
          { value: 'shimmer', label: 'Shimmer' },
        ],
      },
      {
        name: 'model',
        label: 'Model',
        kind: 'select',
        options: [
          { value: 'tts-1', label: 'tts-1 (fast)' },
          { value: 'tts-1-hd', label: 'tts-1-hd (quality)' },
        ],
      },
    ],
  },
  {
    type: 'asr',
    title: 'Speech to Text',
    desc: 'Transcribe audio file to text (OpenAI Whisper) → result',
    icon: 'mic',
    color: '#64D2FF',
    outputType: 'text',
    defaults: {
      filePath: '',
      language: '',
    },
    params: [
      {
        name: 'filePath',
        label: 'Audio file path',
        kind: 'text',
        placeholder: '/path/to/audio.mp3',
        acceptsVars: true,
      },
      {
        name: 'language',
        label: 'Language (ISO code, e.g. en, fr)',
        kind: 'text',
        placeholder: 'en',
      },
    ],
  },
  {
    type: 'audio-record',
    title: 'Record Audio',
    desc: 'Record audio from the microphone → result (filePath)',
    icon: 'mic',
    color: '#FF375F',
    outputType: 'audio',
    defaults: { duration: 30 },
    params: [
      { name: 'duration', label: 'Max duration (seconds)', kind: 'number', placeholder: '30' },
    ],
  },
  {
    type: 'image-gen',
    title: 'Image Generation',
    desc: 'Generate an image from a text prompt (DALL·E) → image URL',
    icon: 'image',
    color: '#BF5AF2',
    outputType: 'image',
    defaults: {
      prompt: '{{result}}',
      size: '1024x1024',
      quality: 'standard',
      n: 1,
    },
    params: [
      {
        name: 'prompt',
        label: 'Prompt',
        kind: 'textarea',
        placeholder: 'A photorealistic cat astronaut on the moon',
        acceptsVars: true,
      },
      {
        name: 'size',
        label: 'Size',
        kind: 'select',
        options: [
          { value: '1024x1024', label: '1024×1024 (square)' },
          { value: '1792x1024', label: '1792×1024 (landscape)' },
          { value: '1024x1792', label: '1024×1792 (portrait)' },
        ],
      },
      {
        name: 'quality',
        label: 'Quality',
        kind: 'select',
        options: [
          { value: 'standard', label: 'Standard' },
          { value: 'hd', label: 'HD' },
        ],
      },
    ],
  },
  {
    type: 'image-vision',
    title: 'Image Vision',
    desc: 'Analyse an image URL or local file with AI Vision → text result',
    icon: 'eye',
    color: '#32D74B',
    outputType: 'text',
    defaults: {
      imageUrl: '{{result}}',
      filePath: '',
      prompt: 'Describe this image in detail.',
      systemPrompt: 'You are a helpful vision assistant.',
      model: 'gpt-4o',
    },
    params: [
      {
        name: 'imageUrl',
        label: 'Image URL (optional)',
        kind: 'text',
        placeholder: 'https://...',
        acceptsVars: true,
      },
      {
        name: 'filePath',
        label: 'Local File Path (optional)',
        kind: 'text',
        placeholder: '/home/user/image.jpg',
        acceptsVars: true,
      },
      {
        name: 'prompt',
        label: 'Question / instruction',
        kind: 'textarea',
        placeholder: 'Describe this image in detail.',
      },
      {
        name: 'systemPrompt',
        label: 'System Prompt (optional)',
        kind: 'textarea',
        placeholder: 'You are a helpful vision assistant.',
      },
    ],
  },
]
