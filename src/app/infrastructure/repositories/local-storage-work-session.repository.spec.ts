/**
 * @fileoverview Tests for LocalStorageWorkSessionRepository.
 * @author Work Timer Application
 */

import { TestBed } from '@angular/core/testing';
import { LocalStorageWorkSessionRepository } from './local-storage-work-session.repository';
import { WorkSession, WorkDayDate, Duration } from '../../domain/index';
import { TestTimes, TestDates, TestDurations } from '../../testing/helpers/time.helpers';

describe('LocalStorageWorkSessionRepository', () => {
  let repository: LocalStorageWorkSessionRepository;
  let mockLocalStorage: { [key: string]: string };

  // Test data
  const testSession1 = WorkSession.create(TestTimes.NINE_AM);
  const testSession2 = WorkSession.create(TestTimes.TEN_AM);
  const testSession3 = WorkSession.create(TestTimes.NINE_AM);

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [LocalStorageWorkSessionRepository]
    });

    repository = TestBed.inject(LocalStorageWorkSessionRepository);

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
    it('should save a new session', async () => {
      await repository.save(testSession1);

      const stored = JSON.parse(mockLocalStorage['work-timer-sessions']);
      expect(stored.length).toBe(1);
      expect(stored[0].startTime).toBe(TestTimes.NINE_AM.toISOString());
    });

    it('should update an existing session', async () => {
      // Save initial session
      await repository.save(testSession1);

      // Stop the session and save again
      const stoppedSession = testSession1.stop(TestTimes.TEN_AM);
      await repository.save(stoppedSession);

      const stored = JSON.parse(mockLocalStorage['work-timer-sessions']);
      expect(stored.length).toBe(1);
      expect(stored[0].endTime).toBe(TestTimes.TEN_AM.toISOString());
    });

    it('should save multiple sessions', async () => {
      await repository.save(testSession1);
      await repository.save(testSession2);

      const stored = JSON.parse(mockLocalStorage['work-timer-sessions']);
      expect(stored.length).toBe(2);
      expect(stored.map((s: any) => s.id)).toContain(testSession1.id);
      expect(stored.map((s: any) => s.id)).toContain(testSession2.id);
    });
  });

  describe('findById', () => {
    beforeEach(async () => {
      await repository.save(testSession1);
      await repository.save(testSession2);
    });

    it('should find an existing session', async () => {
      const found = await repository.findById(testSession1.id);

      expect(found).not.toBeNull();
      expect(found!.id).toBe(testSession1.id);
      expect(found!.startTime).toEqual(TestTimes.NINE_AM);
    });

    it('should return null for non-existent session', async () => {
      const found = await repository.findById('non-existent');

      expect(found).toBeNull();
    });

    it('should handle empty storage', async () => {
      mockLocalStorage = {};
      const found = await repository.findById(testSession1.id);

      expect(found).toBeNull();
    });
  });

  describe('findByDate', () => {
    beforeEach(async () => {
      await repository.save(testSession1); // March 15
      await repository.save(testSession2); // March 15  
      await repository.save(testSession3); // March 15
    });

    it('should find sessions by date', async () => {
      const found = await repository.findByDate(TestDates.MARCH_15_2024);

      expect(found.length).toBe(3);
      expect(found.map(s => s.id)).toContain(testSession1.id);
      expect(found.map(s => s.id)).toContain(testSession2.id);
      expect(found.map(s => s.id)).toContain(testSession3.id);
    });

    it('should return empty array for date with no sessions', async () => {
      const found = await repository.findByDate(TestDates.JANUARY_1_2024);

      expect(found.length).toBe(0);
    });
  });

  describe('findAll', () => {
    it('should return empty array when storage is empty', async () => {
      const sessions = await repository.findAll();

      expect(sessions).toEqual([]);
    });

    it('should return all stored sessions', async () => {
      await repository.save(testSession1);
      await repository.save(testSession2);
      await repository.save(testSession3);

      const sessions = await repository.findAll();

      expect(sessions.length).toBe(3);
      expect(sessions.map(s => s.id)).toContain(testSession1.id);
      expect(sessions.map(s => s.id)).toContain(testSession2.id);
      expect(sessions.map(s => s.id)).toContain(testSession3.id);
    });

    it('should handle corrupted localStorage data', async () => {
      mockLocalStorage['work-timer-sessions'] = 'invalid-json';

      const sessions = await repository.findAll();

      expect(sessions).toEqual([]);
    });

    it('should handle malformed session data', async () => {
      mockLocalStorage['work-timer-sessions'] = JSON.stringify([
        { id: 'valid-session', startTime: TestTimes.NINE_AM.toISOString(), date: TestDates.MARCH_15_2024.toISOString(), duration: 0 },
        { invalidData: 'missing required fields' }
      ]);

      const sessions = await repository.findAll();

      // Should deserialize valid sessions and skip invalid ones
      expect(sessions.length).toBe(1);
      expect(sessions[0].id).toBe('valid-session');
    });
  });

  describe('delete', () => {
    beforeEach(async () => {
      await repository.save(testSession1);
      await repository.save(testSession2);
    });

    it('should delete an existing session', async () => {
      await repository.delete(testSession1.id);

      const remaining = await repository.findAll();
      expect(remaining.length).toBe(1);
      expect(remaining[0].id).toBe(testSession2.id);
    });

    it('should handle deleting non-existent session', async () => {
      await repository.delete('non-existent');

      const remaining = await repository.findAll();
      expect(remaining.length).toBe(2);
    });

    it('should delete all sessions if requested', async () => {
      await repository.delete(testSession1.id);
      await repository.delete(testSession2.id);

      const remaining = await repository.findAll();
      expect(remaining.length).toBe(0);
    });
  });

  describe('deleteByDate', () => {
    beforeEach(async () => {
      await repository.save(testSession1); // March 15
      await repository.save(testSession2); // March 15
      await repository.save(testSession3); // March 15
    });

    it('should delete all sessions for a date', async () => {
      await repository.deleteByDate(TestDates.MARCH_15_2024);

      const remaining = await repository.findAll();
      expect(remaining.length).toBe(0);
    });

    it('should handle deleting from date with no sessions', async () => {
      await repository.deleteByDate(TestDates.JANUARY_1_2024);

      const remaining = await repository.findAll();
      expect(remaining.length).toBe(3);
    });
  });

  describe('serialization/deserialization', () => {
    it('should preserve session data through save/load cycle', async () => {
      const originalSession = testSession1.stop(TestTimes.TEN_AM);
      await repository.save(originalSession);

      const loadedSession = await repository.findById(originalSession.id);

      expect(loadedSession).not.toBeNull();
      expect(loadedSession!.id).toBe(originalSession.id);
      expect(loadedSession!.startTime).toEqual(originalSession.startTime);
      expect(loadedSession!.endTime).toEqual(originalSession.endTime);
      expect(loadedSession!.workDate.equals(originalSession.workDate)).toBe(true);
      expect(loadedSession!.duration.equals(originalSession.duration)).toBe(true);
    });

    it('should handle active sessions without end time', async () => {
      await repository.save(testSession1);

      const loadedSession = await repository.findById(testSession1.id);

      expect(loadedSession).not.toBeNull();
      expect(loadedSession!.endTime).toBeNull();
      expect(loadedSession!.isRunning).toBe(true);
    });

    it('should maintain date precision', async () => {
      const preciseTime = new Date('2024-03-15T14:30:45.123Z');
      const preciseSession = WorkSession.create(preciseTime);
      
      await repository.save(preciseSession);
      const loaded = await repository.findById(preciseSession.id);

      expect(loaded!.startTime.getTime()).toBe(preciseTime.getTime());
    });
  });

  describe('storage key management', () => {
    it('should use consistent storage key', async () => {
      await repository.save(testSession1);

      expect(localStorage.setItem).toHaveBeenCalledWith(
        'work-timer-sessions',
        jasmine.any(String)
      );
    });

    it('should not interfere with other localStorage data', async () => {
      mockLocalStorage['other-app-data'] = 'should-remain-unchanged';
      
      await repository.save(testSession1);

      expect(mockLocalStorage['other-app-data']).toBe('should-remain-unchanged');
    });
  });
});