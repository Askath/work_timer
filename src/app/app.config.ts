import { ApplicationConfig, provideBrowserGlobalErrorListeners, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';

import { routes } from './app.routes';

// Repository injection tokens
import { WORK_SESSION_REPOSITORY, WORK_DAY_REPOSITORY, TIMER_STATE_REPOSITORY } from './domain/repositories/injection-tokens';

// Repository implementations
import { HttpWorkSessionRepository } from './infrastructure/repositories/http-work-session.repository';
import { HttpWorkDayRepository } from './infrastructure/repositories/http-work-day.repository';
import { LocalStorageTimerStateRepository } from './infrastructure/repositories/local-storage-timer-state.repository';

// Adapter injection tokens
import { TIMER_ADAPTER, DATE_TIME_ADAPTER, STORAGE_ADAPTER } from './infrastructure/adapters/injection-tokens';

// Adapter implementations
import { SystemTimerAdapter } from './infrastructure/adapters/timer.adapter';
import { SystemDateTimeAdapter } from './infrastructure/adapters/date-time.adapter';
import { LocalStorageAdapter } from './infrastructure/adapters/local-storage.adapter';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideHttpClient(),
    
    // Repository providers
    { provide: WORK_SESSION_REPOSITORY, useClass: HttpWorkSessionRepository },
    { provide: WORK_DAY_REPOSITORY, useClass: HttpWorkDayRepository },
    { provide: TIMER_STATE_REPOSITORY, useClass: LocalStorageTimerStateRepository },
    
    // Adapter providers
    { provide: TIMER_ADAPTER, useClass: SystemTimerAdapter },
    { provide: DATE_TIME_ADAPTER, useClass: SystemDateTimeAdapter },
    { provide: STORAGE_ADAPTER, useClass: LocalStorageAdapter }
  ]
};
