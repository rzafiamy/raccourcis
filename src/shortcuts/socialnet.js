// SocialNet shortcuts (ids 61–80) — added v1.4.0
import { makeStep, getActionDef } from '../actions/index.js'

function step(type, overrides = {}) {
  const def = getActionDef(type)
  if (!def) throw new Error(`defaultShortcuts: unknown action type "${type}"`)
  return { ...makeStep(def), ...overrides }
}

export default [
  {
    id: 61,
    name: 'Quick Post to X',
    icon: 'twitter',
    color: 'bg-blue',
    category: 'socialnet',
    favorite: true,
    steps: [
      step('user-input', { title: 'What is happening?', label: 'Tweet Content:', placeholder: 'Working on my new project...' }),
      step('url-encode'),
      step('url-open', { url: 'https://twitter.com/intent/tweet?text={{result}}' }),
    ],
  },
  {
    id: 62,
    name: 'AI Viral Tweet',
    icon: 'sparkles',
    color: 'bg-cyan',
    category: 'socialnet',
    favorite: false,
    steps: [
      step('user-input', { title: 'Topic', label: 'What should the tweet be about?', placeholder: 'The future of AI agents' }),
      step('ai-prompt', {
        title: 'Crafting...',
        prompt: 'Write a viral tweet about {{result}}. Use punchy language, include 1-2 relevant hashtags, and keep it under 280 characters. Reply only with the tweet text.',
        systemPrompt: 'You are a social media expert. Write engaging, viral-ready tweets.',
      }),
      step('url-encode'),
      step('url-open', { url: 'https://twitter.com/intent/tweet?text={{result}}' }),
    ],
  },
  {
    id: 63,
    name: 'Summarize X Thread',
    icon: 'list',
    color: 'bg-indigo',
    category: 'socialnet',
    favorite: false,
    steps: [
      step('user-input', { title: 'Thread URL', label: 'Paste X Thread Link:', placeholder: 'https://twitter.com/user/status/...' }),
      step('firecrawl-scrape', { title: 'Reading Thread...' }),
      step('ai-prompt', {
        title: 'Summarizing...',
        prompt: 'Summarize the following thread into 3 key takeaways:\n\n{{result}}',
        systemPrompt: 'Break down the thread into clear, actionable bullet points.',
      }),
      step('show-result', { title: 'Thread Summary', label: 'Key Insights' }),
    ],
  },
  {
    id: 64,
    name: 'LinkedIn Pro Post',
    icon: 'linkedin',
    color: 'bg-blue',
    category: 'socialnet',
    favorite: true,
    steps: [
      step('user-input', { title: 'Context', label: 'What achievement or insight to share?', placeholder: 'Just finished a 30-day coding challenge' }),
      step('ai-prompt', {
        title: 'Drafting...',
        prompt: 'Write a professional, engaging LinkedIn post based on this context: {{result}}. Use a hook, 2-3 body paragraphs, and 3 hashtags. Keep it concise.',
        systemPrompt: 'You are a career coach and professional writer. Write posts that sound human and inspiring.',
      }),
      step('clipboard-write', { title: 'Copy Post' }),
      step('show-result', { title: 'Post Draft', label: 'Ready to Share' }),
    ],
  },
  {
    id: 65,
    name: 'Insta Tag Gen',
    icon: 'hash',
    color: 'bg-pink',
    category: 'socialnet',
    favorite: false,
    steps: [
      step('user-input', { title: 'Photo Topic', label: 'What is in your photo?', placeholder: 'Sunset over the Eiffel Tower' }),
      step('ai-prompt', {
        title: 'Generating Tags...',
        prompt: 'Generate 20 relevant, high-traffic Instagram hashtags for: {{result}}. Reply with hashtags only, separated by spaces.',
        systemPrompt: 'Expert social media growth specialist. Focus on niche-relevant and trending hashtags.',
      }),
      step('show-result', { title: 'Hashtags', label: 'IG Tags' }),
    ],
  },
  {
    id: 66,
    name: 'Find Influencers',
    icon: 'users',
    color: 'bg-orange',
    category: 'socialnet',
    favorite: false,
    steps: [
      step('user-input', { title: 'Niche', label: 'Target market / Topic:', placeholder: 'Mechanical Keyboards' }),
      step('google-search', { title: 'Searching...', query: 'top influencers and creators in {{result}} niche', numResults: 5 }),
      step('ai-prompt', {
        title: 'Analyzing...',
        prompt: 'Identify the top 5 creators or influencers from these results and briefly explain why they are relevant:\n\n{{result}}',
      }),
      step('show-result', { title: 'Influencer List', label: 'Market Study' }),
    ],
  },
  {
    id: 67,
    name: 'Reply with Wit',
    icon: 'message-square',
    color: 'bg-purple',
    category: 'socialnet',
    favorite: true,
    steps: [
      step('clipboard-read', { title: 'Get Message' }),
      step('ai-prompt', {
        title: 'Brainstorming...',
        prompt: 'Draft 3 options for a witty, engaging reply to this message:\n\n{{result}}\n\nOption 1: Sarcastic\nOption 2: Professional\nOption 3: Friendly',
        systemPrompt: 'You are a creative writer. Make the replies sound natural, not like a robot.',
      }),
      step('show-result', { title: 'Reply Options', label: 'Pick your favorite' }),
    ],
  },
  {
    id: 68,
    name: 'X Thread Creator',
    icon: 'curly-braces',
    color: 'bg-indigo',
    category: 'socialnet',
    favorite: false,
    steps: [
      step('user-input', { title: 'Topic', label: 'Thread Subject:', placeholder: '10 lessons from 10 years of startup life' }),
      step('ai-prompt', {
        title: 'Expanding...',
        prompt: 'Convert this topic into a 5-tweet X thread: {{result}}. Use numbering (1/5, etc.) and ensure each tweet flows into the next.',
        systemPrompt: 'Thread writing expert. Focus on hooks and readability.',
      }),
      step('show-result', { title: 'Full Thread', label: 'Your X Thread' }),
    ],
  },
  {
    id: 69,
    name: 'Bio Optimizer',
    icon: 'user-cog',
    color: 'bg-green',
    category: 'socialnet',
    favorite: false,
    steps: [
      step('user-input', { title: 'Current Bio', label: 'Paste your current bio:', placeholder: 'Software engineer who likes coffee' }),
      step('ai-prompt', {
        title: 'Polishing...',
        prompt: 'Improve this social media bio to be more professional and clear, while staying under 160 characters. Input: {{result}}',
        systemPrompt: 'Branding specialist. Focused on clarity and impact.',
      }),
      step('show-result', { title: 'New Bio', label: 'Bio Variations' }),
    ],
  },
  {
    id: 70,
    name: 'Analyze Post',
    icon: 'bar-chart-2',
    color: 'bg-cyan',
    category: 'socialnet',
    favorite: false,
    steps: [
      step('clipboard-read', { title: 'Get Post' }),
      step('ai-prompt', {
        title: 'Analyzing...',
        prompt: 'Analyze the tone and potential impact of this post. Give it a score out of 10 for engagement potential and suggest 2 improvements:\n\n{{result}}',
      }),
      step('show-result', { title: 'Post Audit', label: 'Engagement Report' }),
    ],
  },
  {
    id: 71,
    name: 'Content Cal (7D)',
    icon: 'calendar',
    color: 'bg-orange',
    category: 'socialnet',
    favorite: false,
    steps: [
      step('user-input', { title: 'Niche/Goal', label: 'What is your focus this week?', placeholder: 'Promoting my new indie game' }),
      step('ai-prompt', {
        title: 'Planning...',
        prompt: 'Generate a 7-day social media content schedule for: {{result}}. Include a topic and platform for each day.',
        systemPrompt: 'Social media manager. Provide a balanced schedule (edu, ent, promo).',
      }),
      step('show-result', { title: 'Weekly Plan', label: '7-Day Calendar' }),
    ],
  },
  {
    id: 72,
    name: 'Store Review Pro',
    icon: 'star',
    color: 'bg-pink',
    category: 'socialnet',
    favorite: false,
    steps: [
      step('user-input', { title: 'App Name', label: 'Search reviews for:', placeholder: 'Raccourcis App' }),
      step('google-search', { title: 'Searching...', query: '{{result}} app store play store reviews and complaints', numResults: 5 }),
      step('ai-prompt', {
        title: 'Synthesizing...',
        prompt: 'Summarize the main praise and critical feedback for this app based on these search results:\n\n{{result}}',
      }),
      step('show-result', { title: 'Market Feedback', label: 'Review Summary' }),
    ],
  },
  {
    id: 73,
    name: 'Substack Idea',
    icon: 'mail',
    color: 'bg-orange',
    category: 'socialnet',
    favorite: false,
    steps: [
      step('user-input', { title: 'Theme', label: 'Newsletter Theme:', placeholder: 'The productivity of AI' }),
      step('ai-prompt', {
        title: 'Drafting...',
        prompt: 'Generate 5 unique and deep-dive article ideas for a Substack about {{result}}. Include a catchy title and a 1-sentence synopsis for each.',
        systemPrompt: 'Newsletter editorial lead. Focus on deep value and unique perspectives.',
      }),
      step('show-result', { title: 'Newsletter Ideas', label: 'Editorial Plan' }),
    ],
  },
  {
    id: 74,
    name: 'Cold DM Writer',
    icon: 'send',
    color: 'bg-blue',
    category: 'socialnet',
    favorite: false,
    steps: [
      step('user-input', { title: 'Person', label: 'Who are you reaching out to?', placeholder: 'A senior developer at Google' }),
      step('set-var', { varName: 'targetPerson' }),
      step('user-input', { title: 'Goal', label: 'Your goal:', placeholder: 'Asking for career advice' }),
      step('ai-prompt', {
        title: 'Writing DM...',
        prompt: 'Draft a short, non-spammy cold DM to {{vars.targetPerson}} with the following goal: {{result}}. Keep it under 2 sentences.',
        systemPrompt: 'Networking expert. Avoid generic templates.',
      }),
      step('show-result', { title: 'Cold DM Draft', label: 'Draft for {{vars.targetPerson}}' }),
    ],
  },
  {
    id: 75,
    name: 'ASR to Caption',
    icon: 'mic',
    color: 'bg-red',
    category: 'socialnet',
    favorite: false,
    steps: [
      step('file-picker', { title: 'Select Audio', buttonLabel: 'Extract from Audio' }),
      step('asr', { title: 'Transcribing...' }),
      step('ai-prompt', {
        title: 'Writing Caption...',
        prompt: 'Convert this transcription into a catchy Instagram caption with emojis and hashtags:\n\n{{result}}',
      }),
      step('show-result', { title: 'Video Caption', label: 'IG Ready' }),
    ],
  },
  {
    id: 76,
    name: 'Profile Coach',
    icon: 'eye',
    color: 'bg-indigo',
    category: 'socialnet',
    favorite: true,
    steps: [
      step('screenshot-capture', { title: 'Capture Profile' }),
      step('image-vision', {
        title: 'Reviewing...',
        prompt: 'Look at this social media profile screenshot. Give 3 specific tips to improve the branding and visual appeal.',
      }),
      step('show-result', { title: 'Branding Coach', label: 'Profile Feedback' }),
    ],
  },
  {
    id: 77,
    name: 'Viral Hook Lab',
    icon: 'magnet',
    color: 'bg-orange',
    category: 'socialnet',
    favorite: false,
    steps: [
      step('user-input', { title: 'Topic', label: 'Post Topic:', placeholder: 'How to save $1000/month' }),
      step('ai-prompt', {
        title: 'Hooking...',
        prompt: 'Generate 5 different "hooks" for a TikTok/Reel about {{result}}. Categories: Fear of missing out, Quick win, Secret revealed, Controversial, Personal story.',
        systemPrompt: 'Short-form video script doctor.',
      }),
      step('show-result', { title: 'Viral Hooks', label: 'Pick your Hook' }),
    ],
  },
  {
    id: 78,
    name: 'Reddit Answer Pro',
    icon: 'reddit',
    color: 'bg-orange',
    category: 'socialnet',
    favorite: false,
    steps: [
      step('clipboard-read', { title: 'Get Question' }),
      step('ai-prompt', {
        title: 'Drafting Answer...',
        prompt: 'Write a detailed, helpful, and community-friendly Reddit response to this question:\n\n{{result}}. Use markdown formatting for readability.',
        systemPrompt: 'Helpful and expert Redditor. No AI-speak, sound authentic.',
      }),
      step('show-result', { title: 'Reddit Draft', label: 'Karma Ready' }),
    ],
  },
  {
    id: 79,
    name: 'Video Intro Pro',
    icon: 'play',
    color: 'bg-red',
    category: 'socialnet',
    favorite: false,
    steps: [
      step('user-input', { title: 'Video Title', label: 'YouTube Video Title:', placeholder: 'Building an App in 24 Hours' }),
      step('ai-prompt', {
        title: 'Writing Intro...',
        prompt: 'Write a high-energy, 15-second intro script for a YouTube video called "{{result}}". Grab attention in the first 3 seconds.',
        systemPrompt: 'YouTube content strategist.',
      }),
      step('show-result', { title: 'Video Intro', label: 'Script Draft' }),
    ],
  },
  {
    id: 80,
    name: 'Research niche',
    icon: 'search',
    color: 'bg-cyan',
    category: 'socialnet',
    favorite: false,
    steps: [
      step('user-input', { title: 'Niche', label: 'Enter niche:', placeholder: 'Minimalist setups' }),
      step('google-search', { title: 'Searching Trends...', query: 'current trends and trending topics in {{result}} niche for 2024', numResults: 5 }),
      step('ai-prompt', {
        title: 'Distilling...',
        prompt: 'Extract the top 3 trending topics or sub-niches from these results for: {{result}}. Provide content ideas for each.',
      }),
      step('show-result', { title: 'Trend Report', label: 'Niche Insights' }),
    ],
  },
]
