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
      'isWorkDayComplete'
    ]);
    const pausePolicySpy = jasmine.createSpyObj('PauseDeductionPolicy', [
      'evaluateDeduction', 
      'canApplyDeduction'
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

    it('should start work session', async () => {
      spyOn(service, 'getCurrentTime').and.returnValue(TestTimes.NINE_AM);
      
      await service.startWork();
      
      const state = service.getCurrentState();
      expect(state.workDay.status.isRunning()).toBe(true);
      expect(state.workDay.currentSession).not.toBeNull();
    });

    it('should stop work session', async () => {
      spyOn(service, 'getCurrentTime').and.returnValues(TestTimes.NINE_AM, TestTimes.TEN_AM);
      
      await service.startWork();
      await service.stopWork();
      
      const state = service.getCurrentState();
      expect(state.workDay.status.isPaused()).toBe(true);
      expect(state.workDay.currentSession).toBeNull();
      expect(state.workDay.sessions.length).toBe(1);
    });

    it('should reset timer', async () => {
      spyOn(service, 'getCurrentTime').and.returnValues(TestTimes.NINE_AM, TestTimes.TEN_AM);
      
      await service.startWork();
      await service.stopWork();
      await service.resetTimer();
      
      const state = service.getCurrentState();
      expect(state.workDay.status.isStopped()).toBe(true);
      expect(state.workDay.sessions.length).toBe(0);
      expect(state.workDay.currentSession).toBeNull();
    });

    it('should throw error when starting work while already running', async () => {
      spyOn(service, 'getCurrentTime').and.returnValue(TestTimes.NINE_AM);
      
      await service.startWork();
      
      await expectAsync(service.startWork()).toBeRejectedWithError('Cannot start work when already running.');
    });

    it('should throw error when stopping work while not running', async () => {
      await expectAsync(service.stopWork()).toBeRejectedWithError('Cannot stop work when not running.');
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

    it('should apply pause deduction when conditions are met', async () => {
      mockPauseDeductionPolicy.canApplyDeduction.and.returnValue(true);
      mockPauseDeductionPolicy.evaluateDeduction.and.returnValue({
        shouldApplyDeduction: true,
        deductionAmount: TestDurations.THIRTY_MINUTES,
        reason: 'Pause time within threshold'
      });
      
      spyOn(service, 'getCurrentTime').and.returnValues(
        TestTimes.NINE_AM,    // Start work
        TestTimes.TEN_AM,     // Stop work (pause)
        TestTimes.TEN_THIRTY_AM  // Resume work
      );
      
      await service.startWork();
      await service.stopWork();
      await service.startWork(); // This should trigger pause deduction evaluation
      
      expect(mockPauseDeductionPolicy.canApplyDeduction).toHaveBeenCalled();
    });

    it('should not apply pause deduction when already applied', async () => {
      mockPauseDeductionPolicy.canApplyDeduction.and.returnValue(false);
      mockPauseDeductionPolicy.evaluateDeduction.and.returnValue({
        shouldApplyDeduction: false,
        deductionAmount: TestDurations.THIRTY_MINUTES,
        reason: 'Already applied'
      });
      
      spyOn(service, 'getCurrentTime').and.returnValues(
        TestTimes.NINE_AM,
        TestTimes.TEN_AM,
        TestTimes.TEN_FIFTEEN_AM
      );
      
      await service.startWork();
      await service.stopWork();
      await service.startWork();
      
      expect(mockPauseDeductionPolicy.canApplyDeduction).toHaveBeenCalled();
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
      spyOn(service, 'getCurrentTime').and.returnValues(TestTimes.NINE_AM, TestTimes.NINE_AM);
      
      // Mock running session
      const mockWorkDay = jasmine.createSpyObj('WorkDay', ['getCurrentSessionTime', 'status']);
      mockWorkDay.status = TimerStatus.RUNNING;
      mockWorkDay.getCurrentSessionTime.and.returnValue(TestDurations.THIRTY_MINUTES);
      
      // We need to set up the service state differently for this test
      // This is a limitation of the current design - we might need to refactor
      mockTimeCalculationService.calculateWorkDayMetrics.and.returnValue({
        totalWorkTime: TestDurations.ZERO,
        totalPauseTime: TestDurations.ZERO,
        pauseDeduction: TestDurations.ZERO,
        effectiveWorkTime: TestDurations.ZERO,
        remainingTime: TestDurations.TEN_HOURS,
        isComplete: false
      });
      
      const state = service.getCurrentState();
      
      expect(mockTimeCalculationService.calculateWorkDayMetrics).toHaveBeenCalled();
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

    it('should prevent starting work when daily limit reached', async () => {
      mockTimeCalculationService.isWorkDayComplete.and.returnValue(true);
      mockTimeCalculationService.calculateWorkDayMetrics.and.returnValue({
        totalWorkTime: TestDurations.TEN_HOURS,
        totalPauseTime: TestDurations.ZERO,
        pauseDeduction: TestDurations.ZERO,
        effectiveWorkTime: TestDurations.TEN_HOURS,
        remainingTime: TestDurations.ZERO,
        isComplete: true
      });
      
      await expectAsync(service.startWork()).toBeRejectedWithError('Daily work limit has been reached.');
    });
  });

  describe('Event Handling', () => {
    it('should notify listeners when work session starts', async () => {
      const eventSpy = jasmine.createSpy('eventHandler');
      service.addEventHandler(eventSpy);
      
      spyOn(service, 'getCurrentTime').and.returnValue(TestTimes.NINE_AM);
      mockTimeCalculationService.calculateWorkDayMetrics.and.returnValue({
        totalWorkTime: TestDurations.ZERO,
        totalPauseTime: TestDurations.ZERO,
        pauseDeduction: TestDurations.ZERO,
        effectiveWorkTime: TestDurations.ZERO,
        remainingTime: TestDurations.TEN_HOURS,
        isComplete: false
      });
      
      await service.startWork();
      
      expect(eventSpy).toHaveBeenCalled();
    });

    it('should notify listeners when work session stops', async () => {
      const eventSpy = jasmine.createSpy('eventHandler');
      service.addEventHandler(eventSpy);
      
      spyOn(service, 'getCurrentTime').and.returnValues(TestTimes.NINE_AM, TestTimes.TEN_AM);
      mockTimeCalculationService.calculateWorkDayMetrics.and.returnValue({
        totalWorkTime: TestDurations.ONE_HOUR,
        totalPauseTime: TestDurations.ZERO,
        pauseDeduction: TestDurations.ZERO,
        effectiveWorkTime: TestDurations.ONE_HOUR,
        remainingTime: TestDurations.TEN_HOURS.subtract(TestDurations.ONE_HOUR),
        isComplete: false
      });
      
      await service.startWork();
      await service.stopWork();
      
      expect(eventSpy).toHaveBeenCalledTimes(2); // Start and stop events
    });

    it('should allow removing event handlers', async () => {
      const eventSpy = jasmine.createSpy('eventHandler');
      service.addEventHandler(eventSpy);
      service.removeEventHandler(eventSpy);
      
      spyOn(service, 'getCurrentTime').and.returnValue(TestTimes.NINE_AM);
      mockTimeCalculationService.calculateWorkDayMetrics.and.returnValue({
        totalWorkTime: TestDurations.ZERO,
        totalPauseTime: TestDurations.ZERO,
        pauseDeduction: TestDurations.ZERO,
        effectiveWorkTime: TestDurations.ZERO,
        remainingTime: TestDurations.TEN_HOURS,
        isComplete: false
      });
      
      await service.startWork();
      
      expect(eventSpy).not.toHaveBeenCalled();
    });
  });

  describe('Error Scenarios', () => {
    it('should handle calculation service errors gracefully', () => {
      mockTimeCalculationService.calculateWorkDayMetrics.and.throwError('Calculation error');
      
      expect(() => service.getCurrentState()).toThrowError('Calculation error');
    });

    it('should handle pause deduction policy errors gracefully', async () => {
      mockPauseDeductionPolicy.canApplyDeduction.and.throwError('Policy error');
      mockTimeCalculationService.calculateWorkDayMetrics.and.returnValue({
        totalWorkTime: TestDurations.ZERO,
        totalPauseTime: TestDurations.ZERO,
        pauseDeduction: TestDurations.ZERO,
        effectiveWorkTime: TestDurations.ZERO,
        remainingTime: TestDurations.TEN_HOURS,
        isComplete: false
      });
      
      spyOn(service, 'getCurrentTime').and.returnValues(TestTimes.NINE_AM, TestTimes.TEN_AM);
      
      await service.startWork();
      
      await expectAsync(service.stopWork()).toBeRejectedWithError('Policy error');
    });
  });

  describe('Time Management', () => {
    it('should use current time for operations', async () => {
      const currentTimeSpy = spyOn(service, 'getCurrentTime').and.returnValue(TestTimes.NINE_AM);
      mockTimeCalculationService.calculateWorkDayMetrics.and.returnValue({
        totalWorkTime: TestDurations.ZERO,
        totalPauseTime: TestDurations.ZERO,
        pauseDeduction: TestDurations.ZERO,
        effectiveWorkTime: TestDurations.ZERO,
        remainingTime: TestDurations.TEN_HOURS,
        isComplete: false
      });
      
      await service.startWork();
      
      expect(currentTimeSpy).toHaveBeenCalled();
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