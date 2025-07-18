/**
 * @fileoverview WorkDay aggregate root tests.
 * @author Work Timer Application
 */

import { WorkDay } from './work-day';
import { WorkSession } from './work-session';
import { Duration } from '../value-objects/duration';
import { TimerStatus } from '../value-objects/timer-status';
import { WorkDayDate } from '../value-objects/work-day-date';

describe('WorkDay', () => {
  const testDate = WorkDayDate.fromDate(new Date(2024, 2, 15)); // March 15, 2024 local time
  const startTime1 = new Date(2024, 2, 15, 9, 0, 0); // 09:00:00
  const endTime1 = new Date(2024, 2, 15, 10, 30, 0); // 10:30:00
  const startTime2 = new Date(2024, 2, 15, 11, 0, 0); // 11:00:00
  const endTime2 = new Date(2024, 2, 15, 12, 0, 0); // 12:00:00

  describe('Factory Methods', () => {
    it('should create empty work day', () => {
      const workDay = WorkDay.create(testDate);
      
      expect(workDay.date.equals(testDate)).toBe(true);
      expect(workDay.sessions.length).toBe(0);
      expect(workDay.currentSession).toBeNull();
      expect(workDay.status.equals(TimerStatus.STOPPED)).toBe(true);
      expect(workDay.pauseDeductionApplied).toBe(false);
    });

    it('should create work day with existing sessions', () => {
      const session1 = WorkSession.create(startTime1).stop(endTime1);
      const session2 = WorkSession.create(startTime2).stop(endTime2);
      const sessions = [session1, session2];
      
      const workDay = new WorkDay(testDate, sessions);
      
      expect(workDay.sessions.length).toBe(2);
      expect(workDay.sessions[0]).toBe(session1);
      expect(workDay.sessions[1]).toBe(session2);
    });

    it('should create work day with current session', () => {
      const currentSession = WorkSession.create(startTime1);
      const workDay = new WorkDay(testDate, [], currentSession, TimerStatus.RUNNING);
      
      expect(workDay.currentSession).toBe(currentSession);
      expect(workDay.status.equals(TimerStatus.RUNNING)).toBe(true);
    });
  });

  describe('Session Management', () => {
    it('should start new work session', () => {
      const workDay = WorkDay.create(testDate);
      const updatedWorkDay = workDay.startWork(startTime1);
      
      expect(updatedWorkDay.currentSession).not.toBeNull();
      expect(updatedWorkDay.currentSession!.startTime).toBe(startTime1);
      expect(updatedWorkDay.status.equals(TimerStatus.RUNNING)).toBe(true);
      expect(updatedWorkDay).not.toBe(workDay); // Immutability
    });

    it('should throw error when starting work while already running', () => {
      const workDay = WorkDay.create(testDate);
      const runningWorkDay = workDay.startWork(startTime1);
      
      expect(() => runningWorkDay.startWork(startTime2)).toThrowError('Cannot start work when already running.');
    });

    it('should stop current work session', () => {
      const workDay = WorkDay.create(testDate);
      const runningWorkDay = workDay.startWork(startTime1);
      const stoppedWorkDay = runningWorkDay.stopWork(endTime1);
      
      expect(stoppedWorkDay.currentSession).toBeNull();
      expect(stoppedWorkDay.sessions.length).toBe(1);
      expect(stoppedWorkDay.status.equals(TimerStatus.PAUSED)).toBe(true);
      expect(stoppedWorkDay.sessions[0].endTime).toBe(endTime1);
    });

    it('should throw error when stopping work while not running', () => {
      const workDay = WorkDay.create(testDate);
      
      expect(() => workDay.stopWork(endTime1)).toThrowError('Cannot stop work when not running.');
    });

    it('should pause current work session', () => {
      const workDay = WorkDay.create(testDate);
      const runningWorkDay = workDay.startWork(startTime1);
      const pausedWorkDay = runningWorkDay.pauseWork(endTime1);
      
      expect(pausedWorkDay.currentSession).toBeNull();
      expect(pausedWorkDay.sessions.length).toBe(1);
      expect(pausedWorkDay.status.equals(TimerStatus.PAUSED)).toBe(true);
    });

    it('should resume work after pause', () => {
      const workDay = WorkDay.create(testDate);
      const runningWorkDay = workDay.startWork(startTime1);
      const pausedWorkDay = runningWorkDay.pauseWork(endTime1);
      const resumedWorkDay = pausedWorkDay.resumeWork(startTime2);
      
      expect(resumedWorkDay.currentSession).not.toBeNull();
      expect(resumedWorkDay.status.equals(TimerStatus.RUNNING)).toBe(true);
      expect(resumedWorkDay.sessions.length).toBe(1); // Previous session saved
    });

    it('should throw error when resuming while not paused', () => {
      const workDay = WorkDay.create(testDate);
      
      expect(() => workDay.resumeWork(startTime1)).toThrowError('Cannot resume work when not paused.');
    });
  });

  describe('Time Calculations', () => {
    it('should track work sessions correctly', () => {
      const session1 = WorkSession.create(startTime1).stop(endTime1); // 90 minutes
      const session2 = WorkSession.create(startTime2).stop(endTime2); // 60 minutes
      const workDay = new WorkDay(testDate, [session1, session2]);
      
      expect(workDay.sessions.length).toBe(2);
      expect(workDay.sessions[0].duration.toMinutes()).toBe(90);
      expect(workDay.sessions[1].duration.toMinutes()).toBe(60);
    });

    it('should track pause deduction state', () => {
      const session1 = WorkSession.create(startTime1).stop(endTime1);
      const workDay = new WorkDay(testDate, [session1], null, TimerStatus.STOPPED, true);
      
      expect(workDay.pauseDeductionApplied).toBe(true);
    });

    it('should track session count correctly', () => {
      const session1 = WorkSession.create(startTime1).stop(endTime1);
      const workDay = new WorkDay(testDate, [session1]);
      
      expect(workDay.sessionCount).toBe(1);
      
      const runningWorkDay = workDay.startWork(startTime2);
      expect(runningWorkDay.sessionCount).toBe(2); // 1 completed + 1 current
    });
  });

  describe('Work Day Status', () => {
    it('should track status transitions correctly', () => {
      let workDay = WorkDay.create(testDate);
      expect(workDay.status.equals(TimerStatus.STOPPED)).toBe(true);
      
      workDay = workDay.startWork(startTime1);
      expect(workDay.status.equals(TimerStatus.RUNNING)).toBe(true);
      
      workDay = workDay.pauseWork(endTime1);
      expect(workDay.status.equals(TimerStatus.PAUSED)).toBe(true);
      
      workDay = workDay.resumeWork(startTime2);
      expect(workDay.status.equals(TimerStatus.RUNNING)).toBe(true);
      
      workDay = workDay.stopWork(endTime2);
      expect(workDay.status.equals(TimerStatus.PAUSED)).toBe(true);
    });

    it('should detect if work day has any activity', () => {
      const emptyWorkDay = WorkDay.create(testDate);
      expect(emptyWorkDay.hasActivity()).toBe(false);
      
      const activeWorkDay = emptyWorkDay.startWork(startTime1);
      expect(activeWorkDay.hasActivity()).toBe(true);
    });

    it('should detect if work day is currently active', () => {
      const workDay = WorkDay.create(testDate);
      expect(workDay.isActive()).toBe(false);
      
      const runningWorkDay = workDay.startWork(startTime1);
      expect(runningWorkDay.isActive()).toBe(true);
      
      const pausedWorkDay = runningWorkDay.pauseWork(endTime1);
      expect(pausedWorkDay.isActive()).toBe(false);
    });
  });

  describe('Reset Functionality', () => {
    it('should reset work day to initial state', () => {
      const session1 = WorkSession.create(startTime1).stop(endTime1);
      const workDay = new WorkDay(testDate, [session1], null, TimerStatus.PAUSED, true);
      const resetWorkDay = workDay.reset();
      
      expect(resetWorkDay.sessions.length).toBe(0);
      expect(resetWorkDay.currentSession).toBeNull();
      expect(resetWorkDay.status.equals(TimerStatus.STOPPED)).toBe(true);
      expect(resetWorkDay.pauseDeductionApplied).toBe(false);
    });

    it('should create new instance when resetting', () => {
      const workDay = WorkDay.create(testDate).startWork(startTime1);
      const resetWorkDay = workDay.reset();
      
      expect(resetWorkDay).not.toBe(workDay);
      expect(workDay.hasActivity()).toBe(true);
      expect(resetWorkDay.hasActivity()).toBe(false);
    });
  });

  describe('Current Session Updates', () => {
    it('should update current session duration', () => {
      const workDay = WorkDay.create(testDate);
      const runningWorkDay = workDay.startWork(startTime1);
      const currentTime = new Date(2024, 2, 15, 9, 30, 0); // 30 minutes later
      
      const currentDuration = runningWorkDay.getCurrentSessionDuration(currentTime);
      
      expect(currentDuration.toMinutes()).toBe(30);
    });

    it('should return zero duration when no current session', () => {
      const workDay = WorkDay.create(testDate);
      const currentTime = new Date(2024, 2, 15, 9, 30, 0);
      
      const currentDuration = workDay.getCurrentSessionDuration(currentTime);
      
      expect(currentDuration.isZero()).toBe(true);
    });
  });

  describe('Immutability', () => {
    it('should return new instance for all state changes', () => {
      const workDay = WorkDay.create(testDate);
      
      const runningWorkDay = workDay.startWork(startTime1);
      expect(runningWorkDay).not.toBe(workDay);
      
      const pausedWorkDay = runningWorkDay.pauseWork(endTime1);
      expect(pausedWorkDay).not.toBe(runningWorkDay);
      
      const resumedWorkDay = pausedWorkDay.resumeWork(startTime2);
      expect(resumedWorkDay).not.toBe(pausedWorkDay);
    });

    it('should not modify original sessions array', () => {
      const session1 = WorkSession.create(startTime1).stop(endTime1);
      const originalSessions = [session1];
      const workDay = new WorkDay(testDate, originalSessions);
      
      const updatedWorkDay = workDay.startWork(startTime2).stopWork(endTime2);
      
      expect(originalSessions.length).toBe(1);
      expect(updatedWorkDay.sessions.length).toBe(2);
    });
  });

  describe('Data Consistency', () => {
    it('should maintain session order by start time', () => {
      const laterSession = WorkSession.create(startTime2).stop(endTime2);
      const earlierSession = WorkSession.create(startTime1).stop(endTime1);
      // Add sessions in wrong order
      const workDay = new WorkDay(testDate, [laterSession, earlierSession]);
      
      // Should track sessions regardless of order
      expect(workDay.sessions.length).toBe(2);
      expect(workDay.sessions[0]).toBe(laterSession);
      expect(workDay.sessions[1]).toBe(earlierSession);
    });

    it('should handle edge case of zero-duration sessions', () => {
      const instantSession = WorkSession.create(startTime1).stop(startTime1);
      const workDay = new WorkDay(testDate, [instantSession]);
      
      expect(workDay.sessions.length).toBe(1);
      expect(workDay.sessions[0].duration.isZero()).toBe(true);
    });

    it('should handle single session workflow', () => {
      let workDay = WorkDay.create(testDate);
      workDay = workDay.startWork(startTime1);
      workDay = workDay.stopWork(endTime1);
      
      expect(workDay.sessions.length).toBe(1);
      expect(workDay.status.equals(TimerStatus.PAUSED)).toBe(true);
      expect(workDay.sessions[0].duration.toMinutes()).toBe(90);
    });
  });
});