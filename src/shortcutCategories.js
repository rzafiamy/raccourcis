export const SHORTCUT_CATEGORIES = [
  { id: 'ai', label: 'AI Workflows' },
  { id: 'personal', label: 'Personal' },
  { id: 'finance', label: 'Finance' },
  { id: 'media', label: 'Media' },
  { id: 'comm', label: 'Communication' },
  { id: 'socialnet', label: 'Social Networks' },
  { id: 'dev', label: 'Development' },
  { id: 'freelance', label: 'Freelance' },
  { id: 'youtuber', label: 'YouTuber' },
  { id: 'admin', label: 'System Admin' },
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
