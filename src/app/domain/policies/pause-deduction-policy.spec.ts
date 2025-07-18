/**
 * @fileoverview Pause deduction policy tests.
 * @author Work Timer Application
 */

import { TestBed } from '@angular/core/testing';
import { PauseDeductionPolicy } from './pause-deduction-policy';
import { WorkDay } from '../entities/work-day';
import { WorkSession } from '../entities/work-session';
import { Duration } from '../value-objects/duration';
import { WorkDayDate } from '../value-objects/work-day-date';

describe('PauseDeductionPolicy', () => {
  let policy: PauseDeductionPolicy;
  const testDate = WorkDayDate.fromDate(new Date(2024, 2, 15)); // March 15, 2024

  beforeEach(() => {
    TestBed.configureTestingModule({});
    policy = TestBed.inject(PauseDeductionPolicy);
  });

  describe('Policy Configuration', () => {
    it('should be created', () => {
      expect(policy).toBeTruthy();
    });

    it('should have correct policy constants', () => {
      expect(policy.getThreshold().toMinutes()).toBe(30);
      expect(policy.getDeductionAmount().toMinutes()).toBe(30);
    });

    it('should provide policy explanation', () => {
      const explanation = policy.getDeductionExplanation();
      expect(explanation).toContain('0-30 minutes');
      expect(explanation).toContain('30 minutes will be deducted');
      expect(explanation).toContain('once per day');
    });
  });

  describe('Deduction Evaluation', () => {
    it('should not apply deduction for work day with no pauses', () => {
      const startTime = new Date(2024, 2, 15, 9, 0, 0);
      const endTime = new Date(2024, 2, 15, 10, 0, 0);
      const session = WorkSession.create(startTime).stop(endTime);
      const workDay = new WorkDay(testDate, [session]);
      
      const result = policy.evaluateDeduction(workDay);
      
      expect(result.shouldApplyDeduction).toBe(false);
      expect(result.deductionAmount.isZero()).toBe(true);
      expect(result.reason).toBe('No pause time recorded');
    });

    it('should apply deduction for pause time within threshold', () => {
      const startTime1 = new Date(2024, 2, 15, 9, 0, 0);
      const endTime1 = new Date(2024, 2, 15, 10, 0, 0);
      const startTime2 = new Date(2024, 2, 15, 10, 15, 0); // 15 minute pause
      const endTime2 = new Date(2024, 2, 15, 11, 15, 0);
      
      const session1 = WorkSession.create(startTime1).stop(endTime1);
      const session2 = WorkSession.create(startTime2).stop(endTime2);
      const workDay = new WorkDay(testDate, [session1, session2]);
      
      const result = policy.evaluateDeduction(workDay);
      
      expect(result.shouldApplyDeduction).toBe(true);
      expect(result.deductionAmount.toMinutes()).toBe(30);
      expect(result.reason).toContain('Total pause time (00:15:00) is within the 00:30:00 threshold');
    });

    it('should apply deduction for pause time exactly at threshold', () => {
      const startTime1 = new Date(2024, 2, 15, 9, 0, 0);
      const endTime1 = new Date(2024, 2, 15, 10, 0, 0);
      const startTime2 = new Date(2024, 2, 15, 10, 30, 0); // Exactly 30 minute pause
      const endTime2 = new Date(2024, 2, 15, 11, 30, 0);
      
      const session1 = WorkSession.create(startTime1).stop(endTime1);
      const session2 = WorkSession.create(startTime2).stop(endTime2);
      const workDay = new WorkDay(testDate, [session1, session2]);
      
      const result = policy.evaluateDeduction(workDay);
      
      expect(result.shouldApplyDeduction).toBe(true);
      expect(result.deductionAmount.toMinutes()).toBe(30);
      expect(result.reason).toContain('Total pause time (00:30:00) is within the 00:30:00 threshold');
    });

    it('should not apply deduction for pause time over threshold', () => {
      const startTime1 = new Date(2024, 2, 15, 9, 0, 0);
      const endTime1 = new Date(2024, 2, 15, 10, 0, 0);
      const startTime2 = new Date(2024, 2, 15, 10, 45, 0); // 45 minute pause (over threshold)
      const endTime2 = new Date(2024, 2, 15, 11, 45, 0);
      
      const session1 = WorkSession.create(startTime1).stop(endTime1);
      const session2 = WorkSession.create(startTime2).stop(endTime2);
      const workDay = new WorkDay(testDate, [session1, session2]);
      
      const result = policy.evaluateDeduction(workDay);
      
      expect(result.shouldApplyDeduction).toBe(false);
      expect(result.deductionAmount.isZero()).toBe(true);
      expect(result.reason).toContain('Total pause time (00:45:00) exceeds the 00:30:00 threshold');
    });

    it('should not apply deduction when already applied', () => {
      const startTime1 = new Date(2024, 2, 15, 9, 0, 0);
      const endTime1 = new Date(2024, 2, 15, 10, 0, 0);
      const startTime2 = new Date(2024, 2, 15, 10, 15, 0); // 15 minute pause
      const endTime2 = new Date(2024, 2, 15, 11, 15, 0);
      
      const session1 = WorkSession.create(startTime1).stop(endTime1);
      const session2 = WorkSession.create(startTime2).stop(endTime2);
      const workDay = new WorkDay(testDate, [session1, session2], null, undefined, true); // deduction already applied
      
      const result = policy.evaluateDeduction(workDay);
      
      expect(result.shouldApplyDeduction).toBe(false);
      expect(result.deductionAmount.toMinutes()).toBe(30); // Shows what was deducted
      expect(result.reason).toBe('Pause deduction has already been applied for this work day');
    });
  });

  describe('Can Apply Deduction', () => {
    it('should return true when deduction can be applied', () => {
      const startTime1 = new Date(2024, 2, 15, 9, 0, 0);
      const endTime1 = new Date(2024, 2, 15, 10, 0, 0);
      const startTime2 = new Date(2024, 2, 15, 10, 20, 0); // 20 minute pause
      const endTime2 = new Date(2024, 2, 15, 11, 20, 0);
      
      const session1 = WorkSession.create(startTime1).stop(endTime1);
      const session2 = WorkSession.create(startTime2).stop(endTime2);
      const workDay = new WorkDay(testDate, [session1, session2]);
      
      expect(policy.canApplyDeduction(workDay)).toBe(true);
    });

    it('should return false when deduction cannot be applied', () => {
      const startTime1 = new Date(2024, 2, 15, 9, 0, 0);
      const endTime1 = new Date(2024, 2, 15, 10, 0, 0);
      const startTime2 = new Date(2024, 2, 15, 10, 45, 0); // 45 minute pause (over threshold)
      const endTime2 = new Date(2024, 2, 15, 11, 45, 0);
      
      const session1 = WorkSession.create(startTime1).stop(endTime1);
      const session2 = WorkSession.create(startTime2).stop(endTime2);
      const workDay = new WorkDay(testDate, [session1, session2]);
      
      expect(policy.canApplyDeduction(workDay)).toBe(false);
    });

    it('should return false when deduction already applied', () => {
      const workDay = new WorkDay(testDate, [], null, undefined, true);
      expect(policy.canApplyDeduction(workDay)).toBe(false);
    });
  });

  describe('Deduction Capping Logic', () => {
    it('should cap deduction at total work time when work time is less than 30 minutes', () => {
      // This is the critical edge case reported in the issue
      const startTime1 = new Date(2024, 2, 15, 9, 0, 0);
      const endTime1 = new Date(2024, 2, 15, 9, 1, 7); // 1 minute 7 seconds work
      const startTime2 = new Date(2024, 2, 15, 9, 1, 19); // 12 second pause
      const endTime2 = new Date(2024, 2, 15, 9, 2, 19);
      
      const session1 = WorkSession.create(startTime1).stop(endTime1);
      const session2 = WorkSession.create(startTime2).stop(endTime2);
      const workDay = new WorkDay(testDate, [session1, session2]);
      
      const result = policy.evaluateDeduction(workDay);
      
      expect(result.shouldApplyDeduction).toBe(true);
      // Deduction should be capped at total work time (1:07 + 1:00 = 2:07)
      const totalWorkTime = workDay.calculateTotalWorkTime();
      expect(result.deductionAmount.equals(totalWorkTime)).toBe(true);
      expect(result.deductionAmount.isLessThan(policy.getDeductionAmount())).toBe(true);
      expect(result.reason).toContain('Deduction capped at total work time');
    });

    it('should apply full deduction when work time exceeds 30 minutes', () => {
      const startTime1 = new Date(2024, 2, 15, 9, 0, 0);
      const endTime1 = new Date(2024, 2, 15, 10, 0, 0); // 60 minutes work
      const startTime2 = new Date(2024, 2, 15, 10, 15, 0); // 15 minute pause
      const endTime2 = new Date(2024, 2, 15, 11, 15, 0);
      
      const session1 = WorkSession.create(startTime1).stop(endTime1);
      const session2 = WorkSession.create(startTime2).stop(endTime2);
      const workDay = new WorkDay(testDate, [session1, session2]);
      
      const result = policy.evaluateDeduction(workDay);
      
      expect(result.shouldApplyDeduction).toBe(true);
      expect(result.deductionAmount.toMinutes()).toBe(30); // Full 30-minute deduction
      expect(result.deductionAmount.equals(policy.getDeductionAmount())).toBe(true);
    });
  });

  describe('Edge Cases', () => {
    it('should handle very short pause times', () => {
      const startTime1 = new Date(2024, 2, 15, 9, 0, 0);
      const endTime1 = new Date(2024, 2, 15, 10, 0, 0);
      const startTime2 = new Date(2024, 2, 15, 10, 0, 30); // 30 second pause
      const endTime2 = new Date(2024, 2, 15, 11, 0, 30);
      
      const session1 = WorkSession.create(startTime1).stop(endTime1);
      const session2 = WorkSession.create(startTime2).stop(endTime2);
      const workDay = new WorkDay(testDate, [session1, session2]);
      
      const result = policy.evaluateDeduction(workDay);
      
      expect(result.shouldApplyDeduction).toBe(true);
      expect(result.reason).toContain('Total pause time (00:00:30) is within the 00:30:00 threshold');
    });

    it('should handle pause time just over threshold', () => {
      const startTime1 = new Date(2024, 2, 15, 9, 0, 0);
      const endTime1 = new Date(2024, 2, 15, 10, 0, 0);
      const startTime2 = new Date(2024, 2, 15, 10, 30, 1); // 30 minutes and 1 second pause
      const endTime2 = new Date(2024, 2, 15, 11, 30, 1);
      
      const session1 = WorkSession.create(startTime1).stop(endTime1);
      const session2 = WorkSession.create(startTime2).stop(endTime2);
      const workDay = new WorkDay(testDate, [session1, session2]);
      
      const result = policy.evaluateDeduction(workDay);
      
      expect(result.shouldApplyDeduction).toBe(false);
      expect(result.reason).toContain('Total pause time (00:30:01) exceeds the 00:30:00 threshold');
    });

    it('should handle multiple small pauses that sum within threshold', () => {
      // Three sessions with 10-minute pauses each (total 20 minutes pause)
      const startTime1 = new Date(2024, 2, 15, 9, 0, 0);
      const endTime1 = new Date(2024, 2, 15, 10, 0, 0);
      const startTime2 = new Date(2024, 2, 15, 10, 10, 0); // 10 min pause
      const endTime2 = new Date(2024, 2, 15, 11, 0, 0);
      const startTime3 = new Date(2024, 2, 15, 11, 10, 0); // 10 min pause
      const endTime3 = new Date(2024, 2, 15, 12, 0, 0);
      
      const session1 = WorkSession.create(startTime1).stop(endTime1);
      const session2 = WorkSession.create(startTime2).stop(endTime2);
      const session3 = WorkSession.create(startTime3).stop(endTime3);
      const workDay = new WorkDay(testDate, [session1, session2, session3]);
      
      const result = policy.evaluateDeduction(workDay);
      
      expect(result.shouldApplyDeduction).toBe(true);
      expect(result.reason).toContain('Total pause time (00:20:00) is within the 00:30:00 threshold');
    });

    it('should handle multiple small pauses that sum over threshold', () => {
      // Three sessions with 15-minute pauses each (total 30 minutes pause)
      const startTime1 = new Date(2024, 2, 15, 9, 0, 0);
      const endTime1 = new Date(2024, 2, 15, 10, 0, 0);
      const startTime2 = new Date(2024, 2, 15, 10, 15, 0); // 15 min pause
      const endTime2 = new Date(2024, 2, 15, 11, 0, 0);
      const startTime3 = new Date(2024, 2, 15, 11, 16, 0); // 16 min pause (total 31 min)
      const endTime3 = new Date(2024, 2, 15, 12, 0, 0);
      
      const session1 = WorkSession.create(startTime1).stop(endTime1);
      const session2 = WorkSession.create(startTime2).stop(endTime2);
      const session3 = WorkSession.create(startTime3).stop(endTime3);
      const workDay = new WorkDay(testDate, [session1, session2, session3]);
      
      const result = policy.evaluateDeduction(workDay);
      
      expect(result.shouldApplyDeduction).toBe(false);
      expect(result.reason).toContain('Total pause time (00:31:00) exceeds the 00:30:00 threshold');
    });

    it('should handle work day with single session (no pauses)', () => {
      const startTime = new Date(2024, 2, 15, 9, 0, 0);
      const endTime = new Date(2024, 2, 15, 17, 0, 0); // 8 hour session
      const session = WorkSession.create(startTime).stop(endTime);
      const workDay = new WorkDay(testDate, [session]);
      
      const result = policy.evaluateDeduction(workDay);
      
      expect(result.shouldApplyDeduction).toBe(false);
      expect(result.deductionAmount.isZero()).toBe(true);
      expect(result.reason).toBe('No pause time recorded');
    });
  });

  describe('Business Logic Consistency', () => {
    it('should be consistent with 30-minute rule description', () => {
      // Test that the policy correctly implements the 30-minute rule:
      // "If total pause time between work sessions is 0-30 minutes, 
      //  30 minutes is deducted from the total work time"
      
      const testCases = [
        { pauseMinutes: 0, shouldApply: false, description: 'no pause' },
        { pauseMinutes: 1, shouldApply: true, description: '1 minute pause' },
        { pauseMinutes: 15, shouldApply: true, description: '15 minute pause' },
        { pauseMinutes: 29, shouldApply: true, description: '29 minute pause' },
        { pauseMinutes: 30, shouldApply: true, description: 'exactly 30 minute pause' },
        { pauseMinutes: 31, shouldApply: false, description: '31 minute pause' },
        { pauseMinutes: 45, shouldApply: false, description: '45 minute pause' },
        { pauseMinutes: 60, shouldApply: false, description: '60 minute pause' }
      ];
      
      testCases.forEach(testCase => {
        if (testCase.pauseMinutes === 0) {
          // Single session, no pause
          const session = WorkSession.create(new Date(2024, 2, 15, 9, 0, 0))
                                    .stop(new Date(2024, 2, 15, 10, 0, 0));
          const workDay = new WorkDay(testDate, [session]);
          const result = policy.evaluateDeduction(workDay);
          expect(result.shouldApplyDeduction).toBe(testCase.shouldApply, 
            `Failed for ${testCase.description}`);
        } else {
          // Two sessions with specified pause
          const session1 = WorkSession.create(new Date(2024, 2, 15, 9, 0, 0))
                                      .stop(new Date(2024, 2, 15, 10, 0, 0));
          const pauseEndTime = new Date(2024, 2, 15, 10, testCase.pauseMinutes, 0);
          const session2 = WorkSession.create(pauseEndTime)
                                      .stop(new Date(pauseEndTime.getTime() + 60 * 60 * 1000));
          const workDay = new WorkDay(testDate, [session1, session2]);
          const result = policy.evaluateDeduction(workDay);
          expect(result.shouldApplyDeduction).toBe(testCase.shouldApply, 
            `Failed for ${testCase.description}`);
        }
      });
    });

    it('should return full 30-minute deduction when work time exceeds deduction amount', () => {
      // Total work time: 2 hours (60 + 60 minutes), so full deduction applies
      const session1 = WorkSession.create(new Date(2024, 2, 15, 9, 0, 0))
                                  .stop(new Date(2024, 2, 15, 10, 0, 0));
      const session2 = WorkSession.create(new Date(2024, 2, 15, 10, 15, 0))
                                  .stop(new Date(2024, 2, 15, 11, 15, 0));
      const workDay = new WorkDay(testDate, [session1, session2]);
      
      const result = policy.evaluateDeduction(workDay);
      
      expect(result.shouldApplyDeduction).toBe(true);
      expect(result.deductionAmount.toMinutes()).toBe(30);
      expect(result.deductionAmount.equals(policy.getDeductionAmount())).toBe(true);
    });
  });
});