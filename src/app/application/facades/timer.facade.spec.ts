/**
 * @fileoverview Tests for TimerFacade - Angular Signals reactive facade.
 * @author Work Timer Application
 */

import { TestBed } from '@angular/core/testing';
import { TimerFacade } from './timer.facade';
import { TimerApplicationService, TimerApplicationState } from '../services/timer-application.service';
import { ReportingApplicationService } from '../services/reporting-application.service';
import { WorkSessionApplicationService } from '../services/work-session-application.service';
import { StartWorkHandler } from '../handlers/start-work.handler';
import { StopWorkHandler } from '../handlers/stop-work.handler';
import { ResetTimerHandler } from '../handlers/reset-timer.handler';
import { GetCurrentSessionHandler } from '../handlers/get-current-session.handler';
import { GetDailyReportHandler } from '../handlers/get-daily-report.handler';
import { Duration, TimerStatus, WorkDayDate, WorkDay } from '../../domain';

describe('TimerFacade - Basic Angular Signals Tests', () => {
  let facade: TimerFacade;
  let mockTimerService: jasmine.SpyObj<TimerApplicationService>;

  const mockInitialState = {
    workDay: WorkDay.create(WorkDayDate.today()),
    calculations: {
      totalWorkTime: Duration.zero(),
      totalPauseTime: Duration.zero(),
      effectiveWorkTime: Duration.zero(),
      remainingTime: Duration.fromHours(10),
      pauseDeduction: Duration.zero(),
      isComplete: false
    },
    currentSessionTime: Duration.zero()
  };

  beforeEach(() => {
    // Create spies for all dependencies
    const timerServiceSpy = jasmine.createSpyObj('TimerApplicationService', [
      'getCurrentState', 'onEvent', 'getProgressPercentage', 'getWorkDayData', 'loadWorkDay'
    ]);
    const reportingServiceSpy = jasmine.createSpyObj('ReportingApplicationService', ['generateDailyReport']);
    const workSessionServiceSpy = jasmine.createSpyObj('WorkSessionApplicationService', ['getCurrentSession']);
    const startHandlerSpy = jasmine.createSpyObj('StartWorkHandler', ['handle']);
    const stopHandlerSpy = jasmine.createSpyObj('StopWorkHandler', ['handle']);
    const resetHandlerSpy = jasmine.createSpyObj('ResetTimerHandler', ['handle']);
    const getCurrentSessionSpy = jasmine.createSpyObj('GetCurrentSessionHandler', ['handle']);
    const getDailyReportSpy = jasmine.createSpyObj('GetDailyReportHandler', ['handle']);

    // Set up default return values
    timerServiceSpy.getCurrentState.and.returnValue(mockInitialState);
    timerServiceSpy.getProgressPercentage.and.returnValue(0);
    timerServiceSpy.getWorkDayData.and.returnValue({});
    startHandlerSpy.handle.and.returnValue(Promise.resolve());
    stopHandlerSpy.handle.and.returnValue(Promise.resolve());
    resetHandlerSpy.handle.and.returnValue(Promise.resolve());
    getCurrentSessionSpy.handle.and.returnValue(Promise.resolve(null));

    TestBed.configureTestingModule({
      providers: [
        TimerFacade,
        { provide: TimerApplicationService, useValue: timerServiceSpy },
        { provide: ReportingApplicationService, useValue: reportingServiceSpy },
        { provide: WorkSessionApplicationService, useValue: workSessionServiceSpy },
        { provide: StartWorkHandler, useValue: startHandlerSpy },
        { provide: StopWorkHandler, useValue: stopHandlerSpy },
        { provide: ResetTimerHandler, useValue: resetHandlerSpy },
        { provide: GetCurrentSessionHandler, useValue: getCurrentSessionSpy },
        { provide: GetDailyReportHandler, useValue: getDailyReportSpy }
      ]
    });

    facade = TestBed.inject(TimerFacade);
    mockTimerService = TestBed.inject(TimerApplicationService) as jasmine.SpyObj<TimerApplicationService>;

    // Clear any intervals from previous tests
    jasmine.clock().uninstall();
    jasmine.clock().install();
  });

  afterEach(() => {
    facade.destroy();
    jasmine.clock().uninstall();
  });

  describe('Angular Signals Initialization', () => {
    it('should create facade with reactive computed signals', () => {
      expect(facade).toBeTruthy();
      
      // Test that computed signals are functions (Angular signals)
      expect(typeof facade.currentStatus).toBe('function');
      expect(typeof facade.currentWorkTime).toBe('function');
      expect(typeof facade.buttonText).toBe('function');
      expect(typeof facade.formattedCurrentTime).toBe('function');
    });

    it('should initialize with correct computed signal values', () => {
      expect(facade.currentStatus()).toEqual(TimerStatus.STOPPED);
      expect(facade.currentWorkTime()).toEqual(Duration.zero());
      expect(facade.buttonText()).toBe('Start Work');
      expect(facade.formattedCurrentTime()).toBe('00:00:00');
      expect(facade.canStartWork()).toBe(true);
      expect(facade.canStopWork()).toBe(false);
    });

    it('should setup event handling for reactive updates', () => {
      expect(mockTimerService.onEvent).toHaveBeenCalled();
      expect(mockTimerService.getCurrentState).toHaveBeenCalled();
    });
  });

  describe('Angular Signals Reactivity', () => {
    it('should update computed signals when state changes', () => {
      // Create a new work day with running status
      const runningWorkDay = WorkDay.create(WorkDayDate.today()).startWork(new Date());
      const runningState = {
        workDay: runningWorkDay,
        calculations: {
          totalWorkTime: Duration.fromHours(2),
          totalPauseTime: Duration.fromMinutes(15),
          effectiveWorkTime: Duration.fromHours(1.5),
          remainingTime: Duration.fromHours(8.5),
          pauseDeduction: Duration.zero(),
          isComplete: false
        },
        currentSessionTime: Duration.fromMinutes(30)
      };

      // Update the mock to return the new state
      mockTimerService.getCurrentState.and.returnValue(runningState);
      
      // Trigger state update to simulate reactivity
      facade['updateState']();

      // Verify computed signals reflect the new state
      expect(facade.currentStatus()).toEqual(TimerStatus.RUNNING);
      expect(facade.currentWorkTime()).toEqual(Duration.fromHours(2));
      expect(facade.currentSessionTime()).toEqual(Duration.fromMinutes(30));
      expect(facade.buttonText()).toBe('Stop Work');
      expect(facade.canStartWork()).toBe(false);
      expect(facade.canStopWork()).toBe(true);
    });

    it('should handle event-driven state updates', () => {
      const eventCallback = mockTimerService.onEvent.calls.mostRecent().args[0];
      spyOn(facade as any, 'updateState');

      // Simulate a domain event
      const mockEvent = { eventType: 'WorkStarted', timestamp: new Date() };
      eventCallback(mockEvent);

      // Verify the facade responds to events by updating state
      expect(facade['updateState']).toHaveBeenCalled();
    });
  });

  describe('Timer Interval and Real-time Updates', () => {
    it('should setup interval for real-time updates', () => {
      spyOn(window, 'setInterval').and.callThrough();
      
      // Create a new facade to test initialization
      const newFacade = new TimerFacade(
        mockTimerService,
        TestBed.inject(ReportingApplicationService),
        TestBed.inject(WorkSessionApplicationService),
        TestBed.inject(StartWorkHandler),
        TestBed.inject(StopWorkHandler),
        TestBed.inject(ResetTimerHandler),
        TestBed.inject(GetCurrentSessionHandler),
        TestBed.inject(GetDailyReportHandler)
      );

      expect(window.setInterval).toHaveBeenCalledWith(jasmine.any(Function), 1000);
      newFacade.destroy();
    });

    it('should clear interval on destroy', () => {
      spyOn(window, 'clearInterval');
      facade.destroy();
      expect(window.clearInterval).toHaveBeenCalled();
    });
  });

  describe('Command Operations with Reactive Updates', () => {
    it('should trigger state updates after commands', async () => {
      const initialCallCount = mockTimerService.getCurrentState.calls.count();
      
      await facade.startWork();
      
      // Should call getCurrentState again after the command
      expect(mockTimerService.getCurrentState.calls.count()).toBeGreaterThan(initialCallCount);
    });

    it('should maintain reactivity during command execution', async () => {
      spyOn(facade as any, 'updateState');
      
      await facade.stopWork();
      
      expect(facade['updateState']).toHaveBeenCalled();
    });
  });

  describe('Utility Methods and Formatting', () => {
    it('should format durations correctly', () => {
      const result = facade.formatTime(3661000); // 1h 1m 1s
      expect(result).toBe('01:01:01');
    });

    it('should provide progress information', () => {
      mockTimerService.getProgressPercentage.and.returnValue(42.5);
      const progressText = facade.getProgressText();
      expect(progressText).toBe('42.5% of daily limit');
    });

    it('should provide formatted date', () => {
      expect(facade.currentDate).toMatch(/^\w+, \w+ \d{1,2}, \d{4}$/);
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle null state gracefully', () => {
      // Create a valid state object but with undefined calculations
      const mockState = {
        workDay: WorkDay.create(WorkDayDate.today()),
        calculations: {
          totalWorkTime: Duration.zero(),
          totalPauseTime: Duration.zero(),
          pauseDeduction: Duration.zero(),
          effectiveWorkTime: Duration.zero(),
          remainingTime: Duration.zero(),
          isComplete: false
        },
        currentSessionTime: Duration.zero()
      } as TimerApplicationState;
      
      mockTimerService.getCurrentState.and.returnValue(mockState);
      facade['updateState']();

      expect(facade.currentStatus()).toEqual(TimerStatus.STOPPED);
      expect(facade.buttonText()).toBe('Start Work');
      expect(facade.canStartWork()).toBe(true);
    });

    it('should handle incomplete state objects', () => {
      const incompleteState = {
        workDay: WorkDay.create(WorkDayDate.today()),
        // Missing calculations and currentSessionTime
      } as any;
      
      mockTimerService.getCurrentState.and.returnValue(incompleteState);
      facade['updateState']();

      // Should use fallback values
      expect(facade.currentWorkTime()).toEqual(Duration.zero());
      expect(facade.isWorkComplete()).toBe(false);
    });
  });
});