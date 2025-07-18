/**
 * @fileoverview Infrastructure configuration settings.
 * @author Work Timer Application
 */

import { BUSINESS_RULES } from './business-rules.config';
import { TIMER_CONFIG } from './timer.config';

export const INFRASTRUCTURE_CONFIG = {
  BUSINESS_RULES,
  TIMER: TIMER_CONFIG,
  
  LOGGING: {
    ENABLED: true,
    LEVEL: 'info' as 'debug' | 'info' | 'warn' | 'error',
    CONSOLE_OUTPUT: true,
    STORAGE_OUTPUT: false
  },
  
  ERROR_HANDLING: {
    RETRY_ATTEMPTS: 3,
    RETRY_DELAY: 1000,
    FALLBACK_STORAGE: 'memory'
  },
  
  DEVELOPMENT: {
    MOCK_ADAPTERS: false,
    DEBUG_MODE: false,
    PERFORMANCE_MONITORING: false
  }
} as const;

export type InfrastructureConfig = typeof INFRASTRUCTURE_CONFIG;