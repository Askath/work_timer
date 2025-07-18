/**
 * @fileoverview Reporting application service for data queries and analytics.
 * @author Work Timer Application
 */

import { Injectable } from '@angular/core';
import { 
  WorkDay, 
  WorkDayDate, 
  Duration, 
  TimeCalculationService,
  WorkDayCalculations 
} from '../../domain';

export interface DailyReport {
  date: WorkDayDate;
  sessionCount: number;
  totalWorkTime: Duration;
  totalPauseTime: Duration;
  pauseDeduction: Duration;
  effectiveWorkTime: Duration;
  remainingTime: Duration;
  isComplete: boolean;
  progressPercentage: number;
  formattedTimes: {
    totalWorkTime: string;
    totalPauseTime: string;
    pauseDeduction: string;
    effectiveWorkTime: string;
    remainingTime: string;
  };
}

export interface WeeklyReport {
  startDate: WorkDayDate;
  endDate: WorkDayDate;
  dailyReports: DailyReport[];
  totalWorkTime: Duration;
  totalEffectiveTime: Duration;
  averageDailyWork: Duration;
  daysWorked: number;
  completedDays: number;
}

@Injectable({
  providedIn: 'root'
})
export class ReportingApplicationService {

  constructor(private timeCalculationService: TimeCalculationService) {}

  generateDailyReport(workDay: WorkDay): DailyReport {
    const calculations = this.timeCalculationService.calculateWorkDayMetrics(workDay);
    const progressPercentage = this.timeCalculationService.calculateProgressPercentage(calculations.effectiveWorkTime);

    return {
      date: workDay.date,
      sessionCount: workDay.sessionCount,
      totalWorkTime: calculations.totalWorkTime,
      totalPauseTime: calculations.totalPauseTime,
      pauseDeduction: calculations.pauseDeduction,
      effectiveWorkTime: calculations.effectiveWorkTime,
      remainingTime: calculations.remainingTime,
      isComplete: calculations.isComplete,
      progressPercentage,
      formattedTimes: {
        totalWorkTime: calculations.totalWorkTime.format(),
        totalPauseTime: calculations.totalPauseTime.format(),
        pauseDeduction: calculations.pauseDeduction.format(),
        effectiveWorkTime: calculations.effectiveWorkTime.format(),
        remainingTime: calculations.remainingTime.format()
      }
    };
  }

  generateWeeklyReport(workDays: WorkDay[]): WeeklyReport {
    if (workDays.length === 0) {
      const today = WorkDayDate.today();
      return {
        startDate: today,
        endDate: today,
        dailyReports: [],
        totalWorkTime: Duration.zero(),
        totalEffectiveTime: Duration.zero(),
        averageDailyWork: Duration.zero(),
        daysWorked: 0,
        completedDays: 0
      };
    }

    const dailyReports = workDays.map(workDay => this.generateDailyReport(workDay));
    const sortedReports = dailyReports.sort((a, b) => 
      a.date.toISOString().localeCompare(b.date.toISOString())
    );

    const totalWorkTime = dailyReports.reduce(
      (total, report) => total.add(report.totalWorkTime),
      Duration.zero()
    );

    const totalEffectiveTime = dailyReports.reduce(
      (total, report) => total.add(report.effectiveWorkTime),
      Duration.zero()
    );

    const daysWorked = dailyReports.filter(report => 
      report.totalWorkTime.isGreaterThan(Duration.zero())
    ).length;

    const completedDays = dailyReports.filter(report => report.isComplete).length;

    const averageDailyWork = daysWorked > 0 
      ? Duration.fromMilliseconds(totalEffectiveTime.milliseconds / daysWorked)
      : Duration.zero();

    return {
      startDate: sortedReports[0].date,
      endDate: sortedReports[sortedReports.length - 1].date,
      dailyReports: sortedReports,
      totalWorkTime,
      totalEffectiveTime,
      averageDailyWork,
      daysWorked,
      completedDays
    };
  }

  getProductivityInsights(workDays: WorkDay[]): {
    mostProductiveDay: { date: WorkDayDate; effectiveTime: Duration } | null;
    leastProductiveDay: { date: WorkDayDate; effectiveTime: Duration } | null;
    averageSessionsPerDay: number;
    totalPauseDeductions: Duration;
    streakOfCompletedDays: number;
  } {
    if (workDays.length === 0) {
      return {
        mostProductiveDay: null,
        leastProductiveDay: null,
        averageSessionsPerDay: 0,
        totalPauseDeductions: Duration.zero(),
        streakOfCompletedDays: 0
      };
    }

    const dailyReports = workDays.map(workDay => this.generateDailyReport(workDay));
    const workingDays = dailyReports.filter(report => 
      report.totalWorkTime.isGreaterThan(Duration.zero())
    );

    let mostProductiveDay = null;
    let leastProductiveDay = null;

    if (workingDays.length > 0) {
      mostProductiveDay = workingDays.reduce((most, current) => 
        current.effectiveWorkTime.isGreaterThan(most.effectiveWorkTime) ? current : most
      );

      leastProductiveDay = workingDays.reduce((least, current) => 
        current.effectiveWorkTime.isLessThan(least.effectiveWorkTime) ? current : least
      );
    }

    const averageSessionsPerDay = workingDays.length > 0 
      ? workingDays.reduce((sum, report) => sum + report.sessionCount, 0) / workingDays.length
      : 0;

    const totalPauseDeductions = dailyReports.reduce(
      (total, report) => total.add(report.pauseDeduction),
      Duration.zero()
    );

    // Calculate streak of completed days (from most recent)
    const sortedByDate = dailyReports.sort((a, b) => 
      b.date.toISOString().localeCompare(a.date.toISOString())
    );
    
    let streakOfCompletedDays = 0;
    for (const report of sortedByDate) {
      if (report.isComplete) {
        streakOfCompletedDays++;
      } else {
        break;
      }
    }

    return {
      mostProductiveDay: mostProductiveDay ? {
        date: mostProductiveDay.date,
        effectiveTime: mostProductiveDay.effectiveWorkTime
      } : null,
      leastProductiveDay: leastProductiveDay ? {
        date: leastProductiveDay.date,
        effectiveTime: leastProductiveDay.effectiveWorkTime
      } : null,
      averageSessionsPerDay,
      totalPauseDeductions,
      streakOfCompletedDays
    };
  }

  formatDurationForDisplay(duration: Duration): string {
    return duration.format();
  }

  getTimeUntilDailyLimit(effectiveWorkTime: Duration): Duration {
    const maxWorkTime = this.timeCalculationService.getMaxWorkTime();
    return maxWorkTime.subtract(effectiveWorkTime);
  }

  calculateEfficiency(totalWorkTime: Duration, effectiveWorkTime: Duration): number {
    if (totalWorkTime.isZero()) {
      return 100;
    }
    return (effectiveWorkTime.milliseconds / totalWorkTime.milliseconds) * 100;
  }
}