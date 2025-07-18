/**
 * @fileoverview Tests for LocalStorageTimerStateRepository.
 * @author Work Timer Application
 */

import { TestBed } from '@angular/core/testing';
import { LocalStorageTimerStateRepository } from './local-storage-timer-state.repository';
import { TimerStateData } from '../../domain/repositories/timer-state.repository';
import { TimerStatus, WorkDayDate } from '../../domain/index';
import { TestTimes, TestDates } from '../../testing/helpers/time.helpers';

describe('LocalStorageTimerStateRepository', () => {
  let repository: LocalStorageTimerStateRepository;
  let mockLocalStorage: { [key: string]: string };

  // Test data
  const stoppedState: TimerStateData = {
    status: TimerStatus.STOPPED,
    currentSessionTime: 0,
    date: TestDates.MARCH_15_2024
  };

  const runningState: TimerStateData = {
    status: TimerStatus.RUNNING,
    currentSessionStartTime: TestTimes.NINE_AM,
    currentSessionTime: 1800000, // 30 minutes in milliseconds
    date: TestDates.MARCH_15_2024
  };

  const pausedState: TimerStateData = {
    status: TimerStatus.PAUSED,
    currentSessionTime: 3600000, // 1 hour in milliseconds
    date: TestDates.MARCH_15_2024
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [LocalStorageTimerStateRepository]
    });

    repository = TestBed.inject(LocalStorageTimerStateRepository);

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

  describe('saveCurrentState', () => {
    it('should save a stopped state', async () => {
      await repository.saveCurrentState(stoppedState);

      const stored = JSON.parse(mockLocalStorage['work-timer-current-state']);
      expect(stored.status).toBe('STOPPED');
      expect(stored.currentSessionStartTime).toBeNull();
      expect(stored.currentSessionTime).toBe(0);
      expect(stored.date).toBe(TestDates.MARCH_15_2024.toISOString());
    });

    it('should save a running state with session start time', async () => {
      await repository.saveCurrentState(runningState);

      const stored = JSON.parse(mockLocalStorage['work-timer-current-state']);
      expect(stored.status).toBe('RUNNING');
      expect(stored.currentSessionStartTime).toBe(TestTimes.NINE_AM.toISOString());
      expect(stored.currentSessionTime).toBe(1800000);
      expect(stored.date).toBe(TestDates.MARCH_15_2024.toISOString());
    });

    it('should save a paused state', async () => {
      await repository.saveCurrentState(pausedState);

      const stored = JSON.parse(mockLocalStorage['work-timer-current-state']);
      expect(stored.status).toBe('PAUSED');
      expect(stored.currentSessionStartTime).toBeNull();
      expect(stored.currentSessionTime).toBe(3600000);
      expect(stored.date).toBe(TestDates.MARCH_15_2024.toISOString());
    });

    it('should overwrite existing state', async () => {
      await repository.saveCurrentState(stoppedState);
      await repository.saveCurrentState(runningState);

      const stored = JSON.parse(mockLocalStorage['work-timer-current-state']);
      expect(stored.status).toBe('RUNNING');
      expect(stored.currentSessionStartTime).toBe(TestTimes.NINE_AM.toISOString());
    });

    it('should handle state without optional fields', async () => {
      const minimalState: TimerStateData = {
        status: TimerStatus.STOPPED,
        currentSessionTime: 0,
        date: TestDates.MARCH_15_2024
        // No currentSessionStartTime
      };

      await repository.saveCurrentState(minimalState);

      const stored = JSON.parse(mockLocalStorage['work-timer-current-state']);
      expect(stored.currentSessionStartTime).toBeNull();
    });
  });

  describe('loadCurrentState', () => {
    it('should return null when no state is stored', async () => {
      const state = await repository.loadCurrentState();

      expect(state).toBeNull();
    });

    it('should load a stopped state', async () => {
      await repository.saveCurrentState(stoppedState);

      const loaded = await repository.loadCurrentState();

      expect(loaded).not.toBeNull();
      expect(loaded!.status.equals(TimerStatus.STOPPED)).toBe(true);
      expect(loaded!.currentSessionStartTime).toBeUndefined();
      expect(loaded!.currentSessionTime).toBe(0);
      expect(loaded!.date.equals(TestDates.MARCH_15_2024)).toBe(true);
    });

    it('should load a running state with session start time', async () => {
      await repository.saveCurrentState(runningState);

      const loaded = await repository.loadCurrentState();

      expect(loaded).not.toBeNull();
      expect(loaded!.status.equals(TimerStatus.RUNNING)).toBe(true);
      expect(loaded!.currentSessionStartTime).toEqual(TestTimes.NINE_AM);
      expect(loaded!.currentSessionTime).toBe(1800000);
      expect(loaded!.date.equals(TestDates.MARCH_15_2024)).toBe(true);
    });

    it('should load a paused state', async () => {
      await repository.saveCurrentState(pausedState);

      const loaded = await repository.loadCurrentState();

      expect(loaded).not.toBeNull();
      expect(loaded!.status.equals(TimerStatus.PAUSED)).toBe(true);
      expect(loaded!.currentSessionStartTime).toBeUndefined();
      expect(loaded!.currentSessionTime).toBe(3600000);
    });

    it('should handle corrupted localStorage data', async () => {
      mockLocalStorage['work-timer-current-state'] = 'invalid-json';

      const loaded = await repository.loadCurrentState();

      expect(loaded).toBeNull();
    });

    it('should handle malformed state data', async () => {
      mockLocalStorage['work-timer-current-state'] = JSON.stringify({
        invalidField: 'missing required data'
      });

      const loaded = await repository.loadCurrentState();

      expect(loaded).toBeNull();
    });

    it('should preserve date precision', async () => {
      const preciseTime = new Date('2024-03-15T14:30:45.123Z');
      const stateWithPreciseTime: TimerStateData = {
        status: TimerStatus.RUNNING,
        currentSessionStartTime: preciseTime,
        currentSessionTime: 1000,
        date: TestDates.MARCH_15_2024
      };

      await repository.saveCurrentState(stateWithPreciseTime);
      const loaded = await repository.loadCurrentState();

      expect(loaded!.currentSessionStartTime!.getTime()).toBe(preciseTime.getTime());
    });
  });

  describe('clearCurrentState', () => {
    it('should clear existing state', async () => {
      await repository.saveCurrentState(runningState);
      
      // Verify state exists
      let loaded = await repository.loadCurrentState();
      expect(loaded).not.toBeNull();

      await repository.clearCurrentState();

      // Verify state is cleared
      loaded = await repository.loadCurrentState();
      expect(loaded).toBeNull();
    });

    it('should handle clearing when no state exists', async () => {
      // Should not throw error
      await repository.clearCurrentState();

      const loaded = await repository.loadCurrentState();
      expect(loaded).toBeNull();
    });

    it('should remove from localStorage', async () => {
      await repository.saveCurrentState(runningState);
      await repository.clearCurrentState();

      expect(localStorage.removeItem).toHaveBeenCalledWith('work-timer-current-state');
      expect(mockLocalStorage['work-timer-current-state']).toBeUndefined();
    });
  });

  describe('hasActiveSession', () => {
    it('should return false when no state is stored', async () => {
      const hasActive = await repository.hasActiveSession();

      expect(hasActive).toBe(false);
    });

    it('should return false for stopped state', async () => {
      await repository.saveCurrentState(stoppedState);

      const hasActive = await repository.hasActiveSession();

      expect(hasActive).toBe(false);
    });

    it('should return true for running state', async () => {
      await repository.saveCurrentState(runningState);

      const hasActive = await repository.hasActiveSession();

      expect(hasActive).toBe(true);
    });

    it('should return false for paused state', async () => {
      await repository.saveCurrentState(pausedState);

      const hasActive = await repository.hasActiveSession();

      expect(hasActive).toBe(false);
    });

    it('should handle corrupted data gracefully', async () => {
      mockLocalStorage['work-timer-current-state'] = 'invalid-json';

      const hasActive = await repository.hasActiveSession();

      expect(hasActive).toBe(false);
    });
  });

  describe('serialization/deserialization', () => {
    it('should preserve all state data through save/load cycle', async () => {
      const complexState: TimerStateData = {
        status: TimerStatus.RUNNING,
        currentSessionStartTime: TestTimes.NINE_AM,
        currentSessionTime: 2700000, // 45 minutes
        date: TestDates.MARCH_16_2024
      };

      await repository.saveCurrentState(complexState);
      const loaded = await repository.loadCurrentState();

      expect(loaded).not.toBeNull();
      expect(loaded!.status.equals(complexState.status)).toBe(true);
      expect(loaded!.currentSessionStartTime).toEqual(complexState.currentSessionStartTime);
      expect(loaded!.currentSessionTime).toBe(complexState.currentSessionTime);
      expect(loaded!.date.equals(complexState.date)).toBe(true);
    });

    it('should handle missing optional fields during deserialization', async () => {
      // Manually create stored data without optional field
      const storedData = {
        status: 'STOPPED',
        currentSessionTime: 0,
        date: TestDates.MARCH_15_2024.toISOString()
        // No currentSessionStartTime
      };
      mockLocalStorage['work-timer-current-state'] = JSON.stringify(storedData);

      const loaded = await repository.loadCurrentState();

      expect(loaded).not.toBeNull();
      expect(loaded!.currentSessionStartTime).toBeUndefined();
    });

    it('should handle null session start time in stored data', async () => {
      const storedData = {
        status: 'PAUSED',
        currentSessionStartTime: null,
        currentSessionTime: 1000,
        date: TestDates.MARCH_15_2024.toISOString()
      };
      mockLocalStorage['work-timer-current-state'] = JSON.stringify(storedData);

      const loaded = await repository.loadCurrentState();

      expect(loaded).not.toBeNull();
      expect(loaded!.currentSessionStartTime).toBeUndefined();
    });
  });

  describe('storage key management', () => {
    it('should use consistent storage key', async () => {
      await repository.saveCurrentState(stoppedState);

      expect(localStorage.setItem).toHaveBeenCalledWith(
        'work-timer-current-state',
        jasmine.any(String)
      );
    });

    it('should not interfere with other localStorage data', async () => {
      mockLocalStorage['other-app-data'] = 'should-remain-unchanged';
      mockLocalStorage['work-timer-sessions'] = 'sessions-data';
      
      await repository.saveCurrentState(stoppedState);

      expect(mockLocalStorage['other-app-data']).toBe('should-remain-unchanged');
      expect(mockLocalStorage['work-timer-sessions']).toBe('sessions-data');
    });
  });

  describe('edge cases', () => {
    it('should handle very large session times', async () => {
      const largeTimeState: TimerStateData = {
        status: TimerStatus.PAUSED,
        currentSessionTime: Number.MAX_SAFE_INTEGER,
        date: TestDates.MARCH_15_2024
      };

      await repository.saveCurrentState(largeTimeState);
      const loaded = await repository.loadCurrentState();

      expect(loaded!.currentSessionTime).toBe(Number.MAX_SAFE_INTEGER);
    });

    it('should handle zero session time', async () => {
      const zeroTimeState: TimerStateData = {
        status: TimerStatus.RUNNING,
        currentSessionStartTime: TestTimes.NINE_AM,
        currentSessionTime: 0,
        date: TestDates.MARCH_15_2024
      };

      await repository.saveCurrentState(zeroTimeState);
      const loaded = await repository.loadCurrentState();

      expect(loaded!.currentSessionTime).toBe(0);
    });

    it('should handle different date formats', async () => {
      const futureDate = WorkDayDate.fromDate(new Date('2025-12-31'));
      const futureState: TimerStateData = {
        status: TimerStatus.STOPPED,
        currentSessionTime: 0,
        date: futureDate
      };

      await repository.saveCurrentState(futureState);
      const loaded = await repository.loadCurrentState();

      expect(loaded!.date.equals(futureDate)).toBe(true);
    });
  });
});