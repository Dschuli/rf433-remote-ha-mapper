/* =========================================================
 * RF433 Utility Functions
 * ========================================================= */

import { LOG_LEVEL } from '../rf433/rf433-config.js';

/**
 * Logging utility that respects the configured LOG_LEVEL
 * Levels: 0 = off, 1 = error only, 2 = error + warn, 3 = error + warn + info, 4 = all (debug)
 */
export const logger = {
  debug: (...args) => LOG_LEVEL >= 4 && console.log(...args),
  info: (...args) => LOG_LEVEL >= 3 && console.log(...args),
  warn: (...args) => LOG_LEVEL >= 2 && console.warn(...args),
  error: (...args) => LOG_LEVEL >= 1 && console.error(...args)
};
