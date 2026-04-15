export const SHORTCUT_CATEGORIES = [
  { id: 'ai', label: 'AI Workflows', icon: 'sparkles' },
  { id: 'personal', label: 'Personal', icon: 'zap' },
  { id: 'finance', label: 'Finance', icon: 'wallet' },
  { id: 'media', label: 'Media', icon: 'image' },
  { id: 'comm', label: 'Communication', icon: 'mail' },
  { id: 'socialnet', label: 'Social Networks', icon: 'share-2' },
  { id: 'dev', label: 'Development', icon: 'code-2' },
  { id: 'freelance', label: 'Freelance', icon: 'briefcase' },
  { id: 'youtuber', label: 'YouTuber', icon: 'video' },
  { id: 'admin', label: 'System Admin', icon: 'server' },
  { id: 'lifestyle', label: 'Lifestyle & Productivity', icon: 'heart' },
]

export const SHORTCUT_CATEGORY_IDS = SHORTCUT_CATEGORIES.map((category) => category.id)

export function getShortcutCategoryLabel(categoryId) {
  const match = SHORTCUT_CATEGORIES.find((category) => category.id === categoryId)
  if (match) return match.label
  if (!categoryId) return 'Uncategorized'
  return categoryId
    .replace(/[-_]+/g, ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase())
}
