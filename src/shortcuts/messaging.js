// Messaging shortcuts (ids 95–109)
// Covers: Telegram, Signal, Twitter/X, LinkedIn, Webhook
import { makeStep, getActionDef } from '../actions/index.js'

function step(type, overrides = {}) {
  const def = getActionDef(type)
  if (!def) throw new Error(`defaultShortcuts: unknown action type "${type}"`)
  return { ...makeStep(def), ...overrides }
}

export default [
  // ── Telegram ────────────────────────────────────────────────────────────────

  {
    id: 95,
    name: 'Telegram Quick Send',
    icon: 'send',
    color: 'bg-cyan',
    category: 'comm',
    favorite: true,
    steps: [
      step('user-input', { title: 'Chat ID', label: 'Recipient (Chat ID or @channel):', placeholder: '123456789' }),
      step('set-var', { title: 'Save Chat ID', varName: 'tgChat' }),
      step('user-input', { title: 'Message', label: 'Message text:', placeholder: 'Type your message...' }),
      step('telegram-send', { title: 'Sending...', chatId: '{{vars.tgChat}}', text: '{{result}}', parseMode: 'Markdown' }),
      step('show-result', { title: 'Sent', label: 'Telegram Message' }),
    ],
  },

  {
    id: 96,
    name: 'AI → Telegram Broadcast',
    icon: 'sparkles',
    color: 'bg-cyan',
    category: 'comm',
    favorite: false,
    steps: [
      step('user-input', { title: 'Topic', label: 'What should the message be about?', placeholder: 'Weekly team update' }),
      step('set-var', { title: 'Save Topic', varName: 'topic' }),
      step('user-input', { title: 'Chat ID', label: 'Telegram Chat ID or @channel:', placeholder: '@mychannel' }),
      step('set-var', { title: 'Save Chat ID', varName: 'tgChat' }),
      step('ai-prompt', {
        title: 'Drafting...',
        prompt: 'Write a concise, engaging Telegram channel message about: {{vars.topic}}. Use *bold* for emphasis and keep it under 300 characters.',
        systemPrompt: 'You write short, punchy Telegram broadcast messages. Use Telegram Markdown: *bold*, _italic_, `code`.',
      }),
      step('telegram-send', { title: 'Broadcasting...', chatId: '{{vars.tgChat}}', text: '{{result}}', parseMode: 'Markdown' }),
      step('show-result', { title: 'Broadcast Sent', label: 'Message Delivered' }),
    ],
  },

  {
    id: 97,
    name: 'Clipboard → Telegram',
    icon: 'clipboard-copy',
    color: 'bg-cyan',
    category: 'comm',
    favorite: false,
    steps: [
      step('clipboard-read', { title: 'Get Clipboard' }),
      step('set-var', { title: 'Save Content', varName: 'content' }),
      step('user-input', { title: 'Chat ID', label: 'Send to (Chat ID or @channel):', placeholder: '123456789' }),
      step('telegram-send', { title: 'Sending...', chatId: '{{result}}', text: '{{vars.content}}', parseMode: '' }),
      step('show-result', { title: 'Done', label: 'Clipboard sent to Telegram' }),
    ],
  },

  {
    id: 98,
    name: 'Send File via Telegram',
    icon: 'file-up',
    color: 'bg-cyan',
    category: 'comm',
    favorite: false,
    steps: [
      step('user-input', { title: 'Chat ID', label: 'Recipient (Chat ID or @channel):', placeholder: '123456789' }),
      step('set-var', { title: 'Save Chat ID', varName: 'tgChat' }),
      step('file-picker', { title: 'Pick File', buttonLabel: 'Select file to send' }),
      step('set-var', { title: 'Save File Path', varName: 'filePath' }),
      step('user-input', { title: 'Caption', label: 'Caption (optional):', placeholder: 'Here is the file' }),
      step('telegram-send-file', { title: 'Uploading...', chatId: '{{vars.tgChat}}', filePath: '{{vars.filePath}}', caption: '{{result}}' }),
      step('show-result', { title: 'File Sent', label: 'Telegram File Delivery' }),
    ],
  },

  // ── Signal ───────────────────────────────────────────────────────────────────

  {
    id: 99,
    name: 'Signal Quick Send',
    icon: 'shield-check',
    color: 'bg-blue',
    category: 'comm',
    favorite: true,
    steps: [
      step('user-input', { title: 'Recipient', label: 'Phone number (+E.164):', placeholder: '+33612345678' }),
      step('set-var', { title: 'Save Recipient', varName: 'signalTo' }),
      step('user-input', { title: 'Message', label: 'Encrypted message:', placeholder: 'Type your secure message...' }),
      step('signal-cli-send', { title: 'Sending encrypted...', recipient: '{{vars.signalTo}}', message: '{{result}}' }),
      step('show-result', { title: 'Sent', label: 'Signal Message' }),
    ],
  },

  {
    id: 100,
    name: 'AI Briefing → Signal',
    icon: 'brain-circuit',
    color: 'bg-blue',
    category: 'comm',
    favorite: false,
    steps: [
      step('user-input', { title: 'Recipient', label: 'Signal number (+E.164):', placeholder: '+33612345678' }),
      step('set-var', { title: 'Save Recipient', varName: 'signalTo' }),
      step('user-input', { title: 'Topic', label: 'What to brief on?', placeholder: 'Project status, server uptime...' }),
      step('ai-prompt', {
        title: 'Generating briefing...',
        prompt: 'Write a short (max 5 lines) status briefing about: {{result}}. Be concise and factual, no fluff.',
        systemPrompt: 'You write precise operational briefings. Plain text only, no markdown.',
      }),
      step('signal-cli-send', { title: 'Sending secure briefing...', recipient: '{{vars.signalTo}}', message: '{{result}}' }),
      step('show-result', { title: 'Briefing Sent', label: 'Signal Briefing' }),
    ],
  },

  // ── Twitter / X ──────────────────────────────────────────────────────────────

  {
    id: 101,
    name: 'Post to X (API)',
    icon: 'twitter',
    color: 'bg-indigo',
    category: 'socialnet',
    favorite: false,
    steps: [
      step('user-input', { title: 'Tweet', label: 'What do you want to post? (max 280 chars)', placeholder: 'Working on something new...' }),
      step('confirm-dialog', { title: 'Confirm Post', message: 'Post this tweet to X?\n\n{{result}}' }),
      step('twitter-post', { title: 'Posting...' }),
      step('show-result', { title: 'Posted!', label: 'Tweet URL' }),
    ],
  },

  {
    id: 102,
    name: 'AI Tweet + Post',
    icon: 'sparkles',
    color: 'bg-indigo',
    category: 'socialnet',
    favorite: true,
    steps: [
      step('user-input', { title: 'Topic', label: 'What should the tweet be about?', placeholder: 'Launched my new product today' }),
      step('ai-prompt', {
        title: 'Crafting tweet...',
        prompt: 'Write a single viral tweet about: {{result}}. Under 260 characters, punchy tone, 1–2 hashtags. Reply with the tweet text only.',
        systemPrompt: 'Expert tweet writer. No quotation marks around the output.',
      }),
      step('confirm-dialog', { title: 'Review Tweet', message: 'Post this tweet?\n\n{{result}}' }),
      step('twitter-post', { title: 'Posting...' }),
      step('show-result', { title: 'Live on X', label: 'Tweet URL' }),
    ],
  },

  {
    id: 103,
    name: 'Clipboard → Tweet',
    icon: 'clipboard-copy',
    color: 'bg-indigo',
    category: 'socialnet',
    favorite: false,
    steps: [
      step('clipboard-read', { title: 'Get Clipboard' }),
      step('confirm-dialog', { title: 'Confirm Post', message: 'Post clipboard content as a tweet?\n\n{{result}}' }),
      step('twitter-post', { title: 'Posting...' }),
      step('show-result', { title: 'Posted', label: 'Tweet URL' }),
    ],
  },

  // ── LinkedIn ─────────────────────────────────────────────────────────────────

  {
    id: 104,
    name: 'Post to LinkedIn (API)',
    icon: 'linkedin',
    color: 'bg-blue',
    category: 'socialnet',
    favorite: false,
    steps: [
      step('user-input', { title: 'Post Content', label: 'What do you want to share?', placeholder: 'Just hit a big milestone...' }),
      step('confirm-dialog', { title: 'Confirm Post', message: 'Share this on LinkedIn?\n\n{{result}}' }),
      step('linkedin-post', { title: 'Posting...', visibility: 'PUBLIC' }),
      step('show-result', { title: 'Published', label: 'LinkedIn Post URN' }),
    ],
  },

  {
    id: 105,
    name: 'AI LinkedIn Post + Publish',
    icon: 'sparkles',
    color: 'bg-blue',
    category: 'socialnet',
    favorite: true,
    steps: [
      step('user-input', { title: 'Context', label: 'Achievement or insight to share:', placeholder: 'Just shipped a new feature at work' }),
      step('ai-prompt', {
        title: 'Writing post...',
        prompt: 'Write a professional LinkedIn post about: {{result}}. Use a strong opening hook, 3 short paragraphs, and 3 relevant hashtags at the end. Sound human.',
        systemPrompt: 'Career coach and professional writer. No corporate buzzwords. Write in first person.',
      }),
      step('confirm-dialog', { title: 'Review Post', message: 'Publish this LinkedIn post?\n\n{{result}}' }),
      step('linkedin-post', { title: 'Publishing...', visibility: 'PUBLIC' }),
      step('show-result', { title: 'Published', label: 'LinkedIn Post' }),
    ],
  },

  // ── Webhook / Multi-platform ─────────────────────────────────────────────────

  {
    id: 106,
    name: 'Slack Notify',
    icon: 'bell',
    color: 'bg-green',
    category: 'comm',
    favorite: false,
    steps: [
      step('user-input', { title: 'Message', label: 'Slack message:', placeholder: 'Build passed ✓' }),
      step('webhook-post', {
        title: 'Sending to Slack...',
        body: '{"text":"{{result}}"}',
      }),
      step('show-result', { title: 'Sent', label: 'Slack Notification' }),
    ],
  },

  {
    id: 107,
    name: 'Discord Notify',
    icon: 'message-circle',
    color: 'bg-purple',
    category: 'comm',
    favorite: false,
    steps: [
      step('user-input', { title: 'Message', label: 'Discord message:', placeholder: 'Deployment complete' }),
      step('webhook-post', {
        title: 'Sending to Discord...',
        body: '{"content":"{{result}}"}',
      }),
      step('show-result', { title: 'Sent', label: 'Discord Notification' }),
    ],
  },

  {
    id: 108,
    name: 'Alert All Channels',
    icon: 'megaphone',
    color: 'bg-orange',
    category: 'comm',
    favorite: false,
    steps: [
      step('user-input', { title: 'Alert', label: 'Alert message:', placeholder: 'System maintenance in 10 minutes' }),
      step('set-var', { title: 'Save Alert', varName: 'alert' }),
      step('user-input', { title: 'Telegram Chat ID', label: 'Telegram Chat ID to notify:', placeholder: '123456789' }),
      step('telegram-send', { title: 'Telegram alert...', chatId: '{{result}}', text: '⚠️ {{vars.alert}}', parseMode: '' }),
      step('webhook-post', { title: 'Slack/Discord alert...', body: '{"text":"⚠️ {{vars.alert}}"}' }),
      step('show-result', { title: 'All Notified', label: 'Multi-channel Alert' }),
    ],
  },

  {
    id: 109,
    name: 'AI Report → Telegram + Email',
    icon: 'file-bar-chart',
    color: 'bg-orange',
    category: 'comm',
    favorite: false,
    steps: [
      step('user-input', { title: 'Report Topic', label: 'What should the report cover?', placeholder: 'Daily sales summary' }),
      step('set-var', { title: 'Save Topic', varName: 'reportTopic' }),
      step('ai-prompt', {
        title: 'Generating report...',
        prompt: 'Write a concise daily report on: {{vars.reportTopic}}. Include key metrics, status, and 1 recommendation. Use plain text, no markdown.',
        systemPrompt: 'You write clear, actionable daily reports. Be brief and specific.',
      }),
      step('set-var', { title: 'Save Report', varName: 'report' }),
      step('user-input', { title: 'Telegram Chat ID', label: 'Telegram Chat ID:', placeholder: '123456789' }),
      step('set-var', { title: 'Save Chat ID', varName: 'tgChat' }),
      step('telegram-send', { title: 'Sending to Telegram...', chatId: '{{vars.tgChat}}', text: '{{vars.report}}', parseMode: '' }),
      step('user-input', { title: 'Email', label: 'Send report to email:', placeholder: 'boss@company.com' }),
      step('smtp-send', { title: 'Sending email...', to: '{{result}}', subject: 'Daily Report — {{vars.reportTopic}}', body: '{{vars.report}}' }),
      step('show-result', { title: 'Report Distributed', label: 'Sent via Telegram + Email' }),
    ],
  },
]
