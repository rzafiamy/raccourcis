// Services — Firecrawl, Google, YouTube, Wikipedia, Google Calendar, Gmail, Weather,
//            SMTP, GitLab, QR Code, Nextcloud, Supabase
export default [
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
    type: 'weather-forecast',
    title: 'Get 5-Day Forecast',
    desc: 'Fetch 5-day / 3-hour weather forecast (OpenWeatherMap) → result',
    icon: 'calendar-days',
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
  {
    type: 'supabase-rpc',
    title: 'Supabase — RPC',
    desc: 'Call a PostgreSQL function (RPC) → result',
    icon: 'database-zap',
    color: '#3ECF8E',
    outputType: 'json',
    defaults: {
      functionName: '',
      params: '{}',
    },
    params: [
      { name: 'functionName', label: 'Function name', kind: 'text', placeholder: 'my_function' },
      { name: 'params', label: 'Parameters (JSON object)', kind: 'textarea', placeholder: '{"id": 1}', acceptsVars: true },
    ],
  },
  {
    type: 'supabase-upload',
    title: 'Supabase — Upload',
    desc: 'Upload a local file to a storage bucket → result (URL)',
    icon: 'upload-cloud',
    color: '#3ECF8E',
    outputType: 'text',
    defaults: {
      bucket: '',
      path: '{{result}}',
      destPath: '',
    },
    params: [
      { name: 'bucket', label: 'Bucket ID', kind: 'text', placeholder: 'uploads' },
      { name: 'path', label: 'Local File Path', kind: 'text', placeholder: '{{result}}', acceptsVars: true },
      { name: 'destPath', label: 'Destination Path (optional)', kind: 'text', placeholder: 'folder/file.ext', acceptsVars: true },
    ],
  },

  // ── Messaging ─────────────────────────────────────────────────────────────────

  {
    type: 'telegram-send',
    title: 'Telegram — Send Message',
    desc: 'Send a message via Telegram Bot API → result',
    icon: 'send',
    color: '#2AABEE',
    outputType: 'text',
    defaults: {
      chatId: '',
      text: '{{result}}',
      parseMode: 'Markdown',
    },
    params: [
      { name: 'chatId', label: 'Chat ID (user, group, or @channel)', kind: 'text', placeholder: '123456789 or @mychannel', acceptsVars: true },
      { name: 'text', label: 'Message text', kind: 'textarea', placeholder: '{{result}}', acceptsVars: true },
      {
        name: 'parseMode',
        label: 'Parse mode',
        kind: 'select',
        options: [
          { value: 'Markdown', label: 'Markdown' },
          { value: 'HTML', label: 'HTML' },
          { value: '', label: 'Plain text' },
        ],
      },
    ],
  },

  {
    type: 'telegram-send-file',
    title: 'Telegram — Send File',
    desc: 'Send a local file (photo, document, audio) via Telegram Bot API',
    icon: 'file-up',
    color: '#2AABEE',
    outputType: 'text',
    defaults: {
      chatId: '',
      filePath: '{{result}}',
      caption: '',
    },
    params: [
      { name: 'chatId', label: 'Chat ID', kind: 'text', placeholder: '123456789 or @mychannel', acceptsVars: true },
      { name: 'filePath', label: 'Local file path', kind: 'text', placeholder: '{{result}}', acceptsVars: true },
      { name: 'caption', label: 'Caption (optional)', kind: 'text', placeholder: 'Here is your file', acceptsVars: true },
    ],
  },

  {
    type: 'signal-cli-send',
    title: 'Signal — Send Message',
    desc: 'Send a Signal message via signal-cli (must be installed)',
    icon: 'shield-check',
    color: '#3A76F0',
    outputType: 'text',
    defaults: {
      recipient: '',
      message: '{{result}}',
    },
    params: [
      { name: 'recipient', label: 'Recipient phone (+E.164) or group ID', kind: 'text', placeholder: '+33612345678', acceptsVars: true },
      { name: 'message', label: 'Message', kind: 'textarea', placeholder: '{{result}}', acceptsVars: true },
    ],
  },

  {
    type: 'twitter-post',
    title: 'Twitter/X — Post Tweet',
    desc: 'Post a tweet via Twitter API v2 → tweet URL',
    icon: 'twitter',
    color: '#1DA1F2',
    outputType: 'text',
    defaults: {
      text: '{{result}}',
    },
    params: [
      { name: 'text', label: 'Tweet text (max 280 chars)', kind: 'textarea', placeholder: '{{result}}', acceptsVars: true },
    ],
  },

  {
    type: 'linkedin-post',
    title: 'LinkedIn — Share Post',
    desc: 'Share a post on LinkedIn via API → post URN',
    icon: 'linkedin',
    color: '#0A66C2',
    outputType: 'text',
    defaults: {
      text: '{{result}}',
      visibility: 'PUBLIC',
    },
    params: [
      { name: 'text', label: 'Post content', kind: 'textarea', placeholder: '{{result}}', acceptsVars: true },
      {
        name: 'visibility',
        label: 'Visibility',
        kind: 'select',
        options: [
          { value: 'PUBLIC', label: 'Public' },
          { value: 'CONNECTIONS', label: 'Connections only' },
        ],
      },
    ],
  },

  {
    type: 'webhook-post',
    title: 'Webhook POST',
    desc: 'POST JSON payload to any webhook URL (Slack, Discord, ntfy, custom…)',
    icon: 'webhook',
    color: '#6E40C9',
    outputType: 'text',
    defaults: {
      url: '',
      body: '{"text":"{{result}}"}',
      headers: '',
    },
    params: [
      { name: 'url', label: 'Webhook URL', kind: 'text', placeholder: 'https://hooks.slack.com/...', acceptsVars: true },
      { name: 'body', label: 'JSON body', kind: 'textarea', placeholder: '{"text":"{{result}}"}', acceptsVars: true },
      { name: 'headers', label: 'Extra headers (JSON object, optional)', kind: 'textarea', placeholder: '{"Authorization":"Bearer token"}', acceptsVars: true },
    ],
  },
]
