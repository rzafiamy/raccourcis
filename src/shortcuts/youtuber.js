import { makeStep, getActionDef } from '../actions/index.js'

function step(type, overrides = {}) {
  const def = getActionDef(type)
  if (!def) throw new Error(`youtuberShortcuts: unknown action type "${type}"`)
  return { ...makeStep(def), ...overrides }
}

export default [
  {
    id: 300,
    name: 'AI Trend Radar',
    icon: 'search',
    color: 'bg-red',
    category: 'youtuber',
    favorite: true,
    steps: [
      step('user-input', {
        title: 'Coverage Angle',
        label: 'What AI niche or angle are you tracking?',
        placeholder: 'AI agents for creators',
      }),
      step('set-var', { title: 'Save Angle', varName: 'angle' }),
      step('google-search', {
        title: 'Scan The Web',
        query: 'latest news, launches, debates, and opportunities about {{vars.angle}}',
        numResults: 8,
      }),
      step('set-var', { title: 'Save Web Findings', varName: 'webFindings' }),
      step('youtube-search', {
        title: 'Scan YouTube',
        query: '{{vars.angle}}',
        maxResults: 8,
      }),
      step('ai-prompt', {
        title: 'Build Radar Brief',
        prompt: 'You are helping an AI YouTuber decide what to cover next.\n\nAngle: {{vars.angle}}\n\nWeb findings:\n{{vars.webFindings}}\n\nRecent YouTube results:\n{{result}}\n\nReturn:\n1. The 5 most promising topics to cover now\n2. Why each topic matters this week\n3. A suggested content angle for a creator who wants fast ROI',
        systemPrompt: 'You are a sharp AI media strategist. Be concrete and opportunity-focused.',
      }),
      step('show-result', { title: 'Radar Brief', label: 'Trend Radar' }),
    ],
  },
  {
    id: 301,
    name: 'Audience Pain Miner',
    icon: 'target',
    color: 'bg-orange',
    category: 'youtuber',
    steps: [
      step('user-input', {
        title: 'Audience Persona',
        label: 'Who are you trying to help?',
        placeholder: 'solo creators overwhelmed by AI tools',
      }),
      step('set-var', { title: 'Save Persona', varName: 'persona' }),
      step('google-search', {
        title: 'Collect Pain Signals',
        query: '{{vars.persona}} frustrations problems questions alternatives workflow bottlenecks',
        numResults: 8,
      }),
      step('ai-prompt', {
        title: 'Map Pain Points',
        prompt: 'Persona: {{vars.persona}}\n\nSignals from the web:\n{{result}}\n\nExtract the top 10 pains, rank them by urgency, and suggest one YouTube video angle for each.',
        systemPrompt: 'You are an audience research analyst for creator businesses.',
      }),
      step('show-result', { title: 'Pain Map', label: 'Audience Pains' }),
    ],
  },
  {
    id: 302,
    name: 'Competitor Gap Finder',
    icon: 'search',
    color: 'bg-indigo',
    category: 'youtuber',
    steps: [
      step('user-input', {
        title: 'Competitor',
        label: 'Which AI creator or channel are you studying?',
        placeholder: 'an AI news channel covering model launches',
      }),
      step('set-var', { title: 'Save Competitor', varName: 'competitor' }),
      step('youtube-search', {
        title: 'Search Videos',
        query: '{{vars.competitor}}',
        maxResults: 10,
      }),
      step('set-var', { title: 'Save Video Results', varName: 'videoResults' }),
      step('google-search', {
        title: 'Search Web Presence',
        query: '{{vars.competitor}} newsletter twitter linkedin website',
        numResults: 8,
      }),
      step('ai-prompt', {
        title: 'Find Gaps',
        prompt: 'Competitor:\n{{vars.competitor}}\n\nYouTube presence:\n{{vars.videoResults}}\n\nOther web presence:\n{{result}}\n\nIdentify content gaps, under-covered angles, weak positioning, and 5 opportunities for a differentiated AI YouTube creator.',
        systemPrompt: 'You are a competitive strategist for creator-led media brands.',
      }),
      step('show-result', { title: 'Gap Report', label: 'Competitive Gaps' }),
    ],
  },
  {
    id: 303,
    name: 'Video Idea Factory',
    icon: 'lightbulb',
    color: 'bg-yellow',
    category: 'youtuber',
    favorite: true,
    steps: [
      step('user-input', {
        title: 'Channel Brief',
        label: 'What is your channel positioning right now?',
        placeholder: 'AI workflows for creators and solo founders',
      }),
      step('ai-prompt', {
        title: 'Generate Ideas',
        prompt: 'Based on this channel positioning, generate 15 high-ROI YouTube video ideas.\n\nPositioning: {{result}}\n\nFor each idea include: target viewer, promise, format, and why it could perform now.',
        systemPrompt: 'You are an elite YouTube strategist focused on clarity, novelty, and click potential.',
      }),
      step('show-result', { title: 'Idea List', label: 'Video Ideas' }),
    ],
  },
  {
    id: 304,
    name: 'Weekly Content Calendar',
    icon: 'calendar',
    color: 'bg-green',
    category: 'youtuber',
    steps: [
      step('user-input', {
        title: 'Weekly Goal',
        label: 'What outcome do you want this week?',
        placeholder: 'grow newsletter signups from YouTube',
      }),
      step('ai-prompt', {
        title: 'Plan The Week',
        prompt: 'Build a 7-day content calendar for an AI YouTuber.\n\nWeekly goal: {{result}}\n\nInclude one long-form video, 3 Shorts, 3 community/social touchpoints, and a CTA strategy for each day.',
        systemPrompt: 'You are a content operator who balances audience growth with business ROI.',
      }),
      step('show-result', { title: 'Weekly Plan', label: 'Content Calendar' }),
    ],
  },
  {
    id: 305,
    name: 'Hook Generator',
    icon: 'magnet',
    color: 'bg-cyan',
    category: 'youtuber',
    favorite: true,
    steps: [
      step('user-input', {
        title: 'Video Topic',
        label: 'What is the video about?',
        placeholder: 'how AI agents can replace five manual creator tasks',
      }),
      step('ai-prompt', {
        title: 'Write Hooks',
        prompt: 'Generate 12 strong YouTube opening hooks for this topic:\n\n{{result}}\n\nMix curiosity, authority, speed-to-value, and contrarian angles. Keep each under 20 seconds spoken.',
        systemPrompt: 'You write hooks that increase retention in the first 30 seconds.',
      }),
      step('clipboard-write', { title: 'Copy Hooks' }),
      step('show-result', { title: 'Opening Hooks', label: 'Hooks' }),
    ],
  },
  {
    id: 306,
    name: 'Title Lab',
    icon: 'type',
    color: 'bg-blue',
    category: 'youtuber',
    favorite: true,
    steps: [
      step('user-input', {
        title: 'Video Summary',
        label: 'Describe the video in one or two sentences',
        placeholder: 'I tested 12 AI video tools to find the fastest workflow for creators',
      }),
      step('ai-prompt', {
        title: 'Generate Titles',
        prompt: 'Create 20 YouTube titles from this concept:\n\n{{result}}\n\nGroup them into: safe, curiosity-driven, authority-driven, and high-risk/high-reward.',
        systemPrompt: 'You specialize in titles that balance clarity, specificity, and intrigue.',
      }),
      step('clipboard-write', { title: 'Copy Titles' }),
      step('show-result', { title: 'Title Ideas', label: 'Titles' }),
    ],
  },
  {
    id: 307,
    name: 'Thumbnail Brief Builder',
    icon: 'image',
    color: 'bg-pink',
    category: 'youtuber',
    steps: [
      step('user-input', {
        title: 'Video Promise',
        label: 'What is the core promise of the video?',
        placeholder: 'build a full AI content machine with shortcuts',
      }),
      step('ai-prompt', {
        title: 'Write Brief',
        prompt: 'Create 3 thumbnail concepts for this YouTube video promise:\n\n{{result}}\n\nFor each concept include: headline text, visual composition, subject pose/expression, color direction, and why it should click.',
        systemPrompt: 'You are a thumbnail creative director who thinks in bold, simple visual contrasts.',
      }),
      step('clipboard-write', { title: 'Copy Brief' }),
      step('show-result', { title: 'Thumbnail Concepts', label: 'Thumbnail Brief' }),
    ],
  },
  {
    id: 308,
    name: 'Script Outline Builder',
    icon: 'list',
    color: 'bg-indigo',
    category: 'youtuber',
    favorite: true,
    steps: [
      step('user-input', {
        title: 'Video Topic',
        label: 'What are you making next?',
        placeholder: 'the best AI shortcuts for a YouTuber',
      }),
      step('ai-prompt', {
        title: 'Outline Script',
        prompt: 'Turn this YouTube topic into a high-retention outline:\n\n{{result}}\n\nReturn sections for hook, setup, proof, walkthrough, pitfalls, CTA, and an optional bonus section.',
        systemPrompt: 'You structure YouTube videos for clarity, pacing, and retention.',
      }),
      step('show-result', { title: 'Video Outline', label: 'Outline' }),
    ],
  },
  {
    id: 309,
    name: 'Full Video Script',
    icon: 'scroll-text',
    color: 'bg-purple',
    category: 'youtuber',
    favorite: true,
    steps: [
      step('user-input', {
        title: 'Outline Or Brief',
        label: 'Paste your outline or video brief',
        placeholder: 'Hook: ... Main points: ... CTA: ...',
      }),
      step('ai-prompt', {
        title: 'Draft Script',
        prompt: 'Write a full YouTube script from this brief:\n\n{{result}}\n\nMake it sound natural, practical, and creator-led. Include spoken transitions and visual cues in brackets.',
        systemPrompt: 'You write conversational scripts for smart AI creators. Avoid robotic phrasing.',
      }),
      step('clipboard-write', { title: 'Copy Script' }),
      step('show-result', { title: 'Full Script', label: 'Script' }),
    ],
  },
  {
    id: 310,
    name: 'Shorts Script Pack',
    icon: 'video',
    color: 'bg-red',
    category: 'youtuber',
    steps: [
      step('user-input', {
        title: 'Shorts Topic',
        label: 'What should the Shorts cover?',
        placeholder: '3 AI tools that save hours for YouTubers',
      }),
      step('ai-prompt', {
        title: 'Create Shorts',
        prompt: 'Create 5 YouTube Shorts scripts from this idea:\n\n{{result}}\n\nEach should include hook, value, CTA, and stay under 45 seconds.',
        systemPrompt: 'You create short-form scripts optimized for fast retention and replay value.',
      }),
      step('show-result', { title: 'Shorts Scripts', label: 'Shorts Pack' }),
    ],
  },
  {
    id: 311,
    name: 'Voice Memo to Outline',
    icon: 'mic',
    color: 'bg-orange',
    category: 'youtuber',
    steps: [
      step('audio-record', { title: 'Record Idea Dump', duration: 180 }),
      step('asr', { title: 'Transcribe Memo', filePath: '{{result}}' }),
      step('ai-prompt', {
        title: 'Structure The Idea',
        prompt: 'Turn this voice memo into a usable YouTube outline with a clear hook, 3-5 main beats, and a CTA:\n\n{{result}}',
        systemPrompt: 'You are a producer turning messy creator notes into structured plans.',
      }),
      step('show-result', { title: 'Outline', label: 'From Voice Memo' }),
    ],
  },
  {
    id: 312,
    name: 'Transcript Cleanup',
    icon: 'eraser',
    color: 'bg-green',
    category: 'youtuber',
    steps: [
      step('clipboard-read', { title: 'Read Transcript' }),
      step('ai-prompt', {
        title: 'Clean Transcript',
        prompt: 'Clean up this transcript for editing.\n\n{{result}}\n\nRemove filler, fix punctuation, keep the speaker meaning intact, and preserve paragraph flow.',
        systemPrompt: 'You are an expert transcript editor for video production.',
      }),
      step('clipboard-write', { title: 'Copy Clean Transcript' }),
      step('show-result', { title: 'Clean Transcript', label: 'Transcript' }),
    ],
  },
  {
    id: 313,
    name: 'Transcript to Blog Post',
    icon: 'file-text',
    color: 'bg-blue',
    category: 'youtuber',
    steps: [
      step('clipboard-read', { title: 'Read Transcript' }),
      step('ai-prompt', {
        title: 'Write Blog Draft',
        prompt: 'Turn this YouTube transcript into a readable SEO-friendly blog post with headings, examples, and a clear conclusion:\n\n{{result}}',
        systemPrompt: 'You repurpose spoken creator content into strong blog articles without sounding generic.',
      }),
      step('create-docx', { title: 'Export Word Doc', title: 'Blog Post Draft' }),
      step('show-result', { title: 'Saved Blog Draft', label: 'Blog Document' }),
    ],
  },
  {
    id: 314,
    name: 'Transcript to Newsletter',
    icon: 'mail',
    color: 'bg-yellow',
    category: 'youtuber',
    steps: [
      step('clipboard-read', { title: 'Read Transcript' }),
      step('ai-prompt', {
        title: 'Write Newsletter',
        prompt: 'Turn this YouTube transcript into a concise newsletter edition with a strong intro, 3 key takeaways, and a closing CTA:\n\n{{result}}',
        systemPrompt: 'You adapt creator content into high-value newsletters that feel personal and smart.',
      }),
      step('create-docx', { title: 'Export Newsletter Doc', title: 'Newsletter Draft' }),
      step('show-result', { title: 'Saved Newsletter', label: 'Newsletter Document' }),
    ],
  },
  {
    id: 315,
    name: 'Transcript to X Thread',
    icon: 'twitter',
    color: 'bg-cyan',
    category: 'youtuber',
    steps: [
      step('clipboard-read', { title: 'Read Transcript' }),
      step('ai-prompt', {
        title: 'Write Thread',
        prompt: 'Convert this transcript into an X thread with a strong opening tweet, 7-10 tweets total, and a CTA at the end:\n\n{{result}}',
        systemPrompt: 'You repurpose creator content into sharp, readable threads.',
      }),
      step('clipboard-write', { title: 'Copy Thread' }),
      step('show-result', { title: 'Thread Draft', label: 'X Thread' }),
    ],
  },
  {
    id: 316,
    name: 'Transcript to LinkedIn Post',
    icon: 'linkedin',
    color: 'bg-blue',
    category: 'youtuber',
    steps: [
      step('clipboard-read', { title: 'Read Transcript' }),
      step('ai-prompt', {
        title: 'Write LinkedIn Post',
        prompt: 'Turn this transcript into a thoughtful LinkedIn post for professionals interested in AI and content systems:\n\n{{result}}',
        systemPrompt: 'You write creator-led LinkedIn posts that sound credible and human.',
      }),
      step('clipboard-write', { title: 'Copy LinkedIn Post' }),
      step('show-result', { title: 'LinkedIn Draft', label: 'LinkedIn Post' }),
    ],
  },
  {
    id: 317,
    name: 'Transcript to Shorts Clips',
    icon: 'scissors',
    color: 'bg-pink',
    category: 'youtuber',
    steps: [
      step('clipboard-read', { title: 'Read Transcript' }),
      step('ai-prompt', {
        title: 'Find Clip Angles',
        prompt: 'From this transcript, identify 5 strong short-form clip opportunities.\n\n{{result}}\n\nFor each clip provide: clip angle, opening line, why it works, caption, and ideal CTA.',
        systemPrompt: 'You are a short-form editor extracting the highest-potential moments from long-form content.',
      }),
      step('show-result', { title: 'Clip Pack', label: 'Shorts Opportunities' }),
    ],
  },
  {
    id: 318,
    name: 'Sponsor Ad Read Writer',
    icon: 'dollar-sign',
    color: 'bg-green',
    category: 'youtuber',
    steps: [
      step('user-input', {
        title: 'Sponsor Brief',
        label: 'Paste the sponsor offer, audience, and constraints',
        placeholder: 'AI note-taking app for creators, mention 20% discount, keep it authentic',
      }),
      step('ai-prompt', {
        title: 'Write Ad Read',
        prompt: 'Write a sponsor integration for a YouTube video based on this brief:\n\n{{result}}\n\nReturn a 30-second version, a 60-second version, and 3 natural transition lines into the ad.',
        systemPrompt: 'You write sponsor reads that sound trustworthy and creator-native, not corporate.',
      }),
      step('clipboard-write', { title: 'Copy Ad Read' }),
      step('show-result', { title: 'Sponsor Copy', label: 'Ad Read' }),
    ],
  },
  {
    id: 319,
    name: 'B-Roll Shot List',
    icon: 'film',
    color: 'bg-indigo',
    category: 'youtuber',
    steps: [
      step('clipboard-read', { title: 'Read Script' }),
      step('ai-prompt', {
        title: 'Plan B-Roll',
        prompt: 'Create a B-roll and on-screen visual shot list from this script:\n\n{{result}}\n\nReturn a table-like list with segment, visual, purpose, and difficulty to capture.',
        systemPrompt: 'You are a production planner for creator-led explainer videos.',
      }),
      step('show-result', { title: 'Shot List', label: 'B-Roll Plan' }),
    ],
  },
  {
    id: 320,
    name: 'Chapter Marker Generator',
    icon: 'list',
    color: 'bg-orange',
    category: 'youtuber',
    steps: [
      step('clipboard-read', { title: 'Read Timestamped Notes' }),
      step('ai-prompt', {
        title: 'Draft Chapters',
        prompt: 'Based on this transcript or timestamped note set, create polished YouTube chapter markers:\n\n{{result}}\n\nIf timestamps are present, preserve them. If not, output chapter titles only.',
        systemPrompt: 'You format YouTube chapter markers for clarity and scanability.',
      }),
      step('clipboard-write', { title: 'Copy Chapters' }),
      step('show-result', { title: 'Chapter Markers', label: 'Chapters' }),
    ],
  },
  {
    id: 321,
    name: 'Community Post Draft',
    icon: 'message-square',
    color: 'bg-purple',
    category: 'youtuber',
    steps: [
      step('user-input', {
        title: 'Update',
        label: 'What should the audience hear from you?',
        placeholder: 'I am testing a full AI shortcut workflow this week',
      }),
      step('ai-prompt', {
        title: 'Write Community Posts',
        prompt: 'Create 5 YouTube community post variations from this update:\n\n{{result}}\n\nMix hype, curiosity, behind-the-scenes, question-led, and authority-led tones.',
        systemPrompt: 'You write creator-audience community posts that drive comments and anticipation.',
      }),
      step('show-result', { title: 'Community Ideas', label: 'Community Posts' }),
    ],
  },
  {
    id: 322,
    name: 'Comment Reply Bank',
    icon: 'message-circle',
    color: 'bg-cyan',
    category: 'youtuber',
    steps: [
      step('clipboard-read', { title: 'Read Viewer Comments' }),
      step('ai-prompt', {
        title: 'Draft Replies',
        prompt: 'Create thoughtful, fast-to-send replies to these viewer comments:\n\n{{result}}\n\nKeep each reply short, warm, and likely to encourage more conversation.',
        systemPrompt: 'You are a creator community manager who sounds helpful and human.',
      }),
      step('show-result', { title: 'Reply Bank', label: 'Comment Replies' }),
    ],
  },
  {
    id: 323,
    name: 'Upload Package Builder',
    icon: 'package',
    color: 'bg-red',
    category: 'youtuber',
    favorite: true,
    steps: [
      step('user-input', {
        title: 'Video Brief',
        label: 'Paste the topic, promise, and CTA',
        placeholder: 'Video on building a shortcut ecosystem for an AI YouTuber with CTA to my newsletter',
      }),
      step('ai-prompt', {
        title: 'Assemble Package',
        prompt: 'Build a full YouTube upload package from this brief:\n\n{{result}}\n\nReturn:\n- 5 title options\n- 1 SEO description\n- 3 thumbnail text options\n- 1 pinned comment\n- 15 tags\n- 3 chapter title suggestions\n- 1 CTA block',
        systemPrompt: 'You are a YouTube packaging expert obsessed with clarity and conversion.',
      }),
      step('clipboard-write', { title: 'Copy Upload Package' }),
      step('show-result', { title: 'Upload Package', label: 'Packaging' }),
    ],
  },
  {
    id: 324,
    name: 'Thumbnail Prompt to Image',
    icon: 'image',
    color: 'bg-pink',
    category: 'youtuber',
    steps: [
      step('user-input', {
        title: 'Thumbnail Concept',
        label: 'Describe the thumbnail concept or emotion',
        placeholder: 'creator shocked by AI dashboard taking over entire workflow',
      }),
      step('ai-prompt', {
        title: 'Refine Prompt',
        prompt: 'Turn this thumbnail concept into a polished AI image prompt for a YouTube thumbnail background:\n\n{{result}}\n\nKeep it bold, simple, cinematic, and high-contrast.',
        systemPrompt: 'You write image prompts for clickable YouTube thumbnail concepts.',
      }),
      step('image-gen', {
        title: 'Generate Thumbnail Base',
        prompt: '{{result}}',
        size: '1792x1024',
        quality: 'hd',
      }),
      step('show-result', { title: 'Thumbnail Image', label: 'Thumbnail Base' }),
    ],
  },
  {
    id: 325,
    name: 'Guest Research Brief',
    icon: 'user',
    color: 'bg-yellow',
    category: 'youtuber',
    steps: [
      step('user-input', {
        title: 'Guest Name',
        label: 'Who is the guest or creator?',
        placeholder: 'a founder building AI tools for creators',
      }),
      step('set-var', { title: 'Save Guest', varName: 'guest' }),
      step('google-search', {
        title: 'Research Guest',
        query: '{{vars.guest}} interviews background company opinions latest news',
        numResults: 8,
      }),
      step('set-var', { title: 'Save Web Research', varName: 'guestResearch' }),
      step('wikipedia-search', {
        title: 'Fetch Encyclopedia Context',
        query: '{{vars.guest}}',
        sentences: 4,
      }),
      step('ai-prompt', {
        title: 'Build Guest Brief',
        prompt: 'Guest: {{vars.guest}}\n\nWeb research:\n{{vars.guestResearch}}\n\nReference summary:\n{{result}}\n\nCreate a concise guest brief with background, current relevance, likely talking points, sensitive areas to avoid, and 5 conversation hooks.',
        systemPrompt: 'You are a podcast and YouTube producer preparing the host to sound informed quickly.',
      }),
      step('show-result', { title: 'Guest Brief', label: 'Research Brief' }),
    ],
  },
  {
    id: 326,
    name: 'Interview Question Builder',
    icon: 'message-square',
    color: 'bg-blue',
    category: 'youtuber',
    steps: [
      step('user-input', {
        title: 'Interview Angle',
        label: 'What is the guest/topic/goal?',
        placeholder: 'Interview an AI founder about how creators should use agents in 2026',
      }),
      step('ai-prompt', {
        title: 'Generate Questions',
        prompt: 'Create 20 interview questions from this brief:\n\n{{result}}\n\nGroup them into warm-up, tactical, contrarian, future-looking, and closing questions.',
        systemPrompt: 'You write interview questions that lead to stories, specificity, and strong clips.',
      }),
      step('show-result', { title: 'Interview Questions', label: 'Question Set' }),
    ],
  },
  {
    id: 327,
    name: 'Channel Positioning Audit',
    icon: 'search',
    color: 'bg-green',
    category: 'youtuber',
    steps: [
      step('user-input', {
        title: 'Channel',
        label: 'Paste a channel name, URL, or positioning summary',
        placeholder: 'AI creator teaching tools, workflows, and monetization',
      }),
      step('set-var', { title: 'Save Channel', varName: 'channel' }),
      step('youtube-search', {
        title: 'Review Video Surface',
        query: '{{vars.channel}}',
        maxResults: 10,
      }),
      step('set-var', { title: 'Save YouTube Surface', varName: 'ytSurface' }),
      step('google-search', {
        title: 'Review Web Surface',
        query: '{{vars.channel}} newsletter website twitter linkedin',
        numResults: 8,
      }),
      step('ai-prompt', {
        title: 'Audit Positioning',
        prompt: 'Channel input: {{vars.channel}}\n\nYouTube surface:\n{{vars.ytSurface}}\n\nWeb surface:\n{{result}}\n\nAudit the positioning, promise clarity, monetization potential, strengths, weaknesses, and 5 strategic recommendations.',
        systemPrompt: 'You are a creator-business strategist who evaluates channels for growth and monetization.',
      }),
      step('show-result', { title: 'Channel Audit', label: 'Positioning Audit' }),
    ],
  },
  {
    id: 328,
    name: 'Analytics Snapshot Deck',
    icon: 'presentation',
    color: 'bg-indigo',
    category: 'youtuber',
    steps: [
      step('clipboard-read', { title: 'Read Metrics' }),
      step('ai-prompt', {
        title: 'Outline Slides',
        prompt: 'Turn these YouTube analytics notes into a slide outline JSON array.\n\n{{result}}\n\nReturn valid JSON in this shape: [{\"title\":\"Slide title\",\"content\":\"Bullet 1\\nBullet 2\",\"notes\":\"optional speaker notes\"}]',
        systemPrompt: 'You are an analytics operator. Return only valid JSON.',
      }),
      step('create-pptx', { title: 'Export Deck', title: 'YouTube Analytics Snapshot' }),
      step('show-result', { title: 'Saved Deck', label: 'Presentation File' }),
    ],
  },
  {
    id: 329,
    name: 'Monthly ROI Report',
    icon: 'bar-chart',
    color: 'bg-orange',
    category: 'youtuber',
    steps: [
      step('clipboard-read', { title: 'Read Monthly Metrics' }),
      step('ai-prompt', {
        title: 'Write Report',
        prompt: 'Create a monthly ROI report for an AI YouTube business from these notes and metrics:\n\n{{result}}\n\nInclude wins, weak points, content lessons, monetization insights, and next-month priorities.',
        systemPrompt: 'You are a creator COO writing concise reports for decision-making. Use clear markdown.',
      }),
      step('text-to-pdf', { title: 'Export PDF Report' }),
      step('show-result', { title: 'Saved Report', label: 'ROI Report PDF' }),
    ],
  },
]
