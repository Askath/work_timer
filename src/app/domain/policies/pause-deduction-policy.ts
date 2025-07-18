/**
 * @fileoverview Pause deduction policy implementing the 30-minute rule.
 * @author Work Timer Application
 */

import { Injectable } from '@angular/core';
import { Duration } from '../value-objects/duration';
import { WorkDay } from '../entities/work-day';

export interface PauseDeductionResult {
  shouldApplyDeduction: boolean;
  deductionAmount: Duration;
  reason: string;
}

@Injectable({
  providedIn: 'root'
})
export class PauseDeductionPolicy {
  private readonly PAUSE_THRESHOLD = Duration.fromMinutes(30);
  private readonly DEDUCTION_AMOUNT = Duration.fromMinutes(30);

  evaluateDeduction(workDay: WorkDay): PauseDeductionResult {
    if (workDay.pauseDeductionApplied) {
      return {
        shouldApplyDeduction: false,
        deductionAmount: this.DEDUCTION_AMOUNT,
        reason: 'Pause deduction has already been applied for this work day'
      };
    }

    const totalPauseTime = workDay.calculateTotalPauseTime();
    const totalWorkTime = workDay.calculateTotalWorkTime();

    if (totalPauseTime.isZero()) {
      return {
        shouldApplyDeduction: false,
        deductionAmount: Duration.zero(),
        reason: 'No pause time recorded'
      };
    }

    if (totalPauseTime.isLessThanOrEqual(this.PAUSE_THRESHOLD)) {
      const cappedDeduction = Duration.min(this.DEDUCTION_AMOUNT, totalWorkTime);
      return {
        shouldApplyDeduction: true,
        deductionAmount: cappedDeduction,
        reason: `Total pause time (${totalPauseTime.format()}) is within the ${this.PAUSE_THRESHOLD.format()} threshold. Deduction capped at total work time (${totalWorkTime.format()})`
      };
    }

    return {
      shouldApplyDeduction: false,
      deductionAmount: Duration.zero(),
      reason: `Total pause time (${totalPauseTime.format()}) exceeds the ${this.PAUSE_THRESHOLD.format()} threshold`
    };
  }

  canApplyDeduction(workDay: WorkDay): boolean {
    const result = this.evaluateDeduction(workDay);
    return result.shouldApplyDeduction;
  }

  getDeductionAmount(): Duration {
    return this.DEDUCTION_AMOUNT;
  }

  getThreshold(): Duration {
    return this.PAUSE_THRESHOLD;
  }

  getDeductionExplanation(): string {
    return `If total pause time between work sessions is 0-${this.PAUSE_THRESHOLD.toMinutes()} minutes, ` +
           `${this.DEDUCTION_AMOUNT.toMinutes()} minutes will be deducted from the total work time. ` +
           'This deduction is applied only once per day.';
  }
}