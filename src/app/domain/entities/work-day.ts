/**
 * @fileoverview WorkDay aggregate root representing a complete work day.
 * @author Work Timer Application
 */

import { Duration } from '../value-objects/duration';
import { TimerStatus } from '../value-objects/timer-status';
import { WorkDayDate } from '../value-objects/work-day-date';
import { WorkSession } from './work-session';

export interface WorkDayCalculations {
  totalWorkTime: Duration;
  totalPauseTime: Duration;
  pauseDeduction: Duration;
  effectiveWorkTime: Duration;
  remainingTime: Duration;
  isComplete: boolean;
}

export class WorkDay {
  private readonly _sessions: WorkSession[] = [];
  private _currentSession: WorkSession | null = null;
  private _status: TimerStatus = TimerStatus.STOPPED;
  private _pauseDeductionApplied: boolean = false;

  constructor(
    public readonly date: WorkDayDate,
    sessions: WorkSession[] = [],
    currentSession: WorkSession | null = null,
    status: TimerStatus = TimerStatus.STOPPED,
    pauseDeductionApplied: boolean = false
  ) {
    this._sessions = [...sessions];
    this._currentSession = currentSession;
    this._status = status;
    this._pauseDeductionApplied = pauseDeductionApplied;
  }

  static create(date: WorkDayDate): WorkDay {
    return new WorkDay(date);
  }

  get sessions(): ReadonlyArray<WorkSession> {
    return this._sessions;
  }

  get currentSession(): WorkSession | null {
    return this._currentSession;
  }

  get status(): TimerStatus {
    return this._status;
  }

  get pauseDeductionApplied(): boolean {
    return this._pauseDeductionApplied;
  }

  get sessionCount(): number {
    return this._sessions.length + (this._currentSession ? 1 : 0);
  }

  startWork(startTime: Date): WorkDay {
    if (!this._status.canTransitionTo(TimerStatus.RUNNING)) {
      throw new Error(`Cannot start work from ${this._status.value} status`);
    }

    if (!this.date.equals(WorkDayDate.fromDate(startTime))) {
      throw new Error('Cannot start work on a different date');
    }

    if (this._currentSession && this._currentSession.isRunning) {
      throw new Error('A work session is already running');
    }

    const newSession = WorkSession.create(startTime);
    return new WorkDay(
      this.date,
      this._sessions,
      newSession,
      TimerStatus.RUNNING,
      this._pauseDeductionApplied
    );
  }

  stopWork(endTime: Date): WorkDay {
    if (!this._status.isRunning()) {
      throw new Error('No work session is currently running');
    }

    if (!this._currentSession) {
      throw new Error('No current session to stop');
    }

    const stoppedSession = this._currentSession.stop(endTime);
    const newSessions = [...this._sessions, stoppedSession];

    return new WorkDay(
      this.date,
      newSessions,
      null,
      TimerStatus.PAUSED,
      this._pauseDeductionApplied
    );
  }

  applyPauseDeduction(): WorkDay {
    if (this._pauseDeductionApplied) {
      return this;
    }

    return new WorkDay(
      this.date,
      this._sessions,
      this._currentSession,
      this._status,
      true
    );
  }

  reset(): WorkDay {
    return new WorkDay(this.date);
  }

  calculateTotalWorkTime(): Duration {
    const completedSessionsTime = this._sessions.reduce(
      (total, session) => total.add(session.duration),
      Duration.zero()
    );

    const currentSessionTime = this._currentSession
      ? this._currentSession.updateCurrentDuration(new Date())
      : Duration.zero();

    return completedSessionsTime.add(currentSessionTime);
  }

  calculateTotalPauseTime(): Duration {
    if (this._sessions.length <= 1) {
      return Duration.zero();
    }

    let totalPause = Duration.zero();
    for (let i = 1; i < this._sessions.length; i++) {
      const prevSession = this._sessions[i - 1];
      const currentSession = this._sessions[i];
      
      if (prevSession.endTime) {
        const pauseDuration = Duration.fromMilliseconds(
          currentSession.startTime.getTime() - prevSession.endTime.getTime()
        );
        totalPause = totalPause.add(pauseDuration);
      }
    }

    return totalPause;
  }

  getCurrentSessionTime(): Duration {
    if (!this._currentSession) {
      return Duration.zero();
    }

    return this._currentSession.updateCurrentDuration(new Date());
  }

  toData(): {
    date: string;
    sessions: any[];
    currentSession: any | null;
    status: string;
    pauseDeductionApplied: boolean;
  } {
    return {
      date: this.date.toISOString(),
      sessions: this._sessions.map(session => session.toData()),
      currentSession: this._currentSession?.toData() || null,
      status: this._status.value,
      pauseDeductionApplied: this._pauseDeductionApplied
    };
  }

  static fromData(data: {
    date: string;
    sessions: any[];
    currentSession: any | null;
    status: string;
    pauseDeductionApplied: boolean;
  }): WorkDay {
    const date = WorkDayDate.fromString(data.date);
    const sessions = data.sessions.map(sessionData => WorkSession.fromData(sessionData));
    const currentSession = data.currentSession ? WorkSession.fromData(data.currentSession) : null;
    
    let status: TimerStatus;
    switch (data.status) {
      case 'RUNNING':
        status = TimerStatus.RUNNING;
        break;
      case 'PAUSED':
        status = TimerStatus.PAUSED;
        break;
      default:
        status = TimerStatus.STOPPED;
    }

    return new WorkDay(date, sessions, currentSession, status, data.pauseDeductionApplied);
  }
}