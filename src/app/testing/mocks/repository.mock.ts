/**
 * @fileoverview Mock repository implementations for testing.
 * @author Work Timer Application
 */

import { Duration, TimerStatus, WorkDayDate } from '../../domain';
import { WorkSession } from '../../domain/entities/work-session';
import { WorkDay } from '../../domain/entities/work-day';
import { WorkSessionRepository } from '../../domain/repositories/work-session.repository';
import { WorkDayRepository } from '../../domain/repositories/work-day.repository';
import { TimerStateRepository } from '../../domain/repositories/timer-state.repository';
import { TimerApplicationState } from '../../application/services/timer-application.service';

export class MockWorkSessionRepository implements WorkSessionRepository {
  private sessions: WorkSession[] = [];

  save = jasmine.createSpy('save').and.callFake((session: WorkSession) => {
    const existingIndex = this.sessions.findIndex(s => s.id === session.id);
    if (existingIndex >= 0) {
      this.sessions[existingIndex] = session;
    } else {
      this.sessions.push(session);
    }
    return Promise.resolve();
  });

  findById = jasmine.createSpy('findById').and.callFake((id: string) => {
    const session = this.sessions.find(s => s.id === id);
    return Promise.resolve(session || null);
  });

  findByDate = jasmine.createSpy('findByDate').and.callFake((date: WorkDayDate) => {
    const sessions = this.sessions.filter(s => s.workDate.equals(date));
    return Promise.resolve(sessions);
  });

  findAll = jasmine.createSpy('findAll').and.callFake(() => {
    return Promise.resolve([...this.sessions]);
  });

  delete = jasmine.createSpy('delete').and.callFake((id: string) => {
    this.sessions = this.sessions.filter(s => s.id !== id);
    return Promise.resolve();
  });

  deleteByDate = jasmine.createSpy('deleteByDate').and.callFake((date: WorkDayDate) => {
    this.sessions = this.sessions.filter(s => !s.workDate.equals(date));
    return Promise.resolve();
  });

  // Utility methods for testing
  setSessions(sessions: WorkSession[]): void {
    this.sessions = [...sessions];
  }

  getSessions(): WorkSession[] {
    return [...this.sessions];
  }

  clear(): void {
    this.sessions = [];
  }
}

export class MockWorkDayRepository implements WorkDayRepository {
  private workDays: Map<string, WorkDay> = new Map();

  save = jasmine.createSpy('save').and.callFake((workDay: WorkDay) => {
    this.workDays.set(workDay.date.toISOString(), workDay);
    return Promise.resolve();
  });

  findByDate = jasmine.createSpy('findByDate').and.callFake((date: WorkDayDate) => {
    const workDay = this.workDays.get(date.toISOString());
    return Promise.resolve(workDay || null);
  });

  findAll = jasmine.createSpy('findAll').and.callFake(() => {
    return Promise.resolve(Array.from(this.workDays.values()));
  });

  delete = jasmine.createSpy('delete').and.callFake((date: WorkDayDate) => {
    this.workDays.delete(date.toISOString());
    return Promise.resolve();
  });

  // Utility methods for testing
  setWorkDay(workDay: WorkDay): void {
    this.workDays.set(workDay.date.toISOString(), workDay);
  }

  getWorkDay(date: WorkDayDate): WorkDay | undefined {
    return this.workDays.get(date.toISOString());
  }

  clear(): void {
    this.workDays.clear();
  }
}

export class MockTimerStateRepository implements TimerStateRepository {
  private state: TimerApplicationState | null = null;

  save = jasmine.createSpy('save').and.callFake((state: TimerApplicationState) => {
    this.state = state;
    return Promise.resolve();
  });

  load = jasmine.createSpy('load').and.callFake(() => {
    return Promise.resolve(this.state);
  });

  clear = jasmine.createSpy('clear').and.callFake(() => {
    this.state = null;
    return Promise.resolve();
  });

  // Utility methods for testing
  setState(state: TimerApplicationState): void {
    this.state = state;
  }

  getState(): TimerApplicationState | null {
    return this.state;
  }

  hasState(): boolean {
    return this.state !== null;
  }
}

// Factory functions for creating pre-configured mocks
export function createMockWorkSessionRepository(sessions: WorkSession[] = []): MockWorkSessionRepository {
  const repo = new MockWorkSessionRepository();
  repo.setSessions(sessions);
  return repo;
}

export function createMockWorkDayRepository(workDays: WorkDay[] = []): MockWorkDayRepository {
  const repo = new MockWorkDayRepository();
  workDays.forEach(workDay => repo.setWorkDay(workDay));
  return repo;
}

export function createMockTimerStateRepository(state?: TimerApplicationState): MockTimerStateRepository {
  const repo = new MockTimerStateRepository();
  if (state) {
    repo.setState(state);
  }
  return repo;
}

// Utility function to create a basic timer state for testing
export function createMockTimerState(overrides: Partial<TimerApplicationState> = {}): TimerApplicationState {
  return {
    workDay: WorkDay.create(WorkDayDate.today()),
    calculations: {
      totalWorkTime: Duration.zero(),
      totalPauseTime: Duration.zero(),
      pauseDeduction: Duration.zero(),
      effectiveWorkTime: Duration.zero(),
      remainingTime: Duration.fromHours(10),
      isComplete: false
    },
    currentSessionTime: Duration.zero(),
    ...overrides
  };
}