/**
 * @fileoverview Injection tokens for repository interfaces.
 * @author Work Timer Application
 */

import { InjectionToken } from '@angular/core';
import { WorkSessionRepository } from './work-session.repository';
import { WorkDayRepository } from './work-day.repository';
import { TimerStateRepository } from './timer-state.repository';

export const WORK_SESSION_REPOSITORY = new InjectionToken<WorkSessionRepository>('WorkSessionRepository');
export const WORK_DAY_REPOSITORY = new InjectionToken<WorkDayRepository>('WorkDayRepository');
export const TIMER_STATE_REPOSITORY = new InjectionToken<TimerStateRepository>('TimerStateRepository');