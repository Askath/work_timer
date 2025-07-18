/**
 * @fileoverview Business rules configuration constants.
 * @author Work Timer Application
 */

import { Duration } from '../../domain/index';

export const BUSINESS_RULES = {
  DAILY_LIMIT: {
    HOURS: 10,
    MINUTES: 10 * 60,
    DURATION: Duration.fromMinutes(10 * 60)
  },
  
  PAUSE_DEDUCTION: {
    THRESHOLD_MINUTES: 30,
    DEDUCTION_MINUTES: 30,
    THRESHOLD_DURATION: Duration.fromMinutes(30),
    DEDUCTION_DURATION: Duration.fromMinutes(30)
  },
  
  SESSION: {
    MINIMUM_DURATION_SECONDS: 1,
    MINIMUM_DURATION: Duration.fromSeconds(1)
  },
  
  TIMER: {
    UPDATE_INTERVAL_MS: 1000,
    STORAGE_DEBOUNCE_MS: 500
  }
} as const;

export type BusinessRulesConfig = typeof BUSINESS_RULES;