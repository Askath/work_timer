/**
 * @fileoverview Duration value object tests.
 * @author Work Timer Application
 */

import { Duration } from './duration';

describe('Duration', () => {
  describe('Static Factory Methods', () => {
    it('should create duration from milliseconds', () => {
      const duration = Duration.fromMilliseconds(5000);
      expect(duration.milliseconds).toBe(5000);
    });

    it('should create duration from seconds', () => {
      const duration = Duration.fromSeconds(30);
      expect(duration.milliseconds).toBe(30000);
    });

    it('should create duration from minutes', () => {
      const duration = Duration.fromMinutes(5);
      expect(duration.milliseconds).toBe(300000);
    });

    it('should create duration from hours', () => {
      const duration = Duration.fromHours(2);
      expect(duration.milliseconds).toBe(7200000);
    });

    it('should create zero duration', () => {
      const duration = Duration.zero();
      expect(duration.milliseconds).toBe(0);
    });

    it('should throw error for negative milliseconds', () => {
      expect(() => Duration.fromMilliseconds(-1000)).toThrowError('Duration cannot be negative.');
    });
  });

  describe('Arithmetic Operations', () => {
    it('should add two durations correctly', () => {
      const duration1 = Duration.fromMinutes(30);
      const duration2 = Duration.fromMinutes(15);
      const result = duration1.add(duration2);
      
      expect(result.toMinutes()).toBe(45);
    });

    it('should subtract two durations correctly', () => {
      const duration1 = Duration.fromMinutes(45);
      const duration2 = Duration.fromMinutes(15);
      const result = duration1.subtract(duration2);
      
      expect(result.toMinutes()).toBe(30);
    });

    it('should not go below zero when subtracting', () => {
      const duration1 = Duration.fromMinutes(15);
      const duration2 = Duration.fromMinutes(30);
      const result = duration1.subtract(duration2);
      
      expect(result.milliseconds).toBe(0);
    });
  });

  describe('Comparison Operations', () => {
    const duration30min = Duration.fromMinutes(30);
    const duration45min = Duration.fromMinutes(45);
    const duration30minCopy = Duration.fromMinutes(30);

    it('should compare greater than correctly', () => {
      expect(duration45min.isGreaterThan(duration30min)).toBe(true);
      expect(duration30min.isGreaterThan(duration45min)).toBe(false);
      expect(duration30min.isGreaterThan(duration30minCopy)).toBe(false);
    });

    it('should compare less than correctly', () => {
      expect(duration30min.isLessThan(duration45min)).toBe(true);
      expect(duration45min.isLessThan(duration30min)).toBe(false);
      expect(duration30min.isLessThan(duration30minCopy)).toBe(false);
    });

    it('should compare greater than or equal correctly', () => {
      expect(duration45min.isGreaterThanOrEqual(duration30min)).toBe(true);
      expect(duration30min.isGreaterThanOrEqual(duration30minCopy)).toBe(true);
      expect(duration30min.isGreaterThanOrEqual(duration45min)).toBe(false);
    });

    it('should compare less than or equal correctly', () => {
      expect(duration30min.isLessThanOrEqual(duration45min)).toBe(true);
      expect(duration30min.isLessThanOrEqual(duration30minCopy)).toBe(true);
      expect(duration45min.isLessThanOrEqual(duration30min)).toBe(false);
    });

    it('should check equality correctly', () => {
      expect(duration30min.equals(duration30minCopy)).toBe(true);
      expect(duration30min.equals(duration45min)).toBe(false);
    });

    it('should check if duration is zero', () => {
      const zeroDuration = Duration.zero();
      const nonZeroDuration = Duration.fromMinutes(1);
      
      expect(zeroDuration.isZero()).toBe(true);
      expect(nonZeroDuration.isZero()).toBe(false);
    });
  });

  describe('Conversion Methods', () => {
    const duration = Duration.fromMilliseconds(3665000); // 1 hour, 1 minute, 5 seconds

    it('should convert to seconds correctly', () => {
      expect(duration.toSeconds()).toBe(3665);
    });

    it('should convert to minutes correctly', () => {
      expect(duration.toMinutes()).toBe(61);
    });

    it('should convert to hours correctly', () => {
      expect(duration.toHours()).toBe(1);
    });

    it('should handle zero duration conversions', () => {
      const zero = Duration.zero();
      expect(zero.toSeconds()).toBe(0);
      expect(zero.toMinutes()).toBe(0);
      expect(zero.toHours()).toBe(0);
    });
  });

  describe('Formatting', () => {
    it('should format duration correctly for hours:minutes:seconds', () => {
      const duration = Duration.fromMilliseconds(3665000); // 1:01:05
      expect(duration.format()).toBe('01:01:05');
    });

    it('should format zero duration correctly', () => {
      const duration = Duration.zero();
      expect(duration.format()).toBe('00:00:00');
    });

    it('should format minutes-only duration correctly', () => {
      const duration = Duration.fromMinutes(30); // 0:30:00
      expect(duration.format()).toBe('00:30:00');
    });

    it('should format seconds-only duration correctly', () => {
      const duration = Duration.fromSeconds(45); // 0:00:45
      expect(duration.format()).toBe('00:00:45');
    });

    it('should format large durations correctly', () => {
      const duration = Duration.fromHours(10).add(Duration.fromMinutes(30)); // 10:30:00
      expect(duration.format()).toBe('10:30:00');
    });

    it('should pad single digits with zeros', () => {
      const duration = Duration.fromMilliseconds(125000); // 0:02:05
      expect(duration.format()).toBe('00:02:05');
    });
  });

  describe('Immutability', () => {
    it('should return new instance for add operation', () => {
      const original = Duration.fromMinutes(30);
      const added = original.add(Duration.fromMinutes(15));
      
      expect(original.toMinutes()).toBe(30);
      expect(added.toMinutes()).toBe(45);
      expect(original).not.toBe(added);
    });

    it('should return new instance for subtract operation', () => {
      const original = Duration.fromMinutes(45);
      const subtracted = original.subtract(Duration.fromMinutes(15));
      
      expect(original.toMinutes()).toBe(45);
      expect(subtracted.toMinutes()).toBe(30);
      expect(original).not.toBe(subtracted);
    });
  });
});