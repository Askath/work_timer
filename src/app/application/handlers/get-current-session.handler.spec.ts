/**
 * @fileoverview Get current session query handler tests.
 * @author Work Timer Application
 */

import { TestBed } from '@angular/core/testing';
import { GetCurrentSessionHandler } from './get-current-session.handler';
import { GetCurrentSessionQuery } from '../queries/get-current-session.query';
import { TimerApplicationService } from '../services/timer-application.service';
import { WorkSession, WorkDay, TimerStatus } from '../../domain';
import { TestTimes, TestDates } from '../../testing/helpers/time.helpers';

describe('GetCurrentSessionHandler', () => {
  let handler: GetCurrentSessionHandler;
  let mockTimerApplicationService: jasmine.SpyObj<TimerApplicationService>;

  beforeEach(() => {
    const spy = jasmine.createSpyObj('TimerApplicationService', ['getCurrentState']);

    TestBed.configureTestingModule({
      providers: [
        GetCurrentSessionHandler,
        { provide: TimerApplicationService, useValue: spy }
      ]
    });

    handler = TestBed.inject(GetCurrentSessionHandler);
    mockTimerApplicationService = TestBed.inject(TimerApplicationService) as jasmine.SpyObj<TimerApplicationService>;
  });

  describe('Handler Setup', () => {
    it('should be created', () => {
      expect(handler).toBeTruthy();
    });

    it('should inject TimerApplicationService', () => {
      expect(mockTimerApplicationService).toBeTruthy();
    });
  });

  describe('Query Handling', () => {
    it('should return current session when one exists', async () => {
      const currentSession = WorkSession.create(TestTimes.NINE_AM);
      const workDay = new WorkDay(TestDates.MARCH_15_2024, [], currentSession, TimerStatus.RUNNING);
      const mockState = { workDay };
      
      mockTimerApplicationService.getCurrentState.and.returnValue(mockState as any);
      
      const query = new GetCurrentSessionQuery();
      const result = await handler.handle(query);
      
      expect(result).toBe(currentSession);
      expect(mockTimerApplicationService.getCurrentState).toHaveBeenCalledTimes(1);
    });

    it('should return null when no current session exists', async () => {
      const workDay = WorkDay.create(TestDates.MARCH_15_2024);
      const mockState = { workDay };
      
      mockTimerApplicationService.getCurrentState.and.returnValue(mockState as any);
      
      const query = new GetCurrentSessionQuery();
      const result = await handler.handle(query);
      
      expect(result).toBeNull();
      expect(mockTimerApplicationService.getCurrentState).toHaveBeenCalledTimes(1);
    });

    it('should handle query with user ID', async () => {
      const currentSession = WorkSession.create(TestTimes.TEN_AM);
      const workDay = new WorkDay(TestDates.MARCH_15_2024, [], currentSession, TimerStatus.RUNNING);
      const mockState = { workDay };
      
      mockTimerApplicationService.getCurrentState.and.returnValue(mockState as any);
      
      const query = new GetCurrentSessionQuery(TestDates.MARCH_15_2024, 'user-123');
      const result = await handler.handle(query);
      
      expect(result).toBe(currentSession);
    });

    it('should propagate service errors', async () => {
      const error = new Error('State retrieval error');
      mockTimerApplicationService.getCurrentState.and.throwError(error);
      
      const query = new GetCurrentSessionQuery();
      
      await expectAsync(handler.handle(query)).toBeRejectedWith(error);
    });
  });

  describe('Session State Scenarios', () => {
    it('should return running session', async () => {
      const runningSession = WorkSession.create(TestTimes.NINE_AM);
      const workDay = new WorkDay(TestDates.MARCH_15_2024, [], runningSession, TimerStatus.RUNNING);
      const mockState = { workDay };
      
      mockTimerApplicationService.getCurrentState.and.returnValue(mockState as any);
      
      const query = new GetCurrentSessionQuery();
      const result = await handler.handle(query);
      
      expect(result).toBe(runningSession);
      expect(result!.isRunning).toBe(true);
    });

    it('should return null when timer is stopped', async () => {
      const workDay = WorkDay.create(TestDates.MARCH_15_2024);
      const mockState = { workDay };
      
      mockTimerApplicationService.getCurrentState.and.returnValue(mockState as any);
      
      const query = new GetCurrentSessionQuery();
      const result = await handler.handle(query);
      
      expect(result).toBeNull();
    });

    it('should return null when timer is paused', async () => {
      const completedSession = WorkSession.create(TestTimes.NINE_AM).stop(TestTimes.TEN_AM);
      const workDay = new WorkDay(TestDates.MARCH_15_2024, [completedSession], null, TimerStatus.PAUSED);
      const mockState = { workDay };
      
      mockTimerApplicationService.getCurrentState.and.returnValue(mockState as any);
      
      const query = new GetCurrentSessionQuery();
      const result = await handler.handle(query);
      
      expect(result).toBeNull();
    });
  });

  describe('Multiple Query Handling', () => {
    it('should handle multiple queries consistently', async () => {
      const currentSession = WorkSession.create(TestTimes.NINE_AM);
      const workDay = new WorkDay(TestDates.MARCH_15_2024, [], currentSession, TimerStatus.RUNNING);
      const mockState = { workDay };
      
      mockTimerApplicationService.getCurrentState.and.returnValue(mockState as any);
      
      const query1 = new GetCurrentSessionQuery();
      const query2 = new GetCurrentSessionQuery();
      
      const result1 = await handler.handle(query1);
      const result2 = await handler.handle(query2);
      
      expect(result1).toBe(currentSession);
      expect(result2).toBe(currentSession);
      expect(mockTimerApplicationService.getCurrentState).toHaveBeenCalledTimes(2);
    });

    it('should handle concurrent queries', async () => {
      const currentSession = WorkSession.create(TestTimes.NINE_AM);
      const workDay = new WorkDay(TestDates.MARCH_15_2024, [], currentSession, TimerStatus.RUNNING);
      const mockState = { workDay };
      
      mockTimerApplicationService.getCurrentState.and.returnValue(mockState as any);
      
      const query1 = new GetCurrentSessionQuery();
      const query2 = new GetCurrentSessionQuery();
      
      const [result1, result2] = await Promise.all([
        handler.handle(query1),
        handler.handle(query2)
      ]);
      
      expect(result1).toBe(currentSession);
      expect(result2).toBe(currentSession);
    });
  });

  describe('Data Consistency', () => {
    it('should return the exact session instance from work day', async () => {
      const originalSession = WorkSession.create(TestTimes.NINE_AM);
      const workDay = new WorkDay(TestDates.MARCH_15_2024, [], originalSession, TimerStatus.RUNNING);
      const mockState = { workDay };
      
      mockTimerApplicationService.getCurrentState.and.returnValue(mockState as any);
      
      const query = new GetCurrentSessionQuery();
      const result = await handler.handle(query);
      
      expect(result).toBe(originalSession);
      expect(result === originalSession).toBe(true); // Reference equality
    });

    it('should handle work day with completed sessions but no current session', async () => {
      const completedSession1 = WorkSession.create(TestTimes.NINE_AM).stop(TestTimes.TEN_AM);
      const completedSession2 = WorkSession.create(TestTimes.ELEVEN_AM).stop(TestTimes.NOON);
      const workDay = new WorkDay(TestDates.MARCH_15_2024, [completedSession1, completedSession2]);
      const mockState = { workDay };
      
      mockTimerApplicationService.getCurrentState.and.returnValue(mockState as any);
      
      const query = new GetCurrentSessionQuery();
      const result = await handler.handle(query);
      
      expect(result).toBeNull();
    });
  });

  describe('Error Handling', () => {
    it('should handle service method throwing error', async () => {
      const error = new Error('Service unavailable');
      mockTimerApplicationService.getCurrentState.and.throwError(error);
      
      const query = new GetCurrentSessionQuery();
      
      await expectAsync(handler.handle(query)).toBeRejectedWith(error);
    });

    it('should handle malformed state gracefully', async () => {
      // This tests defensive programming - handler should handle unexpected state
      const mockState = { workDay: null };
      mockTimerApplicationService.getCurrentState.and.returnValue(mockState as any);
      
      const query = new GetCurrentSessionQuery();
      
      await expectAsync(handler.handle(query)).toBeRejected();
    });
  });
});