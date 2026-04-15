/**
 * logger.js — Step-level debug logger
 *
 * Provides browser console + Electron terminal log output per workflow step.
 */

export const Logger = {
  info(shortcut, step, entry) {
    this._log('INFO', shortcut, step, entry, 'color: #3b82f6; font-weight: bold;')
  },
  error(shortcut, step, entry) {
    this._log('ERROR', shortcut, step, entry, 'color: #ef4444; font-weight: bold;')
  },
  _log(level, shortcut, step, entry, levelStyle) {
    const timestamp = new Date().toLocaleTimeString()
    const status = entry.error ? 'FAILED' : 'SUCCESS'
    const statusStyle = entry.error ? 'color: #ef4444;' : 'color: #10b981;'

    console.groupCollapsed(
      `%c[${level}] %c${timestamp} %c| %c${shortcut.name} %c| %c${step.title || step.type} %c| %c${status} %c(${entry.ms}ms)`,
      levelStyle,
      'color: #6b7280;',
      'color: #9ca3af;',
      'color: var(--accent-primary, #8b5cf6); font-weight: bold;',
      'color: #9ca3af;',
      'color: #fff;',
      'color: #9ca3af;',
      statusStyle + ' font-weight: bold;',
      'color: #6b7280; font-style: italic;'
    )

    console.log('%cAction:%c', 'color: #9ca3af; font-weight: bold;', '', step.type)
    console.log('%cDuration:%c', 'color: #9ca3af; font-weight: bold;', '', `${entry.ms}ms`)

    if (step) {
      console.log('%cConfig:%c', 'color: #9ca3af; font-weight: bold;', '', { ...step })
    }

    if (entry.input !== undefined) {
      console.log('%cInput:%c', 'color: #3b82f6; font-weight: bold;', '', entry.input)
    }

    if (entry.error) {
      console.log('%cError:%c', 'color: #ef4444; font-weight: bold;', '', entry.error)
    } else {
      console.log('%cOutput:%c', 'color: #10b981; font-weight: bold;', '', entry.output)
    }

    if (entry.debug) {
      console.group('%cDebug Details (Request/Response)%c', 'color: #eab308; font-weight: bold;', '')
      if (entry.debug.request)  console.log('%cRequest:%c', 'color: #9ca3af; font-weight: bold;', '', entry.debug.request)
      if (entry.debug.response) console.log('%cResponse:%c', 'color: #9ca3af; font-weight: bold;', '', entry.debug.response)
      console.groupEnd()
    }

    console.groupEnd()

    // Send to terminal
    window.ipcRenderer.send('log-to-terminal', {
      type: 'step',
      level,
      shortcutName: shortcut.name,
      stepTitle: step.title || step.type,
      entry: {
        ms: entry.ms,
        error: entry.error
      }
    })
  }
}
