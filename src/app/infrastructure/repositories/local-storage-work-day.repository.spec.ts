/**
 * @fileoverview Tests for LocalStorageWorkDayRepository.
 * @author Work Timer Application
 */

import { TestBed } from '@angular/core/testing';
import { LocalStorageWorkDayRepository } from './local-storage-work-day.repository';
import { WorkDay, WorkDayDate } from '../../domain/index';
import { TestTimes, TestDates } from '../../testing/helpers/time.helpers';

describe('LocalStorageWorkDayRepository', () => {
  let repository: LocalStorageWorkDayRepository;
  let mockLocalStorage: { [key: string]: string };

  // Test data
  let testWorkDay1: WorkDay;
  let testWorkDay2: WorkDay;
  let testWorkDay3: WorkDay;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [LocalStorageWorkDayRepository]
    });

    repository = TestBed.inject(LocalStorageWorkDayRepository);

    // Create test work days
    testWorkDay1 = WorkDay.create(TestDates.MARCH_15_2024);
    testWorkDay2 = WorkDay.create(TestDates.MARCH_16_2024);
    testWorkDay3 = WorkDay.create(TestDates.JANUARY_1_2024);

    // Add some sessions to make test data more realistic
    testWorkDay1 = testWorkDay1.startWork(TestTimes.NINE_AM);
    testWorkDay1 = testWorkDay1.stopWork(TestTimes.TEN_AM);

    testWorkDay2 = testWorkDay2.startWork(TestTimes.NINE_AM);
    // testWorkDay2 left with active session

    // Mock localStorage
    mockLocalStorage = {};
    spyOn(localStorage, 'getItem').and.callFake((key: string) => mockLocalStorage[key] || null);
    spyOn(localStorage, 'setItem').and.callFake((key: string, value: string) => {
      mockLocalStorage[key] = value;
    });
    spyOn(localStorage, 'removeItem').and.callFake((key: string) => {
      delete mockLocalStorage[key];
    });
  });

  afterEach(() => {
    mockLocalStorage = {};
  });

  describe('save', () => {
    it('should save a new work day', async () => {
      await repository.save(testWorkDay1);

      const stored = JSON.parse(mockLocalStorage['work-timer-workdays']);
      expect(stored.length).toBe(1);
      expect(stored[0].date).toBe(TestDates.MARCH_15_2024.toISOString());
    });

    it('should update an existing work day', async () => {
      // Save initial work day
      await repository.save(testWorkDay1);

      // Modify the work day and save again
      const modifiedWorkDay = testWorkDay1.startWork(TestTimes.ELEVEN_AM);
      await repository.save(modifiedWorkDay);

      const stored = JSON.parse(mockLocalStorage['work-timer-workdays']);
      expect(stored.length).toBe(1);
      expect(stored[0].sessions.length).toBe(2); // Should have 2 sessions now
    });

    it('should save multiple work days', async () => {
      await repository.save(testWorkDay1);
      await repository.save(testWorkDay2);
      await repository.save(testWorkDay3);

      const stored = JSON.parse(mockLocalStorage['work-timer-workdays']);
      expect(stored.length).toBe(3);
      
      const dates = stored.map((wd: any) => wd.date);
      expect(dates).toContain(TestDates.MARCH_15_2024.toISOString());
      expect(dates).toContain(TestDates.MARCH_16_2024.toISOString());
      expect(dates).toContain(TestDates.JANUARY_1_2024.toISOString());
    });
  });

  describe('findByDate', () => {
    beforeEach(async () => {
      await repository.save(testWorkDay1);
      await repository.save(testWorkDay2);
    });

    it('should find an existing work day', async () => {
      const found = await repository.findByDate(TestDates.MARCH_15_2024);

      expect(found).not.toBeNull();
      expect(found!.date.equals(TestDates.MARCH_15_2024)).toBe(true);
      expect(found!.sessions.length).toBe(1);
    });

    it('should return null for non-existent work day', async () => {
      const found = await repository.findByDate(TestDates.DECEMBER_31_2024);

      expect(found).toBeNull();
    });

    it('should handle empty storage', async () => {
      mockLocalStorage = {};
      const found = await repository.findByDate(TestDates.MARCH_15_2024);

      expect(found).toBeNull();
    });

    it('should preserve work day state through serialization', async () => {
      const found = await repository.findByDate(TestDates.MARCH_16_2024);

      expect(found).not.toBeNull();
      expect(found!.status.isRunning()).toBe(true); // Should preserve active session
      expect(found!.currentSession).not.toBeNull();
    });
  });

  describe('findAll', () => {
    it('should return empty array when storage is empty', async () => {
      const workDays = await repository.findAll();

      expect(workDays).toEqual([]);
    });

    it('should return all stored work days', async () => {
      await repository.save(testWorkDay1);
      await repository.save(testWorkDay2);
      await repository.save(testWorkDay3);

      const workDays = await repository.findAll();

      expect(workDays.length).toBe(3);
      
      const dates = workDays.map(wd => wd.date);
      expect(dates.some(d => d.equals(TestDates.MARCH_15_2024))).toBe(true);
      expect(dates.some(d => d.equals(TestDates.MARCH_16_2024))).toBe(true);
      expect(dates.some(d => d.equals(TestDates.JANUARY_1_2024))).toBe(true);
    });

    it('should handle corrupted localStorage data', async () => {
      mockLocalStorage['work-timer-workdays'] = 'invalid-json';

      const workDays = await repository.findAll();

      expect(workDays).toEqual([]);
    });
  });

  describe('delete', () => {
    beforeEach(async () => {
      await repository.save(testWorkDay1);
      await repository.save(testWorkDay2);
      await repository.save(testWorkDay3);
    });

    it('should delete an existing work day', async () => {
      await repository.delete(TestDates.MARCH_15_2024);

      const remaining = await repository.findAll();
      expect(remaining.length).toBe(2);
      
      const dates = remaining.map(wd => wd.date);
      expect(dates.some(d => d.equals(TestDates.MARCH_15_2024))).toBe(false);
      expect(dates.some(d => d.equals(TestDates.MARCH_16_2024))).toBe(true);
      expect(dates.some(d => d.equals(TestDates.JANUARY_1_2024))).toBe(true);
    });

    it('should handle deleting non-existent work day', async () => {
      await repository.delete(TestDates.DECEMBER_31_2024);

      const remaining = await repository.findAll();
      expect(remaining.length).toBe(3);
    });
  });

  describe('exists', () => {
    beforeEach(async () => {
      await repository.save(testWorkDay1);
      await repository.save(testWorkDay2);
    });

    it('should return true for existing work day', async () => {
      const exists = await repository.exists(TestDates.MARCH_15_2024);

      expect(exists).toBe(true);
    });

    it('should return false for non-existent work day', async () => {
      const exists = await repository.exists(TestDates.DECEMBER_31_2024);

      expect(exists).toBe(false);
    });

    it('should handle empty storage', async () => {
      mockLocalStorage = {};
      const exists = await repository.exists(TestDates.MARCH_15_2024);

      expect(exists).toBe(false);
    });
  });

  describe('serialization/deserialization', () => {
    it('should preserve work day data through save/load cycle', async () => {
      // Create a complex work day with multiple sessions
      let complexWorkDay = WorkDay.create(TestDates.MARCH_15_2024);
      complexWorkDay = complexWorkDay.startWork(TestTimes.NINE_AM);
      complexWorkDay = complexWorkDay.stopWork(TestTimes.TEN_AM);
      complexWorkDay = complexWorkDay.startWork(TestTimes.ELEVEN_AM);
      complexWorkDay = complexWorkDay.stopWork(TestTimes.NOON);

      await repository.save(complexWorkDay);
      const loaded = await repository.findByDate(TestDates.MARCH_15_2024);

      expect(loaded).not.toBeNull();
      expect(loaded!.date.equals(complexWorkDay.date)).toBe(true);
      expect(loaded!.sessions.length).toBe(2);
      expect(loaded!.sessionCount).toBe(2);
      expect(loaded!.status.equals(complexWorkDay.status)).toBe(true);
    });

    it('should handle work days with active sessions', async () => {
      await repository.save(testWorkDay2); // Has active session

      const loaded = await repository.findByDate(TestDates.MARCH_16_2024);

      expect(loaded).not.toBeNull();
      expect(loaded!.status.isRunning()).toBe(true);
      expect(loaded!.currentSession).not.toBeNull();
    });

    it('should preserve pause deduction state', async () => {
      // Create work day with pause deduction applied
      let workDayWithDeduction = WorkDay.create(TestDates.MARCH_15_2024);
      workDayWithDeduction = workDayWithDeduction.applyPauseDeduction();

      await repository.save(workDayWithDeduction);
      const loaded = await repository.findByDate(TestDates.MARCH_15_2024);

      expect(loaded).not.toBeNull();
      expect(loaded!.pauseDeductionApplied).toBe(workDayWithDeduction.pauseDeductionApplied);
    });
  });

  describe('storage key management', () => {
    it('should use consistent storage key', async () => {
      await repository.save(testWorkDay1);

      expect(localStorage.setItem).toHaveBeenCalledWith(
        'work-timer-workdays',
        jasmine.any(String)
      );
    });

    it('should not interfere with other localStorage data', async () => {
      mockLocalStorage['other-app-data'] = 'should-remain-unchanged';
      mockLocalStorage['work-timer-sessions'] = 'sessions-data';
      
      await repository.save(testWorkDay1);

      expect(mockLocalStorage['other-app-data']).toBe('should-remain-unchanged');
      expect(mockLocalStorage['work-timer-sessions']).toBe('sessions-data');
    });
  });
});