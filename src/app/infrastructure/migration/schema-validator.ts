/**
 * @fileoverview Schema validator for ensuring data integrity during migration.
 * @author Work Timer Application
 */

import { Injectable } from '@angular/core';
import { WorkSession, WorkDay, Duration, WorkDayDate } from '../../domain';
import { TimerState, TimeSession, DailyTimeData } from '../../models';

/**
 * Interface for validation results.
 */
export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
}

/**
 * Interface for validation errors.
 */
export interface ValidationError {
  field: string;
  message: string;
  value: any;
  severity: 'error' | 'warning';
}

/**
 * Interface for validation warnings.
 */
export interface ValidationWarning {
  field: string;
  message: string;
  value: any;
}

/**
 * Schema validator for validating data integrity during migration process.
 * Ensures that legacy data conforms to expected formats and business rules.
 */
@Injectable({
  providedIn: 'root'
})
export class SchemaValidator {
  
  /**
   * Validates a legacy timer state object.
   * @param {TimerState} timerState - The timer state to validate
   * @returns {ValidationResult} Validation result
   */
  validateTimerState(timerState: TimerState): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    // Check required fields
    if (timerState.status === undefined || timerState.status === null) {
      errors.push({
        field: 'status',
        message: 'Timer status is required',
        value: timerState.status,
        severity: 'error'
      });
    }

    // Validate numeric fields
    if (typeof timerState.totalWorkTime !== 'number' || timerState.totalWorkTime < 0) {
      errors.push({
        field: 'totalWorkTime',
        message: 'Total work time must be a non-negative number',
        value: timerState.totalWorkTime,
        severity: 'error'
      });
    }

    if (typeof timerState.totalPauseTime !== 'number' || timerState.totalPauseTime < 0) {
      errors.push({
        field: 'totalPauseTime',
        message: 'Total pause time must be a non-negative number',
        value: timerState.totalPauseTime,
        severity: 'error'
      });
    }

    if (typeof timerState.currentSessionTime !== 'number' || timerState.currentSessionTime < 0) {
      errors.push({
        field: 'currentSessionTime',
        message: 'Current session time must be a non-negative number',
        value: timerState.currentSessionTime,
        severity: 'error'
      });
    }

    if (typeof timerState.sessionsCount !== 'number' || timerState.sessionsCount < 0) {
      errors.push({
        field: 'sessionsCount',
        message: 'Sessions count must be a non-negative number',
        value: timerState.sessionsCount,
        severity: 'error'
      });
    }

    // Validate date fields
    if (timerState.startTime && !(timerState.startTime instanceof Date)) {
      errors.push({
        field: 'startTime',
        message: 'Start time must be a valid Date object',
        value: timerState.startTime,
        severity: 'error'
      });
    }

    if (timerState.currentSessionStart && !(timerState.currentSessionStart instanceof Date)) {
      errors.push({
        field: 'currentSessionStart',
        message: 'Current session start must be a valid Date object',
        value: timerState.currentSessionStart,
        severity: 'error'
      });
    }

    // Business rule validations
    if (timerState.totalWorkTime > 24 * 60 * 60 * 1000) { // 24 hours
      warnings.push({
        field: 'totalWorkTime',
        message: 'Total work time exceeds 24 hours, which may indicate data corruption',
        value: timerState.totalWorkTime
      });
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Validates a legacy time session object.
   * @param {TimeSession} session - The session to validate
   * @returns {ValidationResult} Validation result
   */
  validateTimeSession(session: TimeSession): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    // Check required fields
    if (!session.id) {
      errors.push({
        field: 'id',
        message: 'Session ID is required',
        value: session.id,
        severity: 'error'
      });
    }

    if (!session.startTime || !(session.startTime instanceof Date)) {
      errors.push({
        field: 'startTime',
        message: 'Start time must be a valid Date object',
        value: session.startTime,
        severity: 'error'
      });
    }

    if (!session.endTime || !(session.endTime instanceof Date)) {
      errors.push({
        field: 'endTime',
        message: 'End time must be a valid Date object',
        value: session.endTime,
        severity: 'error'
      });
    }

    if (typeof session.duration !== 'number' || session.duration < 0) {
      errors.push({
        field: 'duration',
        message: 'Duration must be a non-negative number',
        value: session.duration,
        severity: 'error'
      });
    }

    if (!session.date) {
      errors.push({
        field: 'date',
        message: 'Date is required',
        value: session.date,
        severity: 'error'
      });
    }

    // Business rule validations
    if (session.startTime && session.endTime && session.startTime >= session.endTime) {
      errors.push({
        field: 'timeRange',
        message: 'Start time must be before end time',
        value: { startTime: session.startTime, endTime: session.endTime },
        severity: 'error'
      });
    }

    if (session.startTime && session.endTime && session.duration) {
      const expectedDuration = session.endTime.getTime() - session.startTime.getTime();
      const tolerance = 1000; // 1 second tolerance
      
      if (Math.abs(session.duration - expectedDuration) > tolerance) {
        warnings.push({
          field: 'duration',
          message: 'Duration does not match calculated time difference',
          value: { duration: session.duration, expected: expectedDuration }
        });
      }
    }

    // Check for extremely long sessions (over 12 hours)
    if (session.duration > 12 * 60 * 60 * 1000) {
      warnings.push({
        field: 'duration',
        message: 'Session duration exceeds 12 hours, which may indicate data corruption',
        value: session.duration
      });
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Validates a legacy daily time data object.
   * @param {DailyTimeData} dailyData - The daily data to validate
   * @returns {ValidationResult} Validation result
   */
  validateDailyTimeData(dailyData: DailyTimeData): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    // Check required fields
    if (!dailyData.date) {
      errors.push({
        field: 'date',
        message: 'Date is required',
        value: dailyData.date,
        severity: 'error'
      });
    }

    // Validate date format (YYYY-MM-DD)
    if (dailyData.date && !/^\d{4}-\d{2}-\d{2}$/.test(dailyData.date)) {
      errors.push({
        field: 'date',
        message: 'Date must be in YYYY-MM-DD format',
        value: dailyData.date,
        severity: 'error'
      });
    }

    // Validate sessions array
    if (!Array.isArray(dailyData.sessions)) {
      errors.push({
        field: 'sessions',
        message: 'Sessions must be an array',
        value: dailyData.sessions,
        severity: 'error'
      });
    }

    // Validate numeric fields
    const numericFields = [
      'totalWorkTime', 'totalPauseTime', 'pauseDeduction', 
      'effectiveWorkTime', 'remainingTime'
    ];

    numericFields.forEach(field => {
      const value = (dailyData as any)[field];
      if (typeof value !== 'number' || value < 0) {
        errors.push({
          field,
          message: `${field} must be a non-negative number`,
          value,
          severity: 'error'
        });
      }
    });

    // Business rule validations
    if (dailyData.effectiveWorkTime > dailyData.totalWorkTime) {
      errors.push({
        field: 'effectiveWorkTime',
        message: 'Effective work time cannot exceed total work time',
        value: { effective: dailyData.effectiveWorkTime, total: dailyData.totalWorkTime },
        severity: 'error'
      });
    }

    if (dailyData.pauseDeduction > dailyData.totalPauseTime) {
      warnings.push({
        field: 'pauseDeduction',
        message: 'Pause deduction exceeds total pause time',
        value: { deduction: dailyData.pauseDeduction, total: dailyData.totalPauseTime }
      });
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Validates a domain WorkSession object.
   * @param {WorkSession} workSession - The work session to validate
   * @returns {ValidationResult} Validation result
   */
  validateWorkSession(workSession: WorkSession): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    try {
      // Validate that the work session has all required properties
      if (!workSession.id) {
        errors.push({
          field: 'id',
          message: 'Work session ID is required',
          value: workSession.id,
          severity: 'error'
        });
      }

      if (!workSession.startTime) {
        errors.push({
          field: 'startTime',
          message: 'Work session start time is required',
          value: workSession.startTime,
          severity: 'error'
        });
      }

      if (!workSession.endTime) {
        errors.push({
          field: 'endTime',
          message: 'Work session end time is required',
          value: workSession.endTime,
          severity: 'error'
        });
      }

      // Validate duration
      if (workSession.duration.isZero()) {
        warnings.push({
          field: 'duration',
          message: 'Work session has zero duration',
          value: workSession.duration.milliseconds
        });
      }

      // Validate date consistency
      if (workSession.startTime && workSession.workDate) {
        const startDate = new Date(workSession.startTime);
        const sessionDate = workSession.workDate.toDate();
        
        if (startDate.toDateString() !== sessionDate.toDateString()) {
          errors.push({
            field: 'date',
            message: 'Session date does not match start time date',
            value: { sessionDate: workSession.workDate.toISOString(), startDate: startDate.toISOString() },
            severity: 'error'
          });
        }
      }

    } catch (error) {
      errors.push({
        field: 'general',
        message: `Work session validation failed: ${error}`,
        value: workSession,
        severity: 'error'
      });
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Validates a domain WorkDay object.
   * @param {WorkDay} workDay - The work day to validate
   * @returns {ValidationResult} Validation result
   */
  validateWorkDay(workDay: WorkDay): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    try {
      // Validate that work day has required properties
      if (!workDay.date) {
        errors.push({
          field: 'date',
          message: 'Work day date is required',
          value: workDay.date,
          severity: 'error'
        });
      }

      if (!Array.isArray(workDay.sessions)) {
        errors.push({
          field: 'sessions',
          message: 'Work day sessions must be an array',
          value: workDay.sessions,
          severity: 'error'
        });
      }

      // Validate that all sessions belong to the same date
      if (workDay.sessions.length > 0) {
        const workDayDate = workDay.date.toISOString();
        const invalidSessions = workDay.sessions.filter(session => 
          session.workDate.toISOString() !== workDayDate
        );

        if (invalidSessions.length > 0) {
          errors.push({
            field: 'sessions',
            message: 'Some sessions do not belong to the work day date',
            value: invalidSessions.map(s => s.id),
            severity: 'error'
          });
        }
      }

      // Validate session ordering
      if (workDay.sessions.length > 1) {
        for (let i = 1; i < workDay.sessions.length; i++) {
          const prevSession = workDay.sessions[i - 1];
          const currSession = workDay.sessions[i];
          
          if (prevSession.startTime >= currSession.startTime) {
            warnings.push({
              field: 'sessions',
              message: 'Sessions are not ordered chronologically',
              value: { prevId: prevSession.id, currId: currSession.id }
            });
            break;
          }
        }
      }

    } catch (error) {
      errors.push({
        field: 'general',
        message: `Work day validation failed: ${error}`,
        value: workDay,
        severity: 'error'
      });
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Validates an array of objects using the appropriate validator.
   * @param {T[]} items - Array of items to validate
   * @param {Function} validator - Validation function
   * @returns {ValidationResult} Aggregated validation result
   */
  validateArray<T>(items: T[], validator: (item: T) => ValidationResult): ValidationResult {
    const allErrors: ValidationError[] = [];
    const allWarnings: ValidationWarning[] = [];

    items.forEach((item, index) => {
      const result = validator(item);
      
      // Prefix field names with array index
      result.errors.forEach(error => {
        allErrors.push({
          ...error,
          field: `[${index}].${error.field}`
        });
      });

      result.warnings.forEach(warning => {
        allWarnings.push({
          ...warning,
          field: `[${index}].${warning.field}`
        });
      });
    });

    return {
      isValid: allErrors.length === 0,
      errors: allErrors,
      warnings: allWarnings
    };
  }

  /**
   * Formats validation results for display.
   * @param {ValidationResult} result - Validation result to format
   * @returns {string} Formatted validation report
   */
  formatValidationReport(result: ValidationResult): string {
    const lines: string[] = [];
    
    lines.push(`Validation Result: ${result.isValid ? 'VALID' : 'INVALID'}`);
    lines.push(`Errors: ${result.errors.length}`);
    lines.push(`Warnings: ${result.warnings.length}`);
    lines.push('');

    if (result.errors.length > 0) {
      lines.push('ERRORS:');
      result.errors.forEach(error => {
        lines.push(`  - ${error.field}: ${error.message}`);
      });
      lines.push('');
    }

    if (result.warnings.length > 0) {
      lines.push('WARNINGS:');
      result.warnings.forEach(warning => {
        lines.push(`  - ${warning.field}: ${warning.message}`);
      });
      lines.push('');
    }

    return lines.join('\n');
  }
}