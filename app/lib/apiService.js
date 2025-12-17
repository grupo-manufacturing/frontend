/**
 * API Service - Backward compatibility wrapper
 * 
 * This file re-exports the new modular service structure for backward compatibility.
 * All existing imports will continue to work without changes.
 * 
 * @deprecated Consider importing from './services/index.js' for better tree-shaking
 */

// Re-export from the new modular structure
export { default, getApiBaseOrigin } from './services/index.js';
