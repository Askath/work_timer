/**
 * @fileoverview Time calculation service tests.
 * @author Work Timer Application
 */

import { TestBed } from '@angular/core/testing';
import { TimeCalculationService } from './time-calculation.service';
import { WorkDay } from '../entities/work-day';
import { WorkSession } from '../entities/work-session';
import { Duration } from '../value-objects/duration';
import { WorkDayDate } from '../value-objects/work-day-date';

describe('TimeCalculationService', () => {
  let service: TimeCalculationService;
  const testDate = WorkDayDate.fromDate(new Date(2024, 2, 15)); // March 15, 2024

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(TimeCalculationService);
  });

  describe('Service Configuration', () => {
    it('should be created', () => {
      expect(service).toBeTruthy();
    });

    it('should have correct business rule constants', () => {
      expect(service.getMaxWorkTime().toHours()).toBe(10);
      expect(service.getPauseDeductionThreshold().toMinutes()).toBe(30);
      expect(service.getPauseDeductionAmount().toMinutes()).toBe(30);
    });
  });

  describe('Work Day Metrics Calculation', () => {
    it('should calculate metrics for empty work day', () => {
      const workDay = WorkDay.create(testDate);
      const metrics = service.calculateWorkDayMetrics(workDay);
      
      expect(metrics.totalWorkTime.isZero()).toBe(true);
      expect(metrics.totalPauseTime.isZero()).toBe(true);
      expect(metrics.pauseDeduction.isZero()).toBe(true);
      expect(metrics.effectiveWorkTime.isZero()).toBe(true);
      expect(metrics.remainingTime.toHours()).toBe(10);
      expect(metrics.isComplete).toBe(false);
    });

    it('should calculate metrics for work day with single session', () => {
      const startTime = new Date(2024, 2, 15, 9, 0, 0);
      const endTime = new Date(2024, 2, 15, 10, 30, 0);
      const session = WorkSession.create(startTime).stop(endTime);
      const workDay = new WorkDay(testDate, [session]);
      
      const metrics = service.calculateWorkDayMetrics(workDay);
      
      expect(metrics.totalWorkTime.toMinutes()).toBe(90);
      expect(metrics.totalPauseTime.isZero()).toBe(true);
      expect(metrics.pauseDeduction.isZero()).toBe(true);
      expect(metrics.effectiveWorkTime.toMinutes()).toBe(90);
      expect(metrics.remainingTime.toMinutes()).toBe(510); // 600 - 90
      expect(metrics.isComplete).toBe(false);
    });

    it('should calculate metrics for work day with multiple sessions and pause', () => {
      const startTime1 = new Date(2024, 2, 15, 9, 0, 0);
      const endTime1 = new Date(2024, 2, 15, 10, 0, 0); // 60 minutes
      const startTime2 = new Date(2024, 2, 15, 10, 15, 0); // 15 minute pause
      const endTime2 = new Date(2024, 2, 15, 11, 15, 0); // 60 minutes
      
      const session1 = WorkSession.create(startTime1).stop(endTime1);
      const session2 = WorkSession.create(startTime2).stop(endTime2);
      const workDay = new WorkDay(testDate, [session1, session2]);
      
      const metrics = service.calculateWorkDayMetrics(workDay);
      
      expect(metrics.totalWorkTime.toMinutes()).toBe(120);
      expect(metrics.totalPauseTime.toMinutes()).toBe(15);
      expect(metrics.pauseDeduction.toMinutes()).toBe(30); // Applied because pause <= 30 min
      expect(metrics.effectiveWorkTime.toMinutes()).toBe(90); // 120 - 30
      expect(metrics.remainingTime.toMinutes()).toBe(510); // 600 - 90
    });

    it('should calculate metrics for complete work day', () => {
      const startTime = new Date(2024, 2, 15, 9, 0, 0);
      const endTime = new Date(startTime.getTime() + 10 * 60 * 60 * 1000); // 10 hours later
      const session = WorkSession.create(startTime).stop(endTime);
      const workDay = new WorkDay(testDate, [session]);
      
      const metrics = service.calculateWorkDayMetrics(workDay);
      
      expect(metrics.totalWorkTime.toHours()).toBe(10);
      expect(metrics.effectiveWorkTime.toHours()).toBe(10);
      expect(metrics.remainingTime.isZero()).toBe(true);
      expect(metrics.isComplete).toBe(true);
    });
  });

  describe('Pause Deduction Capping Logic', () => {
    it('should cap pause deduction at total work time when work time is less than 30 minutes', () => {
      // Reproduces the edge case from the GitHub issue
      const startTime1 = new Date(2024, 2, 15, 9, 0, 0);
      const endTime1 = new Date(2024, 2, 15, 9, 1, 7); // 1 minute 7 seconds work
      const startTime2 = new Date(2024, 2, 15, 9, 1, 19); // 12 second pause
      const endTime2 = new Date(2024, 2, 15, 9, 2, 19); // 1 minute work
      
      const session1 = WorkSession.create(startTime1).stop(endTime1);
      const session2 = WorkSession.create(startTime2).stop(endTime2);
      const workDay = new WorkDay(testDate, [session1, session2]);
      
      const metrics = service.calculateWorkDayMetrics(workDay);
      
      // Total work time should be about 2 minutes 7 seconds
      expect(metrics.totalWorkTime.toSeconds()).toBe(127); // 67 + 60 seconds
      expect(metrics.totalPauseTime.toSeconds()).toBe(12);
      // Pause deduction should be capped at total work time, not 30 minutes
      expect(metrics.pauseDeduction.equals(metrics.totalWorkTime)).toBe(true);
      expect(metrics.pauseDeduction.isLessThan(service.getPauseDeductionAmount())).toBe(true);
      // Effective work time should be 0 (total work time - total work time)
      expect(metrics.effectiveWorkTime.isZero()).toBe(true);
    });

    it('should apply full deduction when work time exceeds 30 minutes', () => {
      const startTime1 = new Date(2024, 2, 15, 9, 0, 0);
      const endTime1 = new Date(2024, 2, 15, 10, 0, 0); // 60 minutes work
      const startTime2 = new Date(2024, 2, 15, 10, 15, 0); // 15 minute pause
      const endTime2 = new Date(2024, 2, 15, 11, 15, 0); // 60 minutes work
      
      const session1 = WorkSession.create(startTime1).stop(endTime1);
      const session2 = WorkSession.create(startTime2).stop(endTime2);
      const workDay = new WorkDay(testDate, [session1, session2]);
      
      const metrics = service.calculateWorkDayMetrics(workDay);
      
      expect(metrics.totalWorkTime.toMinutes()).toBe(120);
      expect(metrics.pauseDeduction.toMinutes()).toBe(30); // Full deduction
      expect(metrics.effectiveWorkTime.toMinutes()).toBe(90);
    });
  });

  describe('Pause Deduction Logic', () => {
    it('should apply deduction for pause time within threshold', () => {
      const startTime1 = new Date(2024, 2, 15, 9, 0, 0);
      const endTime1 = new Date(2024, 2, 15, 10, 0, 0);
      const startTime2 = new Date(2024, 2, 15, 10, 30, 0); // 30 minute pause
      const endTime2 = new Date(2024, 2, 15, 11, 30, 0);
      
      const session1 = WorkSession.create(startTime1).stop(endTime1);
      const session2 = WorkSession.create(startTime2).stop(endTime2);
      const workDay = new WorkDay(testDate, [session1, session2]);
      
      const metrics = service.calculateWorkDayMetrics(workDay);
      
      expect(metrics.pauseDeduction.toMinutes()).toBe(30);
    });

    it('should not apply deduction for pause time over threshold', () => {
      const startTime1 = new Date(2024, 2, 15, 9, 0, 0);
      const endTime1 = new Date(2024, 2, 15, 10, 0, 0);
      const startTime2 = new Date(2024, 2, 15, 10, 31, 0); // 31 minute pause (over threshold)
      const endTime2 = new Date(2024, 2, 15, 11, 31, 0);
      
      const session1 = WorkSession.create(startTime1).stop(endTime1);
      const session2 = WorkSession.create(startTime2).stop(endTime2);
      const workDay = new WorkDay(testDate, [session1, session2]);
      
      const metrics = service.calculateWorkDayMetrics(workDay);
      
      expect(metrics.pauseDeduction.isZero()).toBe(true);
    });

    it('should not apply deduction when already applied', () => {
      const startTime1 = new Date(2024, 2, 15, 9, 0, 0);
      const endTime1 = new Date(2024, 2, 15, 10, 0, 0);
      const session1 = WorkSession.create(startTime1).stop(endTime1);
      const workDay = new WorkDay(testDate, [session1], null, undefined, true); // deduction already applied
      
      const metrics = service.calculateWorkDayMetrics(workDay);
      
      expect(metrics.pauseDeduction.toMinutes()).toBe(30); // Shows the deduction that was applied
    });

    it('should correctly determine when to apply pause deduction', () => {
      const smallPause = Duration.fromMinutes(15);
      const largePause = Duration.fromMinutes(45);
      const exactThreshold = Duration.fromMinutes(30);
      
      expect(service.shouldApplyPauseDeduction(smallPause, false)).toBe(true);
      expect(service.shouldApplyPauseDeduction(exactThreshold, false)).toBe(true);
      expect(service.shouldApplyPauseDeduction(largePause, false)).toBe(false);
      expect(service.shouldApplyPauseDeduction(smallPause, true)).toBe(false); // already applied
    });
  });

  describe('Progress Calculations', () => {
    it('should calculate progress percentage correctly', () => {
      const twoHours = Duration.fromHours(2);
      const fiveHours = Duration.fromHours(5);
      const tenHours = Duration.fromHours(10);
      const twelveHours = Duration.fromHours(12);
      
      expect(service.calculateProgressPercentage(Duration.zero())).toBe(0);
      expect(service.calculateProgressPercentage(twoHours)).toBe(20);
      expect(service.calculateProgressPercentage(fiveHours)).toBe(50);
      expect(service.calculateProgressPercentage(tenHours)).toBe(100);
      expect(service.calculateProgressPercentage(twelveHours)).toBe(100); // Capped at 100%
    });

    it('should determine work day completion correctly', () => {
      const nineHours = Duration.fromHours(9);
      const tenHours = Duration.fromHours(10);
      const elevenHours = Duration.fromHours(11);
      
      expect(service.isWorkDayComplete(nineHours)).toBe(false);
      expect(service.isWorkDayComplete(tenHours)).toBe(true);
      expect(service.isWorkDayComplete(elevenHours)).toBe(true);
    });

    it('should format remaining time correctly', () => {
      const remainingTime = Duration.fromMinutes(150); // 2.5 hours
      const formatted = service.getRemainingTimeFormatted(remainingTime);
      
      expect(formatted).toBe('02:30:00');
    });
  });

  describe('Edge Cases', () => {
    it('should handle work day with zero pause time', () => {
      const startTime = new Date(2024, 2, 15, 9, 0, 0);
      const endTime = new Date(2024, 2, 15, 10, 0, 0);
      const session = WorkSession.create(startTime).stop(endTime);
      const workDay = new WorkDay(testDate, [session]);
      
      const metrics = service.calculateWorkDayMetrics(workDay);
      
      expect(metrics.totalPauseTime.isZero()).toBe(true);
      expect(metrics.pauseDeduction.isZero()).toBe(true);
      expect(service.shouldApplyPauseDeduction(metrics.totalPauseTime, false)).toBe(false);
    });

    it('should handle work day exceeding maximum work time', () => {
      const startTime = new Date(2024, 2, 15, 9, 0, 0);
      const endTime = new Date(startTime.getTime() + 12 * 60 * 60 * 1000); // 12 hours
      const session = WorkSession.create(startTime).stop(endTime);
      const workDay = new WorkDay(testDate, [session]);
      
      const metrics = service.calculateWorkDayMetrics(workDay);
      
      expect(metrics.totalWorkTime.toHours()).toBe(12);
      expect(metrics.effectiveWorkTime.toHours()).toBe(12);
      expect(metrics.remainingTime.toHours()).toBe(-2); // Negative remaining time
      expect(metrics.isComplete).toBe(true);
      expect(service.calculateProgressPercentage(metrics.effectiveWorkTime)).toBe(100);
    });

    it('should handle very small pause times', () => {
      const startTime1 = new Date(2024, 2, 15, 9, 0, 0);
      const endTime1 = new Date(2024, 2, 15, 10, 0, 0);
      const startTime2 = new Date(2024, 2, 15, 10, 0, 30); // 30 second pause
      const endTime2 = new Date(2024, 2, 15, 11, 0, 30);
      
      const session1 = WorkSession.create(startTime1).stop(endTime1);
      const session2 = WorkSession.create(startTime2).stop(endTime2);
      const workDay = new WorkDay(testDate, [session1, session2]);
      
      const metrics = service.calculateWorkDayMetrics(workDay);
      
      expect(metrics.totalPauseTime.toSeconds()).toBe(30);
      expect(metrics.pauseDeduction.toMinutes()).toBe(30); // Still applies because > 0 and <= 30 min
    });

    it('should handle exactly threshold pause time', () => {
      const startTime1 = new Date(2024, 2, 15, 9, 0, 0);
      const endTime1 = new Date(2024, 2, 15, 10, 0, 0);
      const startTime2 = new Date(2024, 2, 15, 10, 30, 0); // Exactly 30 minute pause
      const endTime2 = new Date(2024, 2, 15, 11, 30, 0);
      
      const session1 = WorkSession.create(startTime1).stop(endTime1);
      const session2 = WorkSession.create(startTime2).stop(endTime2);
      const workDay = new WorkDay(testDate, [session1, session2]);
      
      expect(service.shouldApplyPauseDeduction(Duration.fromMinutes(30), false)).toBe(true);
      
      const metrics = service.calculateWorkDayMetrics(workDay);
      expect(metrics.pauseDeduction.toMinutes()).toBe(30);
    });
  });

  describe('Complex Scenarios', () => {
    it('should handle multiple sessions with varying pause times', () => {
      // Session 1: 9:00-10:00 (60 min work)
      // Pause 1: 10:00-10:15 (15 min pause)
      // Session 2: 10:15-11:15 (60 min work)  
      // Pause 2: 11:15-12:00 (45 min pause)
      // Session 3: 12:00-13:00 (60 min work)
      // Total work: 180 min, Total pause: 60 min (over threshold, no deduction)
      
      const session1 = WorkSession.create(new Date(2024, 2, 15, 9, 0, 0))
                                  .stop(new Date(2024, 2, 15, 10, 0, 0));
      const session2 = WorkSession.create(new Date(2024, 2, 15, 10, 15, 0))
                                  .stop(new Date(2024, 2, 15, 11, 15, 0));
      const session3 = WorkSession.create(new Date(2024, 2, 15, 12, 0, 0))
                                  .stop(new Date(2024, 2, 15, 13, 0, 0));
      
      const workDay = new WorkDay(testDate, [session1, session2, session3]);
      const metrics = service.calculateWorkDayMetrics(workDay);
      
      expect(metrics.totalWorkTime.toMinutes()).toBe(180);
      expect(metrics.totalPauseTime.toMinutes()).toBe(60); // 15 + 45
      expect(metrics.pauseDeduction.isZero()).toBe(true); // No deduction because total pause > 30 min
      expect(metrics.effectiveWorkTime.toMinutes()).toBe(180);
    });

    it('should handle work day at exactly 10 hours', () => {
      const startTime = new Date(2024, 2, 15, 8, 0, 0);
      const endTime = new Date(2024, 2, 15, 18, 0, 0); // Exactly 10 hours
      const session = WorkSession.create(startTime).stop(endTime);
      const workDay = new WorkDay(testDate, [session]);
      
      const metrics = service.calculateWorkDayMetrics(workDay);
      
      expect(metrics.effectiveWorkTime.toHours()).toBe(10);
      expect(metrics.remainingTime.isZero()).toBe(true);
      expect(metrics.isComplete).toBe(true);
      expect(service.calculateProgressPercentage(metrics.effectiveWorkTime)).toBe(100);
    });
  });
});