/**
 * @fileoverview Time-related testing utilities.
 * @author Work Timer Application
 */

import { Duration } from '../../domain/value-objects/duration';
import { WorkDayDate } from '../../domain/value-objects/work-day-date';

/**
 * Creates a Date object using local time to avoid timezone issues in tests
 */
export function createLocalDate(year: number, month: number, day: number, hour = 0, minute = 0, second = 0, millisecond = 0): Date {
  return new Date(year, month - 1, day, hour, minute, second, millisecond); // month is 0-indexed
}

/**
 * Creates a WorkDayDate for testing with local time
 */
export function createTestWorkDayDate(year: number, month: number, day: number): WorkDayDate {
  return WorkDayDate.fromDate(createLocalDate(year, month, day));
}

/**
 * Creates a Duration from various time units for testing
 */
export class DurationBuilder {
  private _milliseconds = 0;

  static create(): DurationBuilder {
    return new DurationBuilder();
  }

  hours(hours: number): DurationBuilder {
    this._milliseconds += hours * 60 * 60 * 1000;
    return this;
  }

  minutes(minutes: number): DurationBuilder {
    this._milliseconds += minutes * 60 * 1000;
    return this;
  }

  seconds(seconds: number): DurationBuilder {
    this._milliseconds += seconds * 1000;
    return this;
  }

  milliseconds(ms: number): DurationBuilder {
    this._milliseconds += ms;
    return this;
  }

  build(): Duration {
    return Duration.fromMilliseconds(this._milliseconds);
  }
}

/**
 * Common durations used in tests
 */
export const TestDurations = {
  ZERO: Duration.zero(),
  FIFTEEN_MINUTES: Duration.fromMinutes(15),
  THIRTY_MINUTES: Duration.fromMinutes(30),
  FORTY_FIVE_MINUTES: Duration.fromMinutes(45),
  ONE_HOUR: Duration.fromHours(1),
  TWO_HOURS: Duration.fromHours(2),
  TEN_HOURS: Duration.fromHours(10),
  ONE_SECOND: Duration.fromSeconds(1),
  ONE_MINUTE: Duration.fromMinutes(1)
};

/**
 * Common dates used in tests
 */
export const TestDates = {
  MARCH_15_2024: createTestWorkDayDate(2024, 3, 15),
  MARCH_16_2024: createTestWorkDayDate(2024, 3, 16),
  JANUARY_1_2024: createTestWorkDayDate(2024, 1, 1),
  DECEMBER_31_2024: createTestWorkDayDate(2024, 12, 31)
};

/**
 * Common times used in tests (all March 15, 2024)
 */
export const TestTimes = {
  NINE_AM: createLocalDate(2024, 3, 15, 9, 0, 0),
  TEN_AM: createLocalDate(2024, 3, 15, 10, 0, 0),
  TEN_FIFTEEN_AM: createLocalDate(2024, 3, 15, 10, 15, 0),
  TEN_THIRTY_AM: createLocalDate(2024, 3, 15, 10, 30, 0),
  ELEVEN_AM: createLocalDate(2024, 3, 15, 11, 0, 0),
  NOON: createLocalDate(2024, 3, 15, 12, 0, 0),
  ONE_PM: createLocalDate(2024, 3, 15, 13, 0, 0),
  FIVE_PM: createLocalDate(2024, 3, 15, 17, 0, 0),
  SIX_PM: createLocalDate(2024, 3, 15, 18, 0, 0)
};

/**
 * Creates a sequence of times with specified intervals
 */
export function createTimeSequence(
  startTime: Date, 
  intervalMinutes: number, 
  count: number
): Date[] {
  const times: Date[] = [];
  let currentTime = new Date(startTime);
  
  for (let i = 0; i < count; i++) {
    times.push(new Date(currentTime));
    currentTime = new Date(currentTime.getTime() + intervalMinutes * 60 * 1000);
  }
  
  return times;
}

/**
 * Calculates the duration between two dates
 */
export function calculateDuration(startTime: Date, endTime: Date): Duration {
  return Duration.fromMilliseconds(endTime.getTime() - startTime.getTime());
}

/**
 * Advances a date by the specified duration
 */
export function advanceTime(date: Date, duration: Duration): Date {
  return new Date(date.getTime() + duration.milliseconds);
}

/**
 * Mock timer utilities for testing
 */
export class MockTimer {
  private callbacks: Map<number, () => void> = new Map();
  private timeouts: Map<number, { callback: () => void; delay: number; startTime: number }> = new Map();
  private currentTime = Date.now();
  private nextId = 1;

  setInterval(callback: () => void, delay: number): number {
    const id = this.nextId++;
    this.callbacks.set(id, callback);
    return id;
  }

  setTimeout(callback: () => void, delay: number): number {
    const id = this.nextId++;
    this.timeouts.set(id, { callback, delay, startTime: this.currentTime });
    return id;
  }

  clearInterval(id: number): void {
    this.callbacks.delete(id);
  }

  clearTimeout(id: number): void {
    this.timeouts.delete(id);
  }

  tick(milliseconds: number): void {
    this.currentTime += milliseconds;
    
    // Trigger expired timeouts
    for (const [id, timeout] of this.timeouts.entries()) {
      if (this.currentTime - timeout.startTime >= timeout.delay) {
        timeout.callback();
        this.timeouts.delete(id);
      }
    }
    
    // Trigger intervals (simplified - just call them)
    for (const callback of this.callbacks.values()) {
      callback();
    }
  }

  reset(): void {
    this.callbacks.clear();
    this.timeouts.clear();
    this.currentTime = Date.now();
    this.nextId = 1;
  }
}