/**
 * interpolate.js — Template variable substitution helpers
 *
 * Supports: {{result}}, {{clipboard}}, {{vars.name}}, {{memory.key}}
 */

export function getPath(obj, path) {
  if (!path) return undefined
  return path.split('.').reduce((acc, part) => {
    if (acc === undefined || acc === null) return undefined
    return acc[part]
  }, obj)
}

export function resolveToken(token, ctx) {
  if (token === 'result') return ctx.result ?? ''
  if (token === 'clipboard') return ctx.clipboard ?? ''
  if (token.startsWith('vars.')) return ctx.vars[token.slice(5)] ?? ''
  if (token.startsWith('memory.')) return getPath(ctx.memory, token.slice(7)) ?? ''
  return null
}

export function interpolate(template, ctx) {
  if (typeof template !== 'string') return template
  return template.replace(/\{\{([^}]+)\}\}/g, (full, rawToken) => {
    const token = String(rawToken || '').trim()
    const value = resolveToken(token, ctx)
    return value === null ? full : String(value)
  })
}

/**
 * Interpolate all string values in a step's params.
 */
export function interpolateStep(step, ctx) {
  const out = {}
  for (const [k, v] of Object.entries(step)) {
    out[k] = typeof v === 'string' ? interpolate(v, ctx) : v
  }
  return out
}
