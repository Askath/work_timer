/**
 * @fileoverview LocalStorage implementation of TimerStateRepository.
 * @author Work Timer Application
 */

import { Injectable } from '@angular/core';
import { TimerStateRepository, TimerStateData } from '../../domain/repositories/timer-state.repository';

@Injectable({
  providedIn: 'root'
})
export class LocalStorageTimerStateRepository implements TimerStateRepository {
  private readonly STORAGE_KEY = 'work-timer-state';

  async saveCurrentState(state: TimerStateData): Promise<void> {
    try {
      const data = JSON.stringify(state);
      localStorage.setItem(this.STORAGE_KEY, data);
    } catch (error) {
      console.error('Error saving timer state to localStorage:', error);
      throw new Error('Failed to save timer state');
    }
  }

  async loadCurrentState(): Promise<TimerStateData | null> {
    try {
      const data = localStorage.getItem(this.STORAGE_KEY);
      if (!data) {
        return null;
      }
      
      const parsed = JSON.parse(data);
      return parsed;
    } catch (error) {
      console.error('Error loading timer state from localStorage:', error);
      return null;
    }
  }

  async clearCurrentState(): Promise<void> {
    try {
      localStorage.removeItem(this.STORAGE_KEY);
    } catch (error) {
      console.error('Error clearing timer state from localStorage:', error);
      throw new Error('Failed to clear timer state');
    }
  }

  async hasActiveSession(): Promise<boolean> {
    const state = await this.loadCurrentState();
    return state !== null && state.currentSessionStartTime !== undefined;
  }
}