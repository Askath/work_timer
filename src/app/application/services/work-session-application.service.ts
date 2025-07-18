/**
 * @fileoverview Work session application service for session management.
 * @author Work Timer Application
 */

import { Injectable } from '@angular/core';
import { WorkSession, WorkDayDate, Duration } from '../../domain';

export interface SessionSummary {
  id: string;
  startTime: Date;
  endTime: Date | null;
  duration: Duration;
  formattedDuration: string;
  isRunning: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class WorkSessionApplicationService {
  
  formatSessionsForDisplay(sessions: ReadonlyArray<WorkSession>): SessionSummary[] {
    return sessions.map(session => ({
      id: session.id,
      startTime: session.startTime,
      endTime: session.endTime,
      duration: session.duration,
      formattedDuration: session.duration.format(),
      isRunning: session.isRunning
    }));
  }

  getSessionsByDate(sessions: ReadonlyArray<WorkSession>, date: WorkDayDate): WorkSession[] {
    return sessions.filter(session => session.workDate.equals(date));
  }

  getTotalDurationForSessions(sessions: ReadonlyArray<WorkSession>): Duration {
    return sessions.reduce((total, session) => total.add(session.duration), Duration.zero());
  }

  getAverageSessionDuration(sessions: ReadonlyArray<WorkSession>): Duration {
    if (sessions.length === 0) {
      return Duration.zero();
    }

    const total = this.getTotalDurationForSessions(sessions);
    return Duration.fromMilliseconds(total.milliseconds / sessions.length);
  }

  getLongestSession(sessions: ReadonlyArray<WorkSession>): WorkSession | null {
    if (sessions.length === 0) {
      return null;
    }

    return sessions.reduce((longest, current) => 
      current.duration.isGreaterThan(longest.duration) ? current : longest
    );
  }

  getShortestSession(sessions: ReadonlyArray<WorkSession>): WorkSession | null {
    if (sessions.length === 0) {
      return null;
    }

    return sessions.reduce((shortest, current) => 
      current.duration.isLessThan(shortest.duration) ? current : shortest
    );
  }

  getSessionsInTimeRange(
    sessions: ReadonlyArray<WorkSession>, 
    startTime: Date, 
    endTime: Date
  ): WorkSession[] {
    return sessions.filter(session => 
      session.startTime >= startTime && 
      (session.endTime ? session.endTime <= endTime : session.startTime <= endTime)
    );
  }

  getProductivityMetrics(sessions: ReadonlyArray<WorkSession>): {
    totalSessions: number;
    totalDuration: Duration;
    averageDuration: Duration;
    longestSession: Duration;
    shortestSession: Duration;
  } {
    const completedSessions = sessions.filter(session => session.isCompleted);
    
    return {
      totalSessions: completedSessions.length,
      totalDuration: this.getTotalDurationForSessions(completedSessions),
      averageDuration: this.getAverageSessionDuration(completedSessions),
      longestSession: this.getLongestSession(completedSessions)?.duration || Duration.zero(),
      shortestSession: this.getShortestSession(completedSessions)?.duration || Duration.zero()
    };
  }
}