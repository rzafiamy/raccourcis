/**
 * workflow/index.js — Public entry point for the workflow module
 *
 * Re-exports the public API so existing importers can switch from
 *   import { runWorkflow } from './workflow.js'
 * to
 *   import { runWorkflow } from './workflow/index.js'
 * (or simply './workflow/' since bundlers resolve index.js automatically)
 */

export { runWorkflow } from './runner.js'
