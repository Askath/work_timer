/**
 * @fileoverview Timer configuration settings.
 * @author Work Timer Application
 */

export const TIMER_CONFIG = {
  INTERVALS: {
    CURRENT_SESSION_UPDATE: 1000, // 1 second
    STATE_PERSISTENCE: 5000, // 5 seconds
    STORAGE_CLEANUP: 60000 // 1 minute
  },
  
  STORAGE: {
    KEYS: {
      CURRENT_STATE: 'work-timer-current-state',
      WORK_SESSIONS: 'work-timer-sessions',
      WORK_DAYS: 'work-timer-workdays',
      SETTINGS: 'work-timer-settings'
    },
    
    RETENTION_DAYS: 30,
    COMPRESSION_ENABLED: false,
    ENCRYPTION_ENABLED: false
  },
  
  UI: {
    THEME: 'light',
    ANIMATIONS_ENABLED: true,
    NOTIFICATION_TIMEOUT: 5000,
    AUTO_SAVE_INTERVAL: 10000
  },
  
  PERFORMANCE: {
    LAZY_LOADING_ENABLED: true,
    CHANGE_DETECTION_STRATEGY: 'OnPush',
    DEBOUNCE_TIME: 300
  }
} as const;

export type TimerConfig = typeof TIMER_CONFIG;