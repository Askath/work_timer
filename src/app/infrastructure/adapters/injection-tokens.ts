/**
 * @fileoverview Injection tokens for adapter interfaces.
 * @author Work Timer Application
 */

import { InjectionToken } from '@angular/core';
import { TimerAdapter } from './timer.adapter';
import { DateTimeAdapter } from './date-time.adapter';
import { StorageAdapter } from './local-storage.adapter';

export const TIMER_ADAPTER = new InjectionToken<TimerAdapter>('TimerAdapter');
export const DATE_TIME_ADAPTER = new InjectionToken<DateTimeAdapter>('DateTimeAdapter');
export const STORAGE_ADAPTER = new InjectionToken<StorageAdapter>('StorageAdapter');