/**
 * actions/index.js — assembles ACTION_REGISTRY from per-category modules.
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
 *
 * Context object passed between steps:
 *   { result, clipboard, vars, log }
 *
 * Variable substitution in string params: {{result}}, {{clipboard}}, {{vars.foo}}
 */

import inputActions      from './input.js'
import aiActions         from './ai.js'
import outputActions     from './output.js'
import systemActions     from './system.js'
import multimediaActions from './multimedia.js'
import dataActions       from './data.js'
import servicesActions   from './services.js'
import productivityActions from './productivity.js'
import officeActions       from './office.js'
import freelanceActions   from './freelance.js'
import adminActions      from './admin.js'

export const ACTION_REGISTRY = [
  ...inputActions,
  ...aiActions,
  ...outputActions,
  ...systemActions,
  ...multimediaActions,
  ...dataActions,
  ...servicesActions,
  ...productivityActions,
  ...officeActions,
  ...freelanceActions,
  ...adminActions,
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
