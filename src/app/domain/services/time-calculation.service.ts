/**
 * @fileoverview Domain service for time calculations.
 * @author Work Timer Application
 */

import { Injectable } from '@angular/core';
import { Duration } from '../value-objects/duration';
import { WorkDay, WorkDayCalculations } from '../entities/work-day';

@Injectable({
  providedIn: 'root'
})
export class TimeCalculationService {
  private readonly MAX_WORK_TIME = Duration.fromHours(10);
  private readonly PAUSE_DEDUCTION_THRESHOLD = Duration.fromMinutes(30);
  private readonly PAUSE_DEDUCTION_AMOUNT = Duration.fromMinutes(30);

  calculateWorkDayMetrics(workDay: WorkDay): WorkDayCalculations {
    const totalWorkTime = workDay.calculateTotalWorkTime();
    const totalPauseTime = workDay.calculateTotalPauseTime();
    const pauseDeduction = this.calculatePauseDeduction(totalPauseTime, workDay.pauseDeductionApplied);
    const effectiveWorkTime = totalWorkTime.subtract(pauseDeduction);
    const remainingTime = this.MAX_WORK_TIME.subtract(effectiveWorkTime);
    const isComplete = effectiveWorkTime.isGreaterThanOrEqual(this.MAX_WORK_TIME);

    return {
      totalWorkTime,
      totalPauseTime,
      pauseDeduction,
      effectiveWorkTime,
      remainingTime,
      isComplete
    };
  }

  private calculatePauseDeduction(totalPauseTime: Duration, deductionAlreadyApplied: boolean): Duration {
    if (deductionAlreadyApplied) {
      return this.PAUSE_DEDUCTION_AMOUNT;
    }

    if (totalPauseTime.isGreaterThan(Duration.zero()) && 
        totalPauseTime.isLessThanOrEqual(this.PAUSE_DEDUCTION_THRESHOLD)) {
      return this.PAUSE_DEDUCTION_AMOUNT;
    }

    return Duration.zero();
  }

  shouldApplyPauseDeduction(totalPauseTime: Duration, deductionAlreadyApplied: boolean): boolean {
    return !deductionAlreadyApplied && 
           totalPauseTime.isGreaterThan(Duration.zero()) && 
           totalPauseTime.isLessThanOrEqual(this.PAUSE_DEDUCTION_THRESHOLD);
  }

  calculateProgressPercentage(effectiveWorkTime: Duration): number {
    const percentage = (effectiveWorkTime.milliseconds / this.MAX_WORK_TIME.milliseconds) * 100;
    return Math.min(100, Math.max(0, percentage));
  }

  isWorkDayComplete(effectiveWorkTime: Duration): boolean {
    return effectiveWorkTime.isGreaterThanOrEqual(this.MAX_WORK_TIME);
  }

  getRemainingTimeFormatted(remainingTime: Duration): string {
    return remainingTime.format();
  }

  getMaxWorkTime(): Duration {
    return this.MAX_WORK_TIME;
  }

  getPauseDeductionThreshold(): Duration {
    return this.PAUSE_DEDUCTION_THRESHOLD;
  }

  getPauseDeductionAmount(): Duration {
    return this.PAUSE_DEDUCTION_AMOUNT;
  }
}