// Communication shortcuts (id 24)
import { makeStep, getActionDef } from '../actions/index.js'

function step(type, overrides = {}) {
  const def = getActionDef(type)
  if (!def) throw new Error(`defaultShortcuts: unknown action type "${type}"`)
  return { ...makeStep(def), ...overrides }
}

export default [
  {
    id: 24,
    name: 'Send Quick Email',
    icon: 'send',
    color: 'bg-blue',
    category: 'comm',
    favorite: false,
    steps: [
      step('user-input', { title: 'Recipient', label: 'To:', placeholder: 'example@mail.com' }),
      step('set-var', { title: 'Save Recipient', varName: 'toEmail' }),
      step('user-input', { title: 'Subject', label: 'Subject:', placeholder: 'Important Update' }),
      step('set-var', { title: 'Save Subject', varName: 'emailSubject' }),
      step('user-input', { title: 'Message', label: 'Message:', placeholder: 'Type your message here...' }),
      step('smtp-send', {
        title: 'Send Email',
        to: '{{vars.toEmail}}',
        subject: '{{vars.emailSubject}}',
        body: '{{result}}',
      }),
      step('show-result', { title: 'Sent Status', label: 'Email Sent' }),
    ],
  },
]
