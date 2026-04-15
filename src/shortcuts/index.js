/**
 * shortcuts/index.js — assembles DEFAULT_SHORTCUTS from per-category modules.
 *
 * Steps are built via makeStep() so their icon/color always stay in sync
 * with the ACTION_REGISTRY. Custom params are spread on top.
 */

import aiShortcuts           from './ai.js'
import developerShortcuts    from './developer.js'
import systemShortcuts       from './system.js'
import mediaShortcuts        from './media.js'
import communicationShortcuts from './communication.js'
import financeShortcuts      from './finance.js'
import filesShortcuts        from './files.js'
import analyticsShortcuts    from './analytics.js'
import socialnetShortcuts    from './socialnet.js'
import officeShortcuts       from './office.js'
import messagingShortcuts    from './messaging.js'
import freelanceShortcuts    from './freelancer.js'
import youtuberShortcuts     from './youtuber.js'
import adminShortcuts        from './admin.js'
import lifestyleShortcuts    from './lifestyle.js'

export const DEFAULT_SHORTCUTS = [
  ...aiShortcuts,
  ...developerShortcuts,
  ...systemShortcuts,
  ...mediaShortcuts,
  ...communicationShortcuts,
  ...financeShortcuts,
  ...filesShortcuts,
  ...analyticsShortcuts,
  ...socialnetShortcuts,
  ...officeShortcuts,
  ...messagingShortcuts,
  ...freelanceShortcuts,
  ...youtuberShortcuts,
  ...adminShortcuts,
  ...lifestyleShortcuts,
]
