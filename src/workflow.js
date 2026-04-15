/**
 * workflow.js — Compatibility shim
 *
 * The workflow module has been refactored into src/workflow/.
 * This file re-exports the public API for backward compatibility.
 *
 * Prefer importing from './workflow/index.js' directly.
 */

export { runWorkflow } from './workflow/index.js'
