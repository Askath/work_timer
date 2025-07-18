/**
 * @fileoverview Get daily report query handler tests.
 * @author Work Timer Application
 */

import { TestBed } from '@angular/core/testing';
import { GetDailyReportHandler } from './get-daily-report.handler';
import { GetDailyReportQuery } from '../queries/get-daily-report.query';
import { ReportingApplicationService, DailyReport } from '../services/reporting-application.service';
import { TimerApplicationService } from '../services/timer-application.service';
import { WorkDay, WorkSession } from '../../domain';
import { TestTimes, TestDates, TestDurations } from '../../testing/helpers/time.helpers';

describe('GetDailyReportHandler', () => {
  let handler: GetDailyReportHandler;
  let mockReportingService: jasmine.SpyObj<ReportingApplicationService>;
  let mockTimerApplicationService: jasmine.SpyObj<TimerApplicationService>;

  beforeEach(() => {
    const reportingSpy = jasmine.createSpyObj('ReportingApplicationService', ['generateDailyReport']);
    const timerSpy = jasmine.createSpyObj('TimerApplicationService', ['getCurrentState']);

    TestBed.configureTestingModule({
      providers: [
        GetDailyReportHandler,
        { provide: ReportingApplicationService, useValue: reportingSpy },
        { provide: TimerApplicationService, useValue: timerSpy }
      ]
    });

    handler = TestBed.inject(GetDailyReportHandler);
    mockReportingService = TestBed.inject(ReportingApplicationService) as jasmine.SpyObj<ReportingApplicationService>;
    mockTimerApplicationService = TestBed.inject(TimerApplicationService) as jasmine.SpyObj<TimerApplicationService>;
  });

  describe('Handler Setup', () => {
    it('should be created', () => {
      expect(handler).toBeTruthy();
    });

    it('should inject both services', () => {
      expect(mockReportingService).toBeTruthy();
      expect(mockTimerApplicationService).toBeTruthy();
    });
  });

  describe('Query Handling', () => {
    it('should generate daily report for current work day', async () => {
      const workDay = WorkDay.create(TestDates.MARCH_15_2024);
      const mockState = { workDay };
      const expectedReport: DailyReport = {
        date: TestDates.MARCH_15_2024,
        totalWorkTime: TestDurations.ZERO,
        totalPauseTime: TestDurations.ZERO,
        effectiveWorkTime: TestDurations.ZERO,
        sessionCount: 0,
        pauseDeduction: TestDurations.ZERO,
        isComplete: false,
        remainingTime: TestDurations.TEN_HOURS,
        progressPercentage: 0,
        formattedTimes: {
          totalWorkTime: '00:00:00',
          totalPauseTime: '00:00:00',
          pauseDeduction: '00:00:00',
          effectiveWorkTime: '00:00:00',
          remainingTime: '10:00:00'
        }
      };
      
      mockTimerApplicationService.getCurrentState.and.returnValue(mockState as any);
      mockReportingService.generateDailyReport.and.returnValue(expectedReport);
      
      const query = new GetDailyReportQuery();
      const result = await handler.handle(query);
      
      expect(result).toBe(expectedReport);
      expect(mockTimerApplicationService.getCurrentState).toHaveBeenCalledTimes(1);
      expect(mockReportingService.generateDailyReport).toHaveBeenCalledWith(workDay);
    });

    it('should handle work day with sessions', async () => {
      const session1 = WorkSession.create(TestTimes.NINE_AM).stop(TestTimes.TEN_AM);
      const session2 = WorkSession.create(TestTimes.ELEVEN_AM).stop(TestTimes.NOON);
      const workDay = new WorkDay(TestDates.MARCH_15_2024, [session1, session2]);
      const mockState = { workDay };
      const expectedReport: DailyReport = {
        date: TestDates.MARCH_15_2024,
        totalWorkTime: TestDurations.TWO_HOURS,
        totalPauseTime: TestDurations.ONE_HOUR,
        effectiveWorkTime: TestDurations.TWO_HOURS,
        sessionCount: 2,
        pauseDeduction: TestDurations.ZERO,
        isComplete: false,
        remainingTime: TestDurations.TEN_HOURS.subtract(TestDurations.TWO_HOURS),
        progressPercentage: 20,
        formattedTimes: {
          totalWorkTime: '02:00:00',
          totalPauseTime: '01:00:00',
          pauseDeduction: '00:00:00',
          effectiveWorkTime: '02:00:00',
          remainingTime: '08:00:00'
        }
      };
      
      mockTimerApplicationService.getCurrentState.and.returnValue(mockState as any);
      mockReportingService.generateDailyReport.and.returnValue(expectedReport);
      
      const query = new GetDailyReportQuery();
      const result = await handler.handle(query);
      
      expect(result).toBe(expectedReport);
      expect(mockReportingService.generateDailyReport).toHaveBeenCalledWith(workDay);
    });

    it('should handle query with specific date', async () => {
      const workDay = WorkDay.create(TestDates.MARCH_16_2024);
      const mockState = { workDay };
      const expectedReport: DailyReport = {
        date: TestDates.MARCH_16_2024,
        totalWorkTime: TestDurations.ZERO,
        totalPauseTime: TestDurations.ZERO,
        effectiveWorkTime: TestDurations.ZERO,
        sessionCount: 0,
        pauseDeduction: TestDurations.ZERO,
        isComplete: false,
        remainingTime: TestDurations.TEN_HOURS,
        progressPercentage: 0,
        formattedTimes: {
          totalWorkTime: '00:00:00',
          totalPauseTime: '00:00:00',
          pauseDeduction: '00:00:00',
          effectiveWorkTime: '00:00:00',
          remainingTime: '10:00:00'
        }
      };
      
      mockTimerApplicationService.getCurrentState.and.returnValue(mockState as any);
      mockReportingService.generateDailyReport.and.returnValue(expectedReport);
      
      const query = new GetDailyReportQuery(TestDates.MARCH_16_2024);
      const result = await handler.handle(query);
      
      expect(result).toBe(expectedReport);
    });

    it('should handle query with user ID', async () => {
      const workDay = WorkDay.create(TestDates.MARCH_15_2024);
      const mockState = { workDay };
      const expectedReport: DailyReport = {
        date: TestDates.MARCH_15_2024,
        totalWorkTime: TestDurations.ZERO,
        totalPauseTime: TestDurations.ZERO,
        effectiveWorkTime: TestDurations.ZERO,
        sessionCount: 0,
        pauseDeduction: TestDurations.ZERO,
        isComplete: false,
        remainingTime: TestDurations.TEN_HOURS,
        progressPercentage: 0,
        formattedTimes: {
          totalWorkTime: '00:00:00',
          totalPauseTime: '00:00:00',
          pauseDeduction: '00:00:00',
          effectiveWorkTime: '00:00:00',
          remainingTime: '10:00:00'
        }
      };
      
      mockTimerApplicationService.getCurrentState.and.returnValue(mockState as any);
      mockReportingService.generateDailyReport.and.returnValue(expectedReport);
      
      const query = new GetDailyReportQuery(TestDates.MARCH_15_2024, 'user-456');
      const result = await handler.handle(query);
      
      expect(result).toBe(expectedReport);
    });
  });

  describe('Error Handling', () => {
    it('should propagate timer service errors', async () => {
      const error = new Error('Timer state error');
      mockTimerApplicationService.getCurrentState.and.throwError(error);
      
      const query = new GetDailyReportQuery();
      
      await expectAsync(handler.handle(query)).toBeRejectedWith(error);
    });

    it('should propagate reporting service errors', async () => {
      const workDay = WorkDay.create(TestDates.MARCH_15_2024);
      const mockState = { workDay };
      const error = new Error('Report generation error');
      
      mockTimerApplicationService.getCurrentState.and.returnValue(mockState as any);
      mockReportingService.generateDailyReport.and.throwError(error);
      
      const query = new GetDailyReportQuery();
      
      await expectAsync(handler.handle(query)).toBeRejectedWith(error);
    });
  });

  describe('Service Integration', () => {
    it('should pass work day from timer service to reporting service', async () => {
      const session = WorkSession.create(TestTimes.NINE_AM).stop(TestTimes.TEN_THIRTY_AM);
      const workDay = new WorkDay(TestDates.MARCH_15_2024, [session]);
      const mockState = { workDay };
      const expectedReport: DailyReport = {
        date: TestDates.MARCH_15_2024,
        totalWorkTime: TestDurations.ONE_HOUR.add(TestDurations.THIRTY_MINUTES),
        totalPauseTime: TestDurations.ZERO,
        effectiveWorkTime: TestDurations.ONE_HOUR.add(TestDurations.THIRTY_MINUTES),
        sessionCount: 1,
        pauseDeduction: TestDurations.ZERO,
        isComplete: false,
        remainingTime: TestDurations.TEN_HOURS.subtract(TestDurations.ONE_HOUR.add(TestDurations.THIRTY_MINUTES)),
        progressPercentage: 15,
        formattedTimes: {
          totalWorkTime: '01:30:00',
          totalPauseTime: '00:00:00',
          pauseDeduction: '00:00:00',
          effectiveWorkTime: '01:30:00',
          remainingTime: '08:30:00'
        }
      };
      
      mockTimerApplicationService.getCurrentState.and.returnValue(mockState as any);
      mockReportingService.generateDailyReport.and.returnValue(expectedReport);
      
      const query = new GetDailyReportQuery();
      const result = await handler.handle(query);
      
      expect(mockTimerApplicationService.getCurrentState).toHaveBeenCalledTimes(1);
      expect(mockReportingService.generateDailyReport).toHaveBeenCalledWith(workDay);
      expect(result).toBe(expectedReport);
    });

    it('should handle concurrent report requests', async () => {
      const workDay = WorkDay.create(TestDates.MARCH_15_2024);
      const mockState = { workDay };
      const expectedReport: DailyReport = {
        date: TestDates.MARCH_15_2024,
        totalWorkTime: TestDurations.ZERO,
        totalPauseTime: TestDurations.ZERO,
        effectiveWorkTime: TestDurations.ZERO,
        sessionCount: 0,
        pauseDeduction: TestDurations.ZERO,
        isComplete: false,
        remainingTime: TestDurations.TEN_HOURS,
        progressPercentage: 0,
        formattedTimes: {
          totalWorkTime: '00:00:00',
          totalPauseTime: '00:00:00',
          pauseDeduction: '00:00:00',
          effectiveWorkTime: '00:00:00',
          remainingTime: '10:00:00'
        }
      };
      
      mockTimerApplicationService.getCurrentState.and.returnValue(mockState as any);
      mockReportingService.generateDailyReport.and.returnValue(expectedReport);
      
      const query1 = new GetDailyReportQuery();
      const query2 = new GetDailyReportQuery();
      
      const [result1, result2] = await Promise.all([
        handler.handle(query1),
        handler.handle(query2)
      ]);
      
      expect(result1).toBe(expectedReport);
      expect(result2).toBe(expectedReport);
      expect(mockTimerApplicationService.getCurrentState).toHaveBeenCalledTimes(2);
      expect(mockReportingService.generateDailyReport).toHaveBeenCalledTimes(2);
    });
  });

  describe('Business Scenarios', () => {
    it('should handle complete work day report', async () => {
      // 10 hours of work completed
      const longSession = WorkSession.create(TestTimes.NINE_AM)
                                    .stop(new Date(TestTimes.NINE_AM.getTime() + 10 * 60 * 60 * 1000));
      const workDay = new WorkDay(TestDates.MARCH_15_2024, [longSession]);
      const mockState = { workDay };
      const expectedReport: DailyReport = {
        date: TestDates.MARCH_15_2024,
        totalWorkTime: TestDurations.TEN_HOURS,
        totalPauseTime: TestDurations.ZERO,
        effectiveWorkTime: TestDurations.TEN_HOURS,
        sessionCount: 1,
        pauseDeduction: TestDurations.ZERO,
        isComplete: true,
        remainingTime: TestDurations.ZERO,
        progressPercentage: 100,
        formattedTimes: {
          totalWorkTime: '10:00:00',
          totalPauseTime: '00:00:00',
          pauseDeduction: '00:00:00',
          effectiveWorkTime: '10:00:00',
          remainingTime: '00:00:00'
        }
      };
      
      mockTimerApplicationService.getCurrentState.and.returnValue(mockState as any);
      mockReportingService.generateDailyReport.and.returnValue(expectedReport);
      
      const query = new GetDailyReportQuery();
      const result = await handler.handle(query);
      
      expect(result.isComplete).toBe(true);
      expect(result.remainingTime.isZero()).toBe(true);
    });

    it('should handle work day with pause deduction applied', async () => {
      const session1 = WorkSession.create(TestTimes.NINE_AM).stop(TestTimes.TEN_AM);
      const session2 = WorkSession.create(TestTimes.TEN_THIRTY_AM).stop(TestTimes.ELEVEN_AM); // 30 min pause
      const workDay = new WorkDay(TestDates.MARCH_15_2024, [session1, session2], null, undefined, true);
      const mockState = { workDay };
      const expectedReport: DailyReport = {
        date: TestDates.MARCH_15_2024,
        totalWorkTime: TestDurations.TWO_HOURS,
        totalPauseTime: TestDurations.THIRTY_MINUTES,
        effectiveWorkTime: TestDurations.ONE_HOUR.add(TestDurations.THIRTY_MINUTES), // 2 hours - 30 min deduction
        sessionCount: 2,
        pauseDeduction: TestDurations.THIRTY_MINUTES,
        isComplete: false,
        remainingTime: TestDurations.TEN_HOURS.subtract(TestDurations.ONE_HOUR.add(TestDurations.THIRTY_MINUTES)),
        progressPercentage: 20,
        formattedTimes: {
          totalWorkTime: '02:00:00',
          totalPauseTime: '01:00:00',
          pauseDeduction: '00:30:00',
          effectiveWorkTime: '02:00:00',
          remainingTime: '08:00:00'
        }
      };
      
      mockTimerApplicationService.getCurrentState.and.returnValue(mockState as any);
      mockReportingService.generateDailyReport.and.returnValue(expectedReport);
      
      const query = new GetDailyReportQuery();
      const result = await handler.handle(query);
      
      expect(result.pauseDeduction.toMinutes()).toBe(30);
    });
  });
});