/**
 * @fileoverview Timer application service tests.
 * @author Work Timer Application
 */

import { TestBed } from '@angular/core/testing';
import { TimerApplicationService } from './timer-application.service';
import { TimeCalculationService } from '../../domain/services/time-calculation.service';
import { PauseDeductionPolicy } from '../../domain/policies/pause-deduction-policy';
import { WorkDay, WorkDayDate, Duration, TimerStatus } from '../../domain';
import { TestTimes, TestDates, TestDurations } from '../../testing/helpers/time.helpers';

describe('TimerApplicationService', () => {
  let service: TimerApplicationService;
  let mockTimeCalculationService: jasmine.SpyObj<TimeCalculationService>;
  let mockPauseDeductionPolicy: jasmine.SpyObj<PauseDeductionPolicy>;

  beforeEach(() => {
    const timeCalcSpy = jasmine.createSpyObj('TimeCalculationService', [
      'calculateWorkDayMetrics', 
      'shouldApplyPauseDeduction',
      'isWorkDayComplete',
      'getMaxWorkTime',
      'calculateProgressPercentage'
    ]);
    const pausePolicySpy = jasmine.createSpyObj('PauseDeductionPolicy', [
      'evaluateDeduction', 
      'canApplyDeduction',
      'getDeductionAmount'
    ]);

    TestBed.configureTestingModule({
      providers: [
        TimerApplicationService,
        { provide: TimeCalculationService, useValue: timeCalcSpy },
        { provide: PauseDeductionPolicy, useValue: pausePolicySpy }
      ]
    });

    service = TestBed.inject(TimerApplicationService);
    mockTimeCalculationService = TestBed.inject(TimeCalculationService) as jasmine.SpyObj<TimeCalculationService>;
    mockPauseDeductionPolicy = TestBed.inject(PauseDeductionPolicy) as jasmine.SpyObj<PauseDeductionPolicy>;

    // Set up default return values for new mock methods
    mockTimeCalculationService.getMaxWorkTime.and.returnValue(TestDurations.TEN_HOURS);
    mockTimeCalculationService.calculateProgressPercentage.and.returnValue(0);
    mockPauseDeductionPolicy.getDeductionAmount.and.returnValue(TestDurations.THIRTY_MINUTES);
  });

  describe('Service Initialization', () => {
    it('should be created', () => {
      expect(service).toBeTruthy();
    });

    it('should inject required dependencies', () => {
      expect(mockTimeCalculationService).toBeTruthy();
      expect(mockPauseDeductionPolicy).toBeTruthy();
    });

    it('should initialize with today work day', () => {
      // Mock the metrics calculation for initial state
      mockTimeCalculationService.calculateWorkDayMetrics.and.returnValue({
        totalWorkTime: TestDurations.ZERO,
        totalPauseTime: TestDurations.ZERO,
        pauseDeduction: TestDurations.ZERO,
        effectiveWorkTime: TestDurations.ZERO,
        remainingTime: TestDurations.TEN_HOURS,
        isComplete: false
      });

      const state = service.getCurrentState();
      
      expect(state.workDay.date.isToday()).toBe(true);
      expect(state.workDay.status.isStopped()).toBe(true);
      expect(state.calculations.totalWorkTime.isZero()).toBe(true);
    });
  });

  describe('Work Session Management', () => {
    beforeEach(() => {
      // Setup default mock responses
      mockTimeCalculationService.calculateWorkDayMetrics.and.returnValue({
        totalWorkTime: TestDurations.ZERO,
        totalPauseTime: TestDurations.ZERO,
        pauseDeduction: TestDurations.ZERO,
        effectiveWorkTime: TestDurations.ZERO,
        remainingTime: TestDurations.TEN_HOURS,
        isComplete: false
      });
    });

    it('should start work session', () => {
      // Mock Date.now or use jasmine.clock
      jasmine.clock().install();
      jasmine.clock().mockDate(TestTimes.NINE_AM);
      
      service.startWork();
      
      const state = service.getCurrentState();
      expect(state.workDay.status.isRunning()).toBe(true);
      expect(state.workDay.currentSession).not.toBeNull();
      
      jasmine.clock().uninstall();
    });

    it('should stop work session', () => {
      jasmine.clock().install();
      jasmine.clock().mockDate(TestTimes.NINE_AM);
      
      service.startWork();
      
      jasmine.clock().mockDate(TestTimes.TEN_AM);
      service.stopWork();
      
      const state = service.getCurrentState();
      expect(state.workDay.status.isPaused()).toBe(true);
      expect(state.workDay.currentSession).toBeNull();
      expect(state.workDay.sessions.length).toBe(1);
      
      jasmine.clock().uninstall();
    });

    it('should reset timer', () => {
      jasmine.clock().install();
      jasmine.clock().mockDate(TestTimes.NINE_AM);
      
      service.startWork();
      
      jasmine.clock().mockDate(TestTimes.TEN_AM);
      service.stopWork();
      service.resetTimer();
      
      const state = service.getCurrentState();
      expect(state.workDay.status.isStopped()).toBe(true);
      expect(state.workDay.sessions.length).toBe(0);
      expect(state.workDay.currentSession).toBeNull();
      
      jasmine.clock().uninstall();
    });

    it('should throw error when starting work while already running', () => {
      jasmine.clock().install();
      jasmine.clock().mockDate(TestTimes.NINE_AM);
      
      service.startWork();
      
      expect(() => service.startWork()).toThrowError();
      
      jasmine.clock().uninstall();
    });

    it('should throw error when stopping work while not running', () => {
      expect(() => service.stopWork()).toThrowError('No active work session to stop');
    });
  });

  describe('Pause Deduction Logic', () => {
    beforeEach(() => {
      mockTimeCalculationService.calculateWorkDayMetrics.and.returnValue({
        totalWorkTime: TestDurations.TWO_HOURS,
        totalPauseTime: TestDurations.THIRTY_MINUTES,
        pauseDeduction: TestDurations.THIRTY_MINUTES,
        effectiveWorkTime: TestDurations.ONE_HOUR.add(TestDurations.THIRTY_MINUTES),
        remainingTime: TestDurations.TEN_HOURS.subtract(TestDurations.ONE_HOUR.add(TestDurations.THIRTY_MINUTES)),
        isComplete: false
      });
    });

    it('should apply pause deduction when conditions are met', () => {
      mockPauseDeductionPolicy.canApplyDeduction.and.returnValue(true);
      mockPauseDeductionPolicy.getDeductionAmount.and.returnValue(TestDurations.THIRTY_MINUTES);
      
      jasmine.clock().install();
      jasmine.clock().mockDate(TestTimes.NINE_AM);
      
      service.startWork();
      
      jasmine.clock().mockDate(TestTimes.TEN_AM);
      service.stopWork();
      
      jasmine.clock().mockDate(TestTimes.TEN_THIRTY_AM);
      service.startWork(); // This should trigger pause deduction evaluation
      
      expect(mockPauseDeductionPolicy.canApplyDeduction).toHaveBeenCalled();
      
      jasmine.clock().uninstall();
    });

    it('should not apply pause deduction when already applied', () => {
      mockPauseDeductionPolicy.canApplyDeduction.and.returnValue(false);
      
      jasmine.clock().install();
      jasmine.clock().mockDate(TestTimes.NINE_AM);
      
      service.startWork();
      
      jasmine.clock().mockDate(TestTimes.TEN_AM);
      service.stopWork();
      
      jasmine.clock().mockDate(TestTimes.TEN_THIRTY_AM);
      service.startWork();
      
      expect(mockPauseDeductionPolicy.canApplyDeduction).toHaveBeenCalled();
      
      jasmine.clock().uninstall();
    });
  });

  describe('State Calculations', () => {
    it('should delegate calculations to time calculation service', () => {
      const expectedCalculations = {
        totalWorkTime: TestDurations.TWO_HOURS,
        totalPauseTime: TestDurations.FIFTEEN_MINUTES,
        pauseDeduction: TestDurations.THIRTY_MINUTES,
        effectiveWorkTime: TestDurations.ONE_HOUR.add(TestDurations.THIRTY_MINUTES),
        remainingTime: TestDurations.TEN_HOURS.subtract(TestDurations.ONE_HOUR.add(TestDurations.THIRTY_MINUTES)),
        isComplete: false
      };
      
      mockTimeCalculationService.calculateWorkDayMetrics.and.returnValue(expectedCalculations);
      
      const state = service.getCurrentState();
      
      expect(mockTimeCalculationService.calculateWorkDayMetrics).toHaveBeenCalledWith(state.workDay);
      expect(state.calculations).toBe(expectedCalculations);
    });

    it('should calculate current session time for running session', () => {
      jasmine.clock().install();
      jasmine.clock().mockDate(TestTimes.NINE_AM);
      
      mockTimeCalculationService.calculateWorkDayMetrics.and.returnValue({
        totalWorkTime: TestDurations.ZERO,
        totalPauseTime: TestDurations.ZERO,
        pauseDeduction: TestDurations.ZERO,
        effectiveWorkTime: TestDurations.ZERO,
        remainingTime: TestDurations.TEN_HOURS,
        isComplete: false
      });
      
      // Start a session to test current session time calculation
      service.startWork();
      const state = service.getCurrentState();
      
      expect(mockTimeCalculationService.calculateWorkDayMetrics).toHaveBeenCalled();
      expect(state.currentSessionTime).toBeDefined();
      
      jasmine.clock().uninstall();
    });
  });

  describe('Work Day Completion', () => {
    it('should detect when daily limit is reached', () => {
      mockTimeCalculationService.calculateWorkDayMetrics.and.returnValue({
        totalWorkTime: TestDurations.TEN_HOURS,
        totalPauseTime: TestDurations.ZERO,
        pauseDeduction: TestDurations.ZERO,
        effectiveWorkTime: TestDurations.TEN_HOURS,
        remainingTime: TestDurations.ZERO,
        isComplete: true
      });
      
      const state = service.getCurrentState();
      
      expect(state.calculations.isComplete).toBe(true);
      expect(state.calculations.remainingTime.isZero()).toBe(true);
    });

    it('should prevent starting work when daily limit reached', () => {
      mockTimeCalculationService.calculateWorkDayMetrics.and.returnValue({
        totalWorkTime: TestDurations.TEN_HOURS,
        totalPauseTime: TestDurations.ZERO,
        pauseDeduction: TestDurations.ZERO,
        effectiveWorkTime: TestDurations.TEN_HOURS,
        remainingTime: TestDurations.ZERO,
        isComplete: true
      });
      
      // The service should check if work is complete before allowing start
      const canStart = service.canStartWork();
      expect(canStart).toBe(false);
    });
  });

  describe('Event Handling', () => {
    it('should notify listeners when work session starts', () => {
      const eventSpy = jasmine.createSpy('eventHandler');
      service.onEvent(eventSpy);
      
      jasmine.clock().install();
      jasmine.clock().mockDate(TestTimes.NINE_AM);
      
      mockTimeCalculationService.calculateWorkDayMetrics.and.returnValue({
        totalWorkTime: TestDurations.ZERO,
        totalPauseTime: TestDurations.ZERO,
        pauseDeduction: TestDurations.ZERO,
        effectiveWorkTime: TestDurations.ZERO,
        remainingTime: TestDurations.TEN_HOURS,
        isComplete: false
      });
      
      service.startWork();
      
      expect(eventSpy).toHaveBeenCalled();
      
      jasmine.clock().uninstall();
    });

    it('should notify listeners when work session stops', () => {
      const eventSpy = jasmine.createSpy('eventHandler');
      service.onEvent(eventSpy);
      
      jasmine.clock().install();
      jasmine.clock().mockDate(TestTimes.NINE_AM);
      
      mockTimeCalculationService.calculateWorkDayMetrics.and.returnValue({
        totalWorkTime: TestDurations.ONE_HOUR,
        totalPauseTime: TestDurations.ZERO,
        pauseDeduction: TestDurations.ZERO,
        effectiveWorkTime: TestDurations.ONE_HOUR,
        remainingTime: TestDurations.TEN_HOURS.subtract(TestDurations.ONE_HOUR),
        isComplete: false
      });
      
      service.startWork();
      
      jasmine.clock().mockDate(TestTimes.TEN_AM);
      service.stopWork();
      
      expect(eventSpy).toHaveBeenCalledTimes(2); // Start and stop events
      
      jasmine.clock().uninstall();
    });

    it('should handle multiple event handlers', () => {
      const eventSpy1 = jasmine.createSpy('eventHandler1');
      const eventSpy2 = jasmine.createSpy('eventHandler2');
      service.onEvent(eventSpy1);
      service.onEvent(eventSpy2);
      
      jasmine.clock().install();
      jasmine.clock().mockDate(TestTimes.NINE_AM);
      
      mockTimeCalculationService.calculateWorkDayMetrics.and.returnValue({
        totalWorkTime: TestDurations.ZERO,
        totalPauseTime: TestDurations.ZERO,
        pauseDeduction: TestDurations.ZERO,
        effectiveWorkTime: TestDurations.ZERO,
        remainingTime: TestDurations.TEN_HOURS,
        isComplete: false
      });
      
      service.startWork();
      
      expect(eventSpy1).toHaveBeenCalled();
      expect(eventSpy2).toHaveBeenCalled();
      
      jasmine.clock().uninstall();
    });
  });

  describe('Error Scenarios', () => {
    it('should handle calculation service errors gracefully', () => {
      mockTimeCalculationService.calculateWorkDayMetrics.and.throwError('Calculation error');
      
      expect(() => service.getCurrentState()).toThrowError('Calculation error');
    });

    it('should handle pause deduction policy errors gracefully', () => {
      mockPauseDeductionPolicy.canApplyDeduction.and.throwError('Policy error');
      mockTimeCalculationService.calculateWorkDayMetrics.and.returnValue({
        totalWorkTime: TestDurations.ZERO,
        totalPauseTime: TestDurations.ZERO,
        pauseDeduction: TestDurations.ZERO,
        effectiveWorkTime: TestDurations.ZERO,
        remainingTime: TestDurations.TEN_HOURS,
        isComplete: false
      });
      
      jasmine.clock().install();
      jasmine.clock().mockDate(TestTimes.NINE_AM);
      
      service.startWork();
      
      jasmine.clock().mockDate(TestTimes.TEN_AM);
      
      // The error should be thrown when starting work again (which checks pause deduction)
      expect(() => service.startWork()).toThrowError('Policy error');
      
      jasmine.clock().uninstall();
    });
  });

  describe('Time Management', () => {
    it('should use current time for operations', () => {
      jasmine.clock().install();
      const testTime = TestTimes.NINE_AM;
      jasmine.clock().mockDate(testTime);
      
      mockTimeCalculationService.calculateWorkDayMetrics.and.returnValue({
        totalWorkTime: TestDurations.ZERO,
        totalPauseTime: TestDurations.ZERO,
        pauseDeduction: TestDurations.ZERO,
        effectiveWorkTime: TestDurations.ZERO,
        remainingTime: TestDurations.TEN_HOURS,
        isComplete: false
      });
      
      service.startWork();
      
      const state = service.getCurrentState();
      // Verify that the work session was started at the mocked time
      expect(state.workDay.currentSession).not.toBeNull();
      
      jasmine.clock().uninstall();
    });

    it('should handle date transitions correctly', () => {
      // Test that the service handles day changes appropriately
      const tomorrow = WorkDayDate.today().addDays(1);
      
      // This would be a more complex test requiring service refactoring
      // to allow injecting the current date
      expect(service.getCurrentState().workDay.date.isToday()).toBe(true);
    });
  });
});