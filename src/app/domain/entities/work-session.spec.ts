/**
 * @fileoverview WorkSession entity tests.
 * @author Work Timer Application
 */

import { WorkSession } from './work-session';
import { Duration } from '../value-objects/duration';
import { WorkDayDate } from '../value-objects/work-day-date';

describe('WorkSession', () => {
  const startTime = new Date(2024, 2, 15, 9, 0, 0); // March 15, 2024, 09:00:00 local time
  const endTime = new Date(2024, 2, 15, 10, 30, 0); // March 15, 2024, 10:30:00 local time

  describe('Factory Methods', () => {
    it('should create new work session with create method', () => {
      const session = WorkSession.create(startTime);
      
      expect(session.id).toBeDefined();
      expect(session.startTime).toBe(startTime);
      expect(session.endTime).toBeNull();
      expect(session.workDate.toISOString()).toBe('2024-03-15');
      expect(session.duration.isZero()).toBe(true);
      expect(session.isRunning).toBe(true);
      expect(session.isCompleted).toBe(false);
    });

    it('should generate unique IDs for different sessions', () => {
      const session1 = WorkSession.create(startTime);
      const session2 = WorkSession.create(startTime);
      
      expect(session1.id).not.toBe(session2.id);
    });

    it('should create session from data object', () => {
      const data = {
        id: 'test-session-id',
        startTime: startTime,
        endTime: endTime,
        duration: 5400000, // 90 minutes in milliseconds
        date: '2024-03-15'
      };
      
      const session = WorkSession.fromData(data);
      
      expect(session.id).toBe('test-session-id');
      expect(session.startTime).toBe(startTime);
      expect(session.endTime).toBe(endTime);
      expect(session.duration.toMinutes()).toBe(90);
      expect(session.workDate.toISOString()).toBe('2024-03-15');
      expect(session.isRunning).toBe(false);
      expect(session.isCompleted).toBe(true);
    });

    it('should create running session from data with null endTime', () => {
      const data = {
        id: 'running-session-id',
        startTime: startTime,
        endTime: null,
        duration: 0,
        date: '2024-03-15'
      };
      
      const session = WorkSession.fromData(data);
      
      expect(session.endTime).toBeNull();
      expect(session.isRunning).toBe(true);
      expect(session.isCompleted).toBe(false);
    });
  });

  describe('Session State', () => {
    it('should correctly identify running session', () => {
      const session = WorkSession.create(startTime);
      
      expect(session.isRunning).toBe(true);
      expect(session.isCompleted).toBe(false);
    });

    it('should correctly identify completed session', () => {
      const session = WorkSession.create(startTime);
      const stoppedSession = session.stop(endTime);
      
      expect(stoppedSession.isRunning).toBe(false);
      expect(stoppedSession.isCompleted).toBe(true);
    });
  });

  describe('Stop Session', () => {
    it('should stop running session correctly', () => {
      const session = WorkSession.create(startTime);
      const stoppedSession = session.stop(endTime);
      
      expect(stoppedSession.endTime).toBe(endTime);
      expect(stoppedSession.duration.toMinutes()).toBe(90); // 1.5 hours
      expect(stoppedSession.isCompleted).toBe(true);
      expect(stoppedSession.isRunning).toBe(false);
    });

    it('should return new instance when stopping session', () => {
      const session = WorkSession.create(startTime);
      const stoppedSession = session.stop(endTime);
      
      expect(session).not.toBe(stoppedSession);
      expect(session.isRunning).toBe(true);
      expect(stoppedSession.isRunning).toBe(false);
    });

    it('should throw error when stopping already completed session', () => {
      const session = WorkSession.create(startTime);
      const stoppedSession = session.stop(endTime);
      
      expect(() => stoppedSession.stop(new Date())).toThrowError('Work session has already been stopped.');
    });

    it('should throw error when end time is before start time', () => {
      const session = WorkSession.create(startTime);
      const invalidEndTime = new Date(2024, 2, 15, 8, 0, 0); // March 15, 2024, 08:00:00 local time
      
      expect(() => session.stop(invalidEndTime)).toThrowError('End time must be after start time.');
    });

    it('should throw error when end time equals start time', () => {
      const session = WorkSession.create(startTime);
      
      expect(() => session.stop(startTime)).toThrowError('End time must be after start time.');
    });
  });

  describe('Duration Calculations', () => {
    it('should calculate duration correctly for completed session', () => {
      const session = WorkSession.create(startTime);
      const stoppedSession = session.stop(endTime);
      
      expect(stoppedSession.duration.toMinutes()).toBe(90);
      expect(stoppedSession.duration.toSeconds()).toBe(5400);
    });

    it('should return zero duration for running session', () => {
      const session = WorkSession.create(startTime);
      
      expect(session.duration.isZero()).toBe(true);
    });

    it('should update current duration for running session', () => {
      const session = WorkSession.create(startTime);
      const currentTime = new Date(2024, 2, 15, 9, 30, 0); // March 15, 2024, 09:30:00 local time (30 minutes later)
      const currentDuration = session.updateCurrentDuration(currentTime);
      
      expect(currentDuration.toMinutes()).toBe(30);
    });

    it('should return stored duration for completed session when updating current duration', () => {
      const session = WorkSession.create(startTime);
      const stoppedSession = session.stop(endTime);
      const laterTime = new Date(2024, 2, 15, 12, 0, 0); // March 15, 2024, 12:00:00 local time
      
      const currentDuration = stoppedSession.updateCurrentDuration(laterTime);
      
      expect(currentDuration.toMinutes()).toBe(90); // Should remain 90 minutes, not calculate from laterTime
    });

    it('should handle very short durations', () => {
      const session = WorkSession.create(startTime);
      const shortEndTime = new Date(startTime.getTime() + 1000); // 1 second later
      const stoppedSession = session.stop(shortEndTime);
      
      expect(stoppedSession.duration.toSeconds()).toBe(1);
    });

    it('should handle very long durations', () => {
      const session = WorkSession.create(startTime);
      const longEndTime = new Date(startTime.getTime() + 12 * 60 * 60 * 1000); // 12 hours later
      const stoppedSession = session.stop(longEndTime);
      
      expect(stoppedSession.duration.toHours()).toBe(12);
    });
  });

  describe('Data Serialization', () => {
    it('should serialize running session to data object', () => {
      const session = WorkSession.create(startTime);
      const data = session.toData();
      
      expect(data.id).toBe(session.id);
      expect(data.startTime).toBe(startTime);
      expect(data.endTime).toBeNull();
      expect(data.duration).toBe(0);
      expect(data.date).toBe('2024-03-15');
    });

    it('should serialize completed session to data object', () => {
      const session = WorkSession.create(startTime);
      const stoppedSession = session.stop(endTime);
      const data = stoppedSession.toData();
      
      expect(data.id).toBe(stoppedSession.id);
      expect(data.startTime).toBe(startTime);
      expect(data.endTime).toBe(endTime);
      expect(data.duration).toBe(5400000); // 90 minutes in milliseconds
      expect(data.date).toBe('2024-03-15');
    });

    it('should round-trip serialize and deserialize correctly', () => {
      const originalSession = WorkSession.create(startTime);
      const stoppedSession = originalSession.stop(endTime);
      const data = stoppedSession.toData();
      const reconstructedSession = WorkSession.fromData(data);
      
      expect(reconstructedSession.id).toBe(stoppedSession.id);
      expect(reconstructedSession.startTime).toEqual(stoppedSession.startTime);
      expect(reconstructedSession.endTime).toEqual(stoppedSession.endTime);
      expect(reconstructedSession.duration.milliseconds).toBe(stoppedSession.duration.milliseconds);
      expect(reconstructedSession.workDate.equals(stoppedSession.workDate)).toBe(true);
    });
  });

  describe('Equality', () => {
    it('should consider sessions with same ID as equal', () => {
      const data = {
        id: 'same-id',
        startTime: startTime,
        endTime: null,
        duration: 0,
        date: '2024-03-15'
      };
      
      const session1 = WorkSession.fromData(data);
      const session2 = WorkSession.fromData(data);
      
      expect(session1.equals(session2)).toBe(true);
    });

    it('should consider sessions with different IDs as not equal', () => {
      const session1 = WorkSession.create(startTime);
      const session2 = WorkSession.create(startTime);
      
      expect(session1.equals(session2)).toBe(false);
    });
  });

  describe('Work Date Association', () => {
    it('should associate session with correct work date', () => {
      const session = WorkSession.create(startTime);
      
      expect(session.workDate.toISOString()).toBe('2024-03-15');
    });

    it('should handle sessions starting near midnight', () => {
      const lateNightStart = new Date(2024, 2, 15, 23, 55, 0); // March 15, 2024, 23:55:00 local time
      const session = WorkSession.create(lateNightStart);
      
      expect(session.workDate.toISOString()).toBe('2024-03-15');
    });

    it('should handle sessions starting just after midnight', () => {
      const earlyMorningStart = new Date(2024, 2, 16, 0, 5, 0); // March 16, 2024, 00:05:00 local time
      const session = WorkSession.create(earlyMorningStart);
      
      expect(session.workDate.toISOString()).toBe('2024-03-16');
    });
  });

  describe('Edge Cases', () => {
    it('should handle sessions with microsecond precision', () => {
      const preciseStartTime = new Date(2024, 2, 15, 9, 0, 0, 123); // March 15, 2024, 09:00:00.123 local time
      const preciseEndTime = new Date(2024, 2, 15, 9, 0, 1, 456); // March 15, 2024, 09:00:01.456 local time
      
      const session = WorkSession.create(preciseStartTime);
      const stoppedSession = session.stop(preciseEndTime);
      
      expect(stoppedSession.duration.milliseconds).toBe(1333); // 1.333 seconds
    });

    it('should handle sessions spanning across days', () => {
      const nightStart = new Date(2024, 2, 15, 23, 30, 0); // March 15, 2024, 23:30:00 local time
      const morningEnd = new Date(2024, 2, 16, 1, 30, 0); // March 16, 2024, 01:30:00 local time
      
      const session = WorkSession.create(nightStart);
      const stoppedSession = session.stop(morningEnd);
      
      expect(stoppedSession.duration.toHours()).toBe(2);
      expect(stoppedSession.workDate.toISOString()).toBe('2024-03-15'); // Should be associated with start date
    });

    it('should maintain immutability of original session after stopping', () => {
      const session = WorkSession.create(startTime);
      const originalEndTime = session.endTime;
      const originalDuration = session.duration;
      
      session.stop(endTime);
      
      // Original session should remain unchanged
      expect(session.endTime).toBe(originalEndTime);
      expect(session.duration).toBe(originalDuration);
      expect(session.isRunning).toBe(true);
    });
  });
});