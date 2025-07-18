/**
 * @fileoverview WorkDayDate value object tests.
 * @author Work Timer Application
 */

import { WorkDayDate } from './work-day-date';

describe('WorkDayDate', () => {
  describe('Factory Methods', () => {
    it('should create WorkDayDate from Date object', () => {
      const date = new Date('2024-03-15T14:30:00');
      const workDayDate = WorkDayDate.fromDate(date);
      
      expect(workDayDate.toISOString()).toBe('2024-03-15');
    });

    it('should normalize time to start of day when creating from Date', () => {
      const dateWithTime = new Date('2024-03-15T14:30:00');
      const workDayDate = WorkDayDate.fromDate(dateWithTime);
      const startOfDay = workDayDate.getStartOfDay();
      
      expect(startOfDay.getHours()).toBe(0);
      expect(startOfDay.getMinutes()).toBe(0);
      expect(startOfDay.getSeconds()).toBe(0);
      expect(startOfDay.getMilliseconds()).toBe(0);
    });

    it('should create WorkDayDate for today', () => {
      const today = WorkDayDate.today();
      const expectedDate = new Date();
      const expectedISOString = expectedDate.toISOString().split('T')[0];
      
      expect(today.toISOString()).toBe(expectedISOString);
    });

    it('should create WorkDayDate from valid string', () => {
      const workDayDate = WorkDayDate.fromString('2024-03-15');
      expect(workDayDate.toISOString()).toBe('2024-03-15');
    });

    it('should throw error for invalid date string', () => {
      expect(() => WorkDayDate.fromString('invalid-date')).toThrowError('Invalid date string: invalid-date');
      expect(() => WorkDayDate.fromString('')).toThrowError('Invalid date string: ');
      expect(() => WorkDayDate.fromString('2024-13-45')).toThrowError('Invalid date string: 2024-13-45');
    });

    it('should handle different date string formats', () => {
      const workDayDate1 = WorkDayDate.fromString('2024-03-15');
      const workDayDate2 = WorkDayDate.fromString('03/15/2024');
      const workDayDate3 = WorkDayDate.fromString('March 15, 2024');
      
      expect(workDayDate1.toISOString()).toBe('2024-03-15');
      expect(workDayDate2.toISOString()).toBe('2024-03-15');
      expect(workDayDate3.toISOString()).toBe('2024-03-15');
    });
  });

  describe('Equality and Comparison', () => {
    const date1 = WorkDayDate.fromString('2024-03-15');
    const date1Copy = WorkDayDate.fromString('2024-03-15');
    const date2 = WorkDayDate.fromString('2024-03-16');
    const date3 = WorkDayDate.fromString('2024-03-14');

    it('should correctly check equality', () => {
      expect(date1.equals(date1Copy)).toBe(true);
      expect(date1.equals(date2)).toBe(false);
      expect(date1.equals(date3)).toBe(false);
    });

    it('should correctly check if date is before another', () => {
      expect(date3.isBefore(date1)).toBe(true);
      expect(date1.isBefore(date2)).toBe(true);
      expect(date2.isBefore(date1)).toBe(false);
      expect(date1.isBefore(date1Copy)).toBe(false);
    });

    it('should correctly check if date is after another', () => {
      expect(date2.isAfter(date1)).toBe(true);
      expect(date1.isAfter(date3)).toBe(true);
      expect(date1.isAfter(date2)).toBe(false);
      expect(date1.isAfter(date1Copy)).toBe(false);
    });

    it('should correctly check if date is today', () => {
      const today = WorkDayDate.today();
      const notToday = WorkDayDate.fromString('2020-01-01');
      
      expect(today.isToday()).toBe(true);
      expect(notToday.isToday()).toBe(false);
    });
  });

  describe('Date Conversion and Formatting', () => {
    const workDayDate = WorkDayDate.fromString('2024-03-15');

    it('should convert to ISO string correctly', () => {
      expect(workDayDate.toISOString()).toBe('2024-03-15');
    });

    it('should convert to Date object correctly', () => {
      const date = workDayDate.toDate();
      expect(date.getFullYear()).toBe(2024);
      expect(date.getMonth()).toBe(2); // March is month 2 (0-indexed)
      expect(date.getDate()).toBe(15);
    });

    it('should get start of day correctly', () => {
      const startOfDay = workDayDate.getStartOfDay();
      expect(startOfDay.getHours()).toBe(0);
      expect(startOfDay.getMinutes()).toBe(0);
      expect(startOfDay.getSeconds()).toBe(0);
      expect(startOfDay.getMilliseconds()).toBe(0);
    });

    it('should get end of day correctly', () => {
      const endOfDay = workDayDate.getEndOfDay();
      expect(endOfDay.getHours()).toBe(23);
      expect(endOfDay.getMinutes()).toBe(59);
      expect(endOfDay.getSeconds()).toBe(59);
      expect(endOfDay.getMilliseconds()).toBe(999);
    });

    it('should format date correctly', () => {
      const formatted = workDayDate.format();
      // Format: "Friday, March 15, 2024"
      expect(formatted).toContain('2024');
      expect(formatted).toContain('March');
      expect(formatted).toContain('15');
    });
  });

  describe('Date Arithmetic', () => {
    const baseDate = WorkDayDate.fromString('2024-03-15');

    it('should add days correctly', () => {
      const futureDate = baseDate.addDays(5);
      expect(futureDate.toISOString()).toBe('2024-03-20');
    });

    it('should subtract days correctly', () => {
      const pastDate = baseDate.subtractDays(5);
      expect(pastDate.toISOString()).toBe('2024-03-10');
    });

    it('should handle adding zero days', () => {
      const sameDate = baseDate.addDays(0);
      expect(sameDate.equals(baseDate)).toBe(true);
    });

    it('should handle negative day addition', () => {
      const pastDate = baseDate.addDays(-3);
      const expectedDate = baseDate.subtractDays(3);
      expect(pastDate.equals(expectedDate)).toBe(true);
    });

    it('should handle month boundary correctly', () => {
      const endOfMonth = WorkDayDate.fromString('2024-02-29'); // Leap year
      const nextMonth = endOfMonth.addDays(1);
      expect(nextMonth.toISOString()).toBe('2024-03-01');
    });

    it('should handle year boundary correctly', () => {
      const endOfYear = WorkDayDate.fromString('2023-12-31');
      const nextYear = endOfYear.addDays(1);
      expect(nextYear.toISOString()).toBe('2024-01-01');
    });

    it('should handle leap year correctly', () => {
      const beforeLeapDay = WorkDayDate.fromString('2024-02-28');
      const leapDay = beforeLeapDay.addDays(1);
      expect(leapDay.toISOString()).toBe('2024-02-29');
    });
  });

  describe('Immutability', () => {
    it('should return new instance for addDays operation', () => {
      const original = WorkDayDate.fromString('2024-03-15');
      const modified = original.addDays(1);
      
      expect(original.toISOString()).toBe('2024-03-15');
      expect(modified.toISOString()).toBe('2024-03-16');
      expect(original).not.toBe(modified);
    });

    it('should return new instance for subtractDays operation', () => {
      const original = WorkDayDate.fromString('2024-03-15');
      const modified = original.subtractDays(1);
      
      expect(original.toISOString()).toBe('2024-03-15');
      expect(modified.toISOString()).toBe('2024-03-14');
      expect(original).not.toBe(modified);
    });

    it('should return new Date object from toDate method', () => {
      const workDayDate = WorkDayDate.fromString('2024-03-15');
      const date1 = workDayDate.toDate();
      const date2 = workDayDate.toDate();
      
      expect(date1).not.toBe(date2);
      expect(date1.getTime()).toBe(date2.getTime());
    });
  });

  describe('Edge Cases', () => {
    it('should handle dates far in the past', () => {
      const oldDate = WorkDayDate.fromDate(new Date(1900, 0, 1)); // January 1, 1900 local time
      expect(oldDate.toISOString()).toBe('1900-01-01');
    });

    it('should handle dates far in the future', () => {
      const futureDate = WorkDayDate.fromDate(new Date(2100, 11, 31)); // December 31, 2100 local time
      expect(futureDate.toISOString()).toBe('2100-12-31');
    });

    it('should handle timezone normalization', () => {
      // Create date with local time
      const dateWithTime = new Date(2024, 2, 15, 23, 0, 0); // March 15, 2024, 23:00:00 local time
      const workDayDate = WorkDayDate.fromDate(dateWithTime);
      
      // Should normalize to the date part only
      expect(workDayDate.toISOString()).toBe('2024-03-15');
    });

    it('should maintain consistency across different time zones', () => {
      const date1 = WorkDayDate.fromString('2024-03-15');
      const date2 = WorkDayDate.fromDate(new Date(2024, 2, 15)); // March 15, 2024 local time
      
      // Both should represent the same day
      expect(date1.toISOString()).toBe('2024-03-15');
      expect(date2.toISOString()).toBe('2024-03-15');
    });
  });
});