import { makeStep, getActionDef } from '../actions/index.js'

function step(type, overrides = {}) {
  const def = getActionDef(type)
  if (!def) throw new Error(`defaultShortcuts: unknown action type "${type}"`)
  return { ...makeStep(def), ...overrides }
}

export default [
  {
    id: 501,
    name: 'Petit Journal Matinal AI',
    desc: 'Résumé complet : Météo, Actualités, Agenda et E-mails urgents.',
    icon: 'coffee',
    color: 'bg-orange',
    category: 'lifestyle',
    favorite: true,
    steps: [
      step('weather', { location: 'Paris, FR' }),
      step('set-var', { varName: 'meteo' }),
      step('google-search', { query: 'actualité france matin', numResults: 5 }),
      step('set-var', { varName: 'news' }),
      step('google-calendar-list', { maxResults: 5 }),
      step('set-var', { varName: 'agenda' }),
      step('ai-prompt', {
        title: 'Résumé Matinal',
        prompt: `Agis comme un assistant personnel d'élite. Prépare un briefing matinal concis en français.

Météo : {{vars.meteo}}
Actualités : {{vars.news}}
Agenda : {{vars.agenda}}

Structure :
1. Salutation motivante.
2. Météo rapide et conseil de tenue.
3. Les 3 actus essentielles.
4. Tes rendez-vous clés du jour.`,
        outputFormat: 'markdown'
      }),
      step('tts', { text: '{{result}}', voice: '' })
    ]
  },
  {
    id: 502,
    name: 'Histoires Enchantées AI',
    desc: 'Génère une histoire personnalisée pour les enfants et la lit à voix haute.',
    icon: 'sparkles',
    color: 'bg-purple',
    category: 'lifestyle',
    favorite: true,
    steps: [
      step('user-input', {
        title: 'Sujet de l\'histoire',
        label: 'Prénom de l\'enfant et thème (ex: Léo et le dragon)',
        placeholder: 'Léo et le dragon bleu',
      }),
      step('ai-prompt', {
        title: 'Générer Histoire',
        prompt: 'Écris une courte histoire magique de 5 minutes pour un enfant. Thème : {{result}}. Langue : Français.',
        systemPrompt: 'Tu es un conteur magique pour enfants. Écris des histoires douces et merveilleuses.',
        outputFormat: 'plain'
      }),
      step('tts', { text: '{{result}}', voice: '' })
    ]
  },
  {
    id: 503,
    name: 'Vérificateur de Devoirs OCR',
    desc: 'Analyse une photo d\'exercice et vérifie les réponses.',
    icon: 'graduation-cap',
    color: 'bg-green',
    category: 'lifestyle',
    favorite: false,
    steps: [
      step('file-picker', { buttonLabel: 'Scanner Devoirs' }),
      step('image-vision', {
        title: 'Analyser Devoirs',
        prompt: 'Vérifie ces devoirs. Identifie les erreurs s\'il y en a et donne des explications pédagogiques pour aider comprendre.',
        model: 'gpt-4o'
      }),
      step('show-result', { label: 'Correction Devoirs' })
    ]
  },
  {
    id: 504,
    name: 'Coach Repas & Courses Turbo',
    desc: 'Propose des recettes et génère la liste de courses.',
    icon: 'shopping-basket',
    color: 'bg-red',
    category: 'lifestyle',
    favorite: true,
    steps: [
      step('user-input', {
        title: 'Envies ou Frigo',
        label: 'Qu\'as-tu envie de manger ou qu\'y a-t-il dans ton frigo ?',
        placeholder: 'Poulet, carottes, pâtes...',
      }),
      step('ai-prompt', {
        title: 'Planifier Repas',
        prompt: `Basé sur : {{result}}.
Génère :
1. Un menu pour 3 jours (Déjeuner/Dîner).
2. Une liste de courses classée par rayon.
3. Des astuces de préparation rapide.`,
        outputFormat: 'markdown'
      }),
      step('show-result', { label: 'Menu & Courses' })
    ]
  },
  {
    id: 505,
    name: 'Analyseur de Courrier & Factures',
    desc: 'Numérise tes courriers et identifie les actions à faire.',
    icon: 'mail-search',
    color: 'bg-blue',
    category: 'lifestyle',
    favorite: false,
    steps: [
      step('file-picker', { buttonLabel: 'Scanner Courrier' }),
      step('image-vision', {
        title: 'Analyser Courrier',
        prompt: 'Analyse ce document. 1. Nature du document. 2. Urgence. 3. Action requise (payer, répondre). 4. Date limite.',
        model: 'gpt-4o'
      }),
      step('nextcloud-note', { title: 'Action Courrier : {{result}}', category: 'Admin' }),
      step('show-result', { label: 'Analyse Courrier' })
    ]
  },
  {
    id: 506,
    name: 'Optimiseur de Journée 10x',
    desc: 'Organise ta liste de tâches par priorité et efficacité.',
    icon: 'zap',
    color: 'bg-red',
    category: 'lifestyle',
    favorite: true,
    steps: [
      step('user-input', {
        title: 'Liste de tâches',
        label: 'Colle tes tâches en vrac ici',
        placeholder: 'Aller au pressing, appeler maman, devoirs...',
      }),
      step('ai-prompt', {
        title: 'Optimiser Planning',
        prompt: `Voici ma liste : {{result}}.
Organise-la par ordre d'importance et d'efficacité. Groupe les tâches extérieures.`,
        outputFormat: 'markdown'
      }),
      step('show-result', { label: 'Planning Optimisé' })
    ]
  }
]
