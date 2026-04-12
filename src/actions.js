/**
 * actions.js — Registry of all action types
 *
 * Each action definition:
 *   type        unique key
 *   title       display name
 *   desc        short description shown in UI
 *   icon        lucide icon name
 *   color       hex badge color
 *   outputType  data type produced: 'text'|'number'|'file'|'image'|'audio'|'list'|'date'|'json'|null
 *   defaults    initial param values when added to a workflow
 *   params      list of editable parameters shown in the step editor
 *     name        param key on the step object
 *     label       UI label
 *     kind        'text' | 'textarea' | 'number' | 'select'
 *     acceptsVars true → show variable picker button for this param
 *     options     (for select) array of {value, label}
 *     placeholder
 *
 * Context object passed between steps:
 *   {
 *     result   string — output of last step (starts as "")
 *     clipboard string — contents read from OS clipboard
 *     vars     object — named outputs set by steps
 *     log      array  — debug entries [{step, ms, input, output, error}]
 *   }
 *
 * Variable substitution in string params: {{result}}, {{clipboard}}, {{vars.foo}}
 */

export const ACTION_REGISTRY = [
  // ── Input actions ──────────────────────────────────────────────
  {
    type: 'clipboard-read',
    title: 'Read Clipboard',
    desc: 'Read text from the system clipboard → result',
    icon: 'clipboard',
    color: '#BF5AF2',
    outputType: 'text',
    defaults: {},
    params: [],
  },
  {
    type: 'file-picker',
    title: 'Pick File',
    desc: 'Select a file from your computer → result (filePath)',
    icon: 'file-search',
    color: '#0A84FF',
    outputType: 'file',
    defaults: { buttonLabel: 'Select' },
    params: [
      { name: 'buttonLabel', label: 'Button Label', kind: 'text', placeholder: 'Select' },
    ],
  },
  {
    type: 'folder-picker',
    title: 'Pick Folder',
    desc: 'Select a folder from your computer → result (folderPath)',
    icon: 'folder-search',
    color: '#0A84FF',
    outputType: 'file',
    defaults: { buttonLabel: 'Select Folder' },
    params: [
      { name: 'buttonLabel', label: 'Button Label', kind: 'text', placeholder: 'Select Folder' },
    ],
  },
  {
    type: 'folder-list',
    title: 'List Folder',
    desc: 'List files and sub-folders in a directory → result (newline-separated paths)',
    icon: 'folder-open',
    color: '#FF9F0A',
    outputType: 'list',
    defaults: { path: '{{result}}', showHidden: false },
    params: [
      { name: 'path', label: 'Folder path', kind: 'text', placeholder: '/home/user/Documents', acceptsVars: true },
      {
        name: 'showHidden',
        label: 'Include hidden files',
        kind: 'select',
        options: [
          { value: false, label: 'No' },
          { value: true, label: 'Yes' },
        ],
      },
    ],
  },
  {
    type: 'file-read',
    title: 'Read File',
    desc: 'Read the contents of a local text file → result',
    icon: 'file-text',
    color: '#0A84FF',
    outputType: 'text',
    defaults: { path: '{{result}}', encoding: 'utf8' },
    params: [
      { name: 'path', label: 'File path', kind: 'text', placeholder: '/home/user/notes.txt', acceptsVars: true },
      {
        name: 'encoding',
        label: 'Encoding',
        kind: 'select',
        options: [
          { value: 'utf8', label: 'UTF-8' },
          { value: 'ascii', label: 'ASCII' },
          { value: 'base64', label: 'Base64' },
        ],
      },
    ],
  },
  {
    type: 'notification',
    title: 'Show Notification',
    desc: 'Display a system notification',
    icon: 'bell',
    color: '#FF9F0A',
    outputType: null,
    defaults: { title: 'Shortcut Done', body: '{{result}}' },
    params: [
      { name: 'title', label: 'Title', kind: 'text', placeholder: 'Shortcut Done' },
      { name: 'body', label: 'Message body', kind: 'text', placeholder: '{{result}}', acceptsVars: true },
    ],
  },
  {
    type: 'confirm-dialog',
    title: 'Ask to Continue',
    desc: 'Show a yes/no dialog. If canceled, the shortcut stops.',
    icon: 'help-circle',
    color: '#FFD60A',
    outputType: null,
    defaults: { title: 'Continue?', message: 'Do you want to proceed?' },
    params: [
      { name: 'title', label: 'Title', kind: 'text', placeholder: 'Continue?' },
      { name: 'message', label: 'Message', kind: 'text', placeholder: 'Do you want to proceed?', acceptsVars: true },
    ],
  },
  {
    type: 'user-input',
    title: 'User Input',
    desc: 'Ask the user to type something → result',
    icon: 'keyboard',
    color: '#0A84FF',
    outputType: 'text',
    defaults: {
      label: 'Your input',
      placeholder: 'Type here...',
    },
    params: [
      { name: 'label', label: 'Dialog Label', kind: 'text', placeholder: 'Your input' },
      { name: 'placeholder', label: 'Placeholder text', kind: 'text', placeholder: 'Type here...' },
      { name: 'prefill', label: 'Initial value', kind: 'text', placeholder: 'Leave empty for blank', acceptsVars: true },
    ],
  },

  // ── AI actions ─────────────────────────────────────────────────
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

  // ── Output / side-effect actions ───────────────────────────────
  {
    type: 'clipboard-write',
    title: 'Write Clipboard',
    desc: 'Copy result to the system clipboard',
    icon: 'clipboard-check',
    color: '#32D74B',
    outputType: null,
    defaults: { text: '{{result}}' },
    params: [
      {
        name: 'text',
        label: 'Text to copy',
        kind: 'text',
        placeholder: '{{result}}',
        acceptsVars: true,
      },
    ],
  },
  {
    type: 'show-result',
    title: 'Show Result',
    desc: 'Display result in a panel at the end of the run',
    icon: 'panel-top',
    color: '#0A84FF',
    outputType: null,
    defaults: { label: 'Result' },
    params: [
      { name: 'label', label: 'Panel label', kind: 'text', placeholder: 'Result' },
    ],
  },
  {
    type: 'get-date',
    title: 'Get Date',
    desc: 'Get current date/time formatted → result',
    icon: 'calendar',
    color: '#FF375F',
    outputType: 'date',
    defaults: { format: 'YYYY-MM-DD HH:mm:ss' },
    params: [
      { name: 'format', label: 'Format (not implemented, will use ISO)', kind: 'text', placeholder: 'YYYY-MM-DD' },
    ],
  },
  {
    type: 'text-transform',
    title: 'Transform Text',
    desc: 'Change case, slugify, etc. → result',
    icon: 'type',
    color: '#32D74B',
    outputType: 'text',
    defaults: { formula: 'uppercase' },
    params: [
      {
        name: 'formula',
        label: 'Formula',
        kind: 'select',
        options: [
          { value: 'uppercase', label: 'UPPERCASE' },
          { value: 'lowercase', label: 'lowercase' },
          { value: 'titlecase', label: 'Title Case' },
          { value: 'slugify', label: 'slug-ify' },
        ],
      },
    ],
  },
  {
    type: 'file-write',
    title: 'Save to File',
    desc: 'Write text to a specified local file',
    icon: 'file-down',
    color: '#0A84FF',
    outputType: 'file',
    defaults: { path: '', content: '{{result}}' },
    params: [
      { name: 'path', label: 'Destination File Path (leave empty for Save Dialog)', kind: 'text', placeholder: '/home/user/output.txt' },
      { name: 'content', label: 'Content to save', kind: 'text', placeholder: '{{result}}', acceptsVars: true },
    ],
  },
  {
    type: 'reveal-file',
    title: 'Show in Finder',
    desc: 'Open the folder containing the file',
    icon: 'folder-open',
    color: '#5E5CE6',
    outputType: null,
    defaults: { path: '{{result}}' },
    params: [
      { name: 'path', label: 'File/Folder Path', kind: 'text', placeholder: '{{result}}', acceptsVars: true },
    ],
  },
  {
    type: 'url-open',
    title: 'Open URL',
    desc: 'Open a URL in the default browser',
    icon: 'external-link',
    color: '#5E5CE6',
    outputType: null,
    defaults: { url: '{{result}}' },
    params: [
      {
        name: 'url',
        label: 'URL',
        kind: 'text',
        placeholder: 'https://...',
        acceptsVars: true,
      },
    ],
  },

  // ── Control flow ───────────────────────────────────────────────
  {
    type: 'wait',
    title: 'Wait',
    desc: 'Pause execution for a fixed duration',
    icon: 'timer',
    color: '#8E8E93',
    outputType: null,
    defaults: { duration: 1000 },
    params: [
      { name: 'duration', label: 'Duration (ms)', kind: 'number', placeholder: '1000' },
    ],
  },

  // ── AI media actions ───────────────────────────────────────────
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

  // ── System (Linux/desktop) ─────────────────────────────────────
  {
    type: 'shell',
    title: 'Run Shell Command',
    desc: 'Execute a shell command → result (stdout)',
    icon: 'terminal',
    color: '#FF9F0A',
    outputType: 'text',
    defaults: { command: 'echo {{result}}' },
    params: [
      {
        name: 'command',
        label: 'Shell command',
        kind: 'textarea',
        placeholder: 'echo {{result}}',
        acceptsVars: true,
      },
    ],
  },
  {
    type: 'image-clean',
    title: 'Clean Image',
    desc: 'Remove all metadata and subtly alter image to break AI marks/watermarks',
    icon: 'shield-check',
    color: '#32D74B',
    outputType: 'file',
    defaults: { filePath: '{{result}}' },
    params: [
      { name: 'filePath', label: 'Image File Path', kind: 'text', placeholder: '{{result}}', acceptsVars: true },
    ],
  },
  {
    type: 'set-var',
    title: 'Save to Variable',
    desc: 'Store result under a named variable for later steps',
    icon: 'save',
    color: '#64D2FF',
    outputType: null,
    defaults: { varName: 'myVar' },
    params: [
      { name: 'varName', label: 'Variable name', kind: 'text', placeholder: 'myVar' },
    ],
  },
  {
    type: 'screenshot-capture',
    title: 'Take Screenshot',
    desc: 'Capture the primary screen → result (filePath)',
    icon: 'camera',
    color: '#FF375F',
    outputType: 'image',
    defaults: {},
    params: [],
  },
  {
    type: 'file-rename',
    title: 'Rename File',
    desc: 'Change the name of a file',
    icon: 'edit-3',
    color: '#0A84FF',
    outputType: 'file',
    defaults: { oldPath: '{{result}}', newPath: '' },
    params: [
      { name: 'oldPath', label: 'Current path', kind: 'text', placeholder: '{{result}}', acceptsVars: true },
      { name: 'newPath', label: 'New path / name', kind: 'text', placeholder: '/path/to/newname.txt', acceptsVars: true },
    ],
  },
  {
    type: 'file-move',
    title: 'Move File',
    desc: 'Move a file to a new location',
    icon: 'move',
    color: '#0A84FF',
    outputType: 'file',
    defaults: { src: '{{result}}', dest: '' },
    params: [
      { name: 'src', label: 'Source path', kind: 'text', placeholder: '{{result}}', acceptsVars: true },
      { name: 'dest', label: 'Destination path', kind: 'text', placeholder: '/home/user/Desktop/', acceptsVars: true },
    ],
  },
  {
    type: 'file-delete',
    title: 'Delete File',
    desc: 'Permanently remove a file',
    icon: 'trash-2',
    color: '#FF453A',
    outputType: null,
    defaults: { path: '{{result}}' },
    params: [
      { name: 'path', label: 'File path', kind: 'text', placeholder: '{{result}}', acceptsVars: true },
    ],
  },
  {
    type: 'git-clone',
    title: 'Git Clone',
    desc: 'Clone a git repository into a folder',
    icon: 'github',
    color: '#24292e',
    outputType: 'file',
    defaults: { url: '', targetDir: '{{result}}' },
    params: [
      { name: 'url', label: 'Repository URL', kind: 'text', placeholder: 'https://github.com/user/repo.git', acceptsVars: true },
      { name: 'targetDir', label: 'Target Folder', kind: 'text', placeholder: '{{result}}', acceptsVars: true },
    ],
  },
  {
    type: 'git-init',
    title: 'Git Init',
    desc: 'Initialize a new git repository and add origin',
    icon: 'git-branch',
    color: '#F05032',
    outputType: 'file',
    defaults: { folder: '{{result}}', originUrl: '' },
    params: [
      { name: 'folder', label: 'Folder Path', kind: 'text', placeholder: '{{result}}', acceptsVars: true },
      { name: 'originUrl', label: 'Remote Origin URL (optional)', kind: 'text', placeholder: 'https://github.com/user/repo.git', acceptsVars: true },
    ],
  },

  {
    type: 'plot-chart',
    title: 'Plot Chart',
    desc: 'Generate a chart from JSON data',
    icon: 'bar-chart',
    color: '#32D74B',
    outputType: 'chart',
    defaults: {
      data: '{{result}}',
      chartType: 'bar',
      title: 'My Chart',
      xAxis: 'label',
      yAxis: 'value',
    },
    params: [
      { name: 'data', label: 'JSON Data (array or object)', kind: 'textarea', placeholder: '[{"label":"A", "value":10}, {"label":"B", "value":20}]', acceptsVars: true },
      {
        name: 'chartType',
        label: 'Chart Type',
        kind: 'select',
        options: [
          { value: 'bar', label: 'Bar' },
          { value: 'line', label: 'Line' },
          { value: 'pie', label: 'Pie' },
          { value: 'doughnut', label: 'Doughnut' },
          { value: 'polarArea', label: 'Polar Area' },
          { value: 'radar', label: 'Radar' },
        ],
      },
      { name: 'title', label: 'Chart Title', kind: 'text', placeholder: 'My Chart', acceptsVars: true },
      { name: 'xAxis', label: 'Key for Labels (X-Axis)', kind: 'text', placeholder: 'name' },
      { name: 'yAxis', label: 'Key for Values (Y-Axis)', kind: 'text', placeholder: 'value' },
    ],
  },

  // ── Data / Text utilities ──────────────────────────────────────
  {
    type: 'http-request',
    title: 'HTTP Request',
    desc: 'Send an HTTP request and return the response body → result',
    icon: 'globe',
    color: '#5E5CE6',
    outputType: 'text',
    defaults: {
      url: '{{result}}',
      method: 'GET',
      headers: '',
      body: '',
    },
    params: [
      { name: 'url', label: 'URL', kind: 'text', placeholder: 'https://api.example.com/data', acceptsVars: true },
      {
        name: 'method',
        label: 'Method',
        kind: 'select',
        options: [
          { value: 'GET',    label: 'GET' },
          { value: 'POST',   label: 'POST' },
          { value: 'PUT',    label: 'PUT' },
          { value: 'PATCH',  label: 'PATCH' },
          { value: 'DELETE', label: 'DELETE' },
        ],
      },
      { name: 'headers', label: 'Headers (JSON object, optional)', kind: 'textarea', placeholder: '{"Authorization": "Bearer {{vars.token}}"}', acceptsVars: true },
      { name: 'body', label: 'Request body (optional)', kind: 'textarea', placeholder: '{"key": "value"}', acceptsVars: true },
    ],
  },
  {
    type: 'json-extract',
    title: 'Extract from JSON',
    desc: 'Extract a value from JSON using a dot-path → result',
    icon: 'braces',
    color: '#32D74B',
    outputType: 'text',
    defaults: { json: '{{result}}', path: '' },
    params: [
      { name: 'json', label: 'JSON input', kind: 'textarea', placeholder: '{{result}}', acceptsVars: true },
      { name: 'path', label: 'Dot-path (e.g. data.items.0.name)', kind: 'text', placeholder: 'data.name' },
    ],
  },
  {
    type: 'regex-extract',
    title: 'Regex Extract',
    desc: 'Extract text using a regular expression → result (first match or all matches)',
    icon: 'scan-text',
    color: '#FF9F0A',
    outputType: 'text',
    defaults: { text: '{{result}}', pattern: '', flags: 'g', mode: 'first' },
    params: [
      { name: 'text', label: 'Input text', kind: 'textarea', placeholder: '{{result}}', acceptsVars: true },
      { name: 'pattern', label: 'Regex pattern', kind: 'text', placeholder: '\\d+' },
      { name: 'flags', label: 'Flags (e.g. g, gi, gm)', kind: 'text', placeholder: 'g' },
      {
        name: 'mode',
        label: 'Mode',
        kind: 'select',
        options: [
          { value: 'first',   label: 'First match' },
          { value: 'all',     label: 'All matches (newline-separated)' },
          { value: 'groups',  label: 'Capture groups (JSON array)' },
        ],
      },
    ],
  },
  {
    type: 'text-join',
    title: 'Join Text',
    desc: 'Concatenate multiple values with a separator → result',
    icon: 'combine',
    color: '#32D74B',
    outputType: 'text',
    defaults: { parts: '{{result}}', separator: '\n' },
    params: [
      { name: 'parts', label: 'Values (one per line, or use {{vars.x}})', kind: 'textarea', placeholder: '{{vars.firstName}}\n{{vars.lastName}}', acceptsVars: true },
      { name: 'separator', label: 'Separator', kind: 'text', placeholder: ' ' },
    ],
  },
  {
    type: 'app-launch',
    title: 'Launch App',
    desc: 'Open an application or file with its default handler',
    icon: 'rocket',
    color: '#FF9F0A',
    outputType: null,
    defaults: { target: '' },
    params: [
      { name: 'target', label: 'App name, command, or file path', kind: 'text', placeholder: 'gedit, /usr/bin/vlc, or /home/user/doc.pdf', acceptsVars: true },
    ],
  },

  // ── Services ────────────────────────────────────────────────────
  {
    type: 'firecrawl-scrape',
    title: 'Firecrawl Scrape',
    desc: 'Scrape a URL and return clean markdown (Firecrawl) → result',
    icon: 'flame',
    color: '#FF4500',
    outputType: 'text',
    defaults: {
      url: '{{result}}',
      formats: 'markdown',
    },
    params: [
      { name: 'url', label: 'URL to scrape', kind: 'text', placeholder: 'https://example.com', acceptsVars: true },
      {
        name: 'formats',
        label: 'Output format',
        kind: 'select',
        options: [
          { value: 'markdown', label: 'Markdown' },
          { value: 'html', label: 'HTML' },
          { value: 'rawHtml', label: 'Raw HTML' },
        ],
      },
    ],
  },
  {
    type: 'google-search',
    title: 'Google Search',
    desc: 'Search Google via Custom Search API → JSON results',
    icon: 'search',
    color: '#4285F4',
    outputType: 'list',
    defaults: {
      query: '{{result}}',
      numResults: 5,
    },
    params: [
      { name: 'query', label: 'Search query', kind: 'text', placeholder: 'latest news on AI', acceptsVars: true },
      { name: 'numResults', label: 'Number of results (1–10)', kind: 'number', placeholder: '5' },
    ],
  },
  {
    type: 'youtube-search',
    title: 'YouTube Search',
    desc: 'Search YouTube for videos → result with titles and URLs',
    icon: 'video',
    color: '#FF0000',
    outputType: 'list',
    defaults: {
      query: '{{result}}',
      maxResults: 5,
    },
    params: [
      { name: 'query', label: 'Search query', kind: 'text', placeholder: 'how to make pizza', acceptsVars: true },
      { name: 'maxResults', label: 'Max results (1–50)', kind: 'number', placeholder: '5' },
    ],
  },
  {
    type: 'wikipedia-search',
    title: 'Wikipedia Search',
    desc: 'Search Wikipedia and get article summary → result',
    icon: 'book-open',
    color: '#A7C7E7',
    outputType: 'text',
    defaults: {
      query: '{{result}}',
      sentences: 5,
    },
    params: [
      { name: 'query', label: 'Search query', kind: 'text', placeholder: 'Eiffel Tower', acceptsVars: true },
      { name: 'sentences', label: 'Summary sentences', kind: 'number', placeholder: '5' },
    ],
  },
  {
    type: 'google-calendar-list',
    title: 'List Calendar Events',
    desc: 'Fetch upcoming Google Calendar events → result',
    icon: 'calendar-days',
    color: '#0F9D58',
    outputType: 'list',
    defaults: {
      maxResults: 10,
      timeMin: '',
    },
    params: [
      { name: 'maxResults', label: 'Max events', kind: 'number', placeholder: '10' },
      { name: 'timeMin', label: 'From date (ISO 8601, leave blank for now)', kind: 'text', placeholder: '2024-01-01T00:00:00Z' },
    ],
  },
  {
    type: 'gmail-send',
    title: 'Send Gmail',
    desc: 'Send an email via Gmail API',
    icon: 'mail',
    color: '#EA4335',
    outputType: null,
    defaults: {
      to: '',
      subject: '',
      body: '{{result}}',
    },
    params: [
      { name: 'to', label: 'To (email address)', kind: 'text', placeholder: 'recipient@example.com' },
      { name: 'subject', label: 'Subject', kind: 'text', placeholder: 'Hello from Raccourcis', acceptsVars: true },
      { name: 'body', label: 'Body', kind: 'textarea', placeholder: '{{result}}', acceptsVars: true },
    ],
  },
  {
    type: 'weather',
    title: 'Get Weather',
    desc: 'Fetch current weather for a location (OpenWeatherMap) → result',
    icon: 'cloud-sun',
    color: '#FFB347',
    outputType: 'text',
    defaults: {
      location: '{{result}}',
      units: 'metric',
    },
    params: [
      { name: 'location', label: 'City or location', kind: 'text', placeholder: 'Paris, FR', acceptsVars: true },
      {
        name: 'units',
        label: 'Units',
        kind: 'select',
        options: [
          { value: 'metric', label: 'Metric (°C)' },
          { value: 'imperial', label: 'Imperial (°F)' },
          { value: 'standard', label: 'Standard (K)' },
        ],
      },
    ],
  },
  {
    type: 'smtp-send',
    title: 'Send SMTP Email',
    desc: 'Send an email via SMTP (custom mail server)',
    icon: 'send',
    color: '#5E5CE6',
    outputType: null,
    defaults: {
      to: '',
      subject: '',
      body: '{{result}}',
    },
    params: [
      { name: 'to', label: 'To (email address)', kind: 'text', placeholder: 'recipient@example.com' },
      { name: 'subject', label: 'Subject', kind: 'text', placeholder: 'Hello from Raccourcis', acceptsVars: true },
      { name: 'body', label: 'Body', kind: 'textarea', placeholder: '{{result}}', acceptsVars: true },
    ],
  },
  {
    type: 'gitlab-list-issues',
    title: 'GitLab — List Issues',
    desc: 'Fetch open issues for a project → result',
    icon: 'git-merge',
    color: '#FC6D26',
    outputType: 'list',
    defaults: {
      projectId: '',
      state: 'opened',
      maxResults: 10,
    },
    params: [
      { name: 'projectId', label: 'Project ID or path (e.g. 42 or user/repo)', kind: 'text', placeholder: 'user/my-project' },
      {
        name: 'state',
        label: 'State',
        kind: 'select',
        options: [
          { value: 'opened', label: 'Open' },
          { value: 'closed', label: 'Closed' },
          { value: 'all', label: 'All' },
        ],
      },
      { name: 'maxResults', label: 'Max results', kind: 'number', placeholder: '10' },
    ],
  },
  {
    type: 'gitlab-create-issue',
    title: 'GitLab — Create Issue',
    desc: 'Create a new issue in a GitLab project → result',
    icon: 'plus-circle',
    color: '#FC6D26',
    outputType: 'text',
    defaults: {
      projectId: '',
      title: 'New Issue',
      description: '{{result}}',
    },
    params: [
      { name: 'projectId', label: 'Project ID or path', kind: 'text', placeholder: 'user/my-project' },
      { name: 'title', label: 'Issue Title', kind: 'text', placeholder: 'Bug: ...', acceptsVars: true },
      { name: 'description', label: 'Description', kind: 'textarea', placeholder: '{{result}}', acceptsVars: true },
    ],
  },
  {
    type: 'gitlab-list-mrs',
    title: 'GitLab — List Merge Requests',
    desc: 'Fetch merge requests for a project → result',
    icon: 'git-pull-request',
    color: '#FC6D26',
    outputType: 'list',
    defaults: {
      projectId: '',
      state: 'opened',
      maxResults: 10,
    },
    params: [
      { name: 'projectId', label: 'Project ID or path', kind: 'text', placeholder: 'user/my-project' },
      {
        name: 'state',
        label: 'State',
        kind: 'select',
        options: [
          { value: 'opened', label: 'Open' },
          { value: 'merged', label: 'Merged' },
          { value: 'closed', label: 'Closed' },
          { value: 'all', label: 'All' },
        ],
      },
      { name: 'maxResults', label: 'Max results', kind: 'number', placeholder: '10' },
    ],
  },
  {
    type: 'gitlab-pipelines',
    title: 'GitLab — List Pipelines',
    desc: 'Fetch recent pipelines for a project → result',
    icon: 'workflow',
    color: '#FC6D26',
    outputType: 'list',
    defaults: {
      projectId: '',
      status: '',
      maxResults: 10,
    },
    params: [
      { name: 'projectId', label: 'Project ID or path', kind: 'text', placeholder: 'user/my-project' },
      {
        name: 'status',
        label: 'Status filter',
        kind: 'select',
        options: [
          { value: '', label: 'All' },
          { value: 'running', label: 'Running' },
          { value: 'pending', label: 'Pending' },
          { value: 'success', label: 'Success' },
          { value: 'failed', label: 'Failed' },
          { value: 'canceled', label: 'Canceled' },
        ],
      },
      { name: 'maxResults', label: 'Max results', kind: 'number', placeholder: '10' },
    ],
  },
  {
    type: 'qr-code',
    title: 'QR Code',
    desc: 'Generate a QR code image URL from text or URL → image URL',
    icon: 'qr-code',
    color: '#1C1C1E',
    outputType: 'image',
    defaults: {
      text: '{{result}}',
      size: 300,
      ecc: 'M',
    },
    params: [
      { name: 'text', label: 'Text or URL to encode', kind: 'textarea', placeholder: 'https://example.com', acceptsVars: true },
      { name: 'size', label: 'Image size (px)', kind: 'number', placeholder: '300' },
      {
        name: 'ecc',
        label: 'Error correction level',
        kind: 'select',
        options: [
          { value: 'L', label: 'L — Low (7%)' },
          { value: 'M', label: 'M — Medium (15%)' },
          { value: 'Q', label: 'Q — Quartile (25%)' },
          { value: 'H', label: 'H — High (30%)' },
        ],
      },
    ],
  },
  {
    type: 'nextcloud-list-files',
    title: 'Nextcloud — List Files',
    desc: 'List files in a Nextcloud directory → result',
    icon: 'cloud',
    color: '#0082C9',
    outputType: 'list',
    defaults: {
      path: '/',
    },
    params: [
      { name: 'path', label: 'Directory path (e.g. /Documents)', kind: 'text', placeholder: '/Documents' },
    ],
  },
  {
    type: 'nextcloud-upload',
    title: 'Nextcloud — Upload File',
    desc: 'Upload a local file to Nextcloud',
    icon: 'cloud-upload',
    color: '#0082C9',
    outputType: null,
    defaults: {
      localPath: '{{result}}',
      remotePath: '/Uploads/{{result}}',
    },
    params: [
      { name: 'localPath', label: 'Local file path', kind: 'text', placeholder: '/home/user/file.txt', acceptsVars: true },
      { name: 'remotePath', label: 'Remote path in Nextcloud', kind: 'text', placeholder: '/Uploads/file.txt', acceptsVars: true },
    ],
  },
  {
    type: 'nextcloud-note',
    title: 'Nextcloud — Create Note',
    desc: 'Create a note in Nextcloud Notes app → result',
    icon: 'notebook-pen',
    color: '#0082C9',
    outputType: null,
    defaults: {
      title: 'New Note',
      content: '{{result}}',
      category: '',
    },
    params: [
      { name: 'title', label: 'Note title', kind: 'text', placeholder: 'My Note', acceptsVars: true },
      { name: 'content', label: 'Content', kind: 'textarea', placeholder: '{{result}}', acceptsVars: true },
      { name: 'category', label: 'Category (optional)', kind: 'text', placeholder: 'Work' },
    ],
  },
  {
    type: 'nextcloud-create-folder',
    title: 'Nextcloud — Create Folder',
    desc: 'Create a new directory in Nextcloud',
    icon: 'folder-plus',
    color: '#0082C9',
    outputType: null,
    defaults: {
      path: '/New Folder',
    },
    params: [
      { name: 'path', label: 'New folder path (e.g. /Documents/Projects)', kind: 'text', placeholder: '/Project A' },
    ],
  },
  {
    type: 'supabase-select',
    title: 'Supabase — Select',
    desc: 'Query a table using PostgREST → JSON array',
    icon: 'database',
    color: '#3ECF8E',
    outputType: 'json',
    defaults: {
      table: '',
      select: '*',
      filter: '',
    },
    params: [
      { name: 'table', label: 'Table name', kind: 'text', placeholder: 'profiles' },
      { name: 'select', label: 'Select (e.g. *, id, name)', kind: 'text', placeholder: '*' },
      { name: 'filter', label: 'Filter (e.g. id=eq.5)', kind: 'text', placeholder: 'id=eq.{{result}}', acceptsVars: true },
    ],
  },
  {
    type: 'supabase-insert',
    title: 'Supabase — Insert',
    desc: 'Insert a new row into a table → inserted object',
    icon: 'database-zap',
    color: '#3ECF8E',
    outputType: 'json',
    defaults: {
      table: '',
      data: '{{result}}',
    },
    params: [
      { name: 'table', label: 'Table name', kind: 'text', placeholder: 'posts' },
      { name: 'data', label: 'JSON row data', kind: 'textarea', placeholder: '{"title": "{{result}}", "user_id": "{{vars.uid}}"}', acceptsVars: true },
    ],
  },
  {
    type: 'supabase-update',
    title: 'Supabase — Update',
    desc: 'Update existing rows → updated objects',
    icon: 'database-zap',
    color: '#3ECF8E',
    outputType: 'json',
    defaults: {
      table: '',
      filter: '',
      data: '{{result}}',
    },
    params: [
      { name: 'table', label: 'Table name', kind: 'text', placeholder: 'users' },
      { name: 'filter', label: 'Filter (e.g. id=eq.5)', kind: 'text', placeholder: 'id=eq.{{vars.targetId}}', acceptsVars: true },
      { name: 'data', label: 'JSON partial data', kind: 'textarea', placeholder: '{"status": "active"}', acceptsVars: true },
    ],
  },
  {
    type: 'supabase-delete',
    title: 'Supabase — Delete',
    desc: 'Delete rows matching a filter',
    icon: 'database-zap',
    color: '#3ECF8E',
    outputType: null,
    defaults: {
      table: '',
      filter: '',
    },
    params: [
      { name: 'table', label: 'Table name', kind: 'text', placeholder: 'tasks' },
      { name: 'filter', label: 'Filter (e.g. id=eq.10)', kind: 'text', placeholder: 'id=eq.{{result}}', acceptsVars: true },
    ],
  },
]



export function getActionDef(type) {
  return ACTION_REGISTRY.find((a) => a.type === type) || null
}

/** Create a new step object from an action definition */
export function makeStep(actionDef) {
  return {
    type: actionDef.type,
    title: actionDef.title,
    desc: actionDef.desc,
    icon: actionDef.icon,
    color: actionDef.color,
    ...actionDef.defaults,
  }
}
