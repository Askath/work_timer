/**
 * @fileoverview LocalStorage implementation of TimerStateRepository.
 * @author Work Timer Application
 */

import { Injectable } from '@angular/core';
import { TimerStatus, WorkDayDate } from '../../domain/index';
import { TimerStateRepository, TimerStateData } from '../../domain/repositories/timer-state.repository';

@Injectable({
  providedIn: 'root'
})
export class LocalStorageTimerStateRepository implements TimerStateRepository {
  private readonly STORAGE_KEY = 'work-timer-current-state';
  
  async saveCurrentState(state: TimerStateData): Promise<void> {
    const serialized = this.serializeState(state);
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(serialized));
  }
  
  async loadCurrentState(): Promise<TimerStateData | null> {
    const stored = localStorage.getItem(this.STORAGE_KEY);
    if (!stored) return null;
    
    try {
      const data = JSON.parse(stored);
      return this.deserializeState(data);
    } catch (error) {
      console.error('Error parsing stored timer state:', error);
      return null;
    }
  }
  
  async clearCurrentState(): Promise<void> {
    localStorage.removeItem(this.STORAGE_KEY);
  }
  
  async hasActiveSession(): Promise<boolean> {
    const state = await this.loadCurrentState();
    return state !== null && state.status.isRunning();
  }
  
  private serializeState(state: TimerStateData): any {
    return {
      status: state.status.value,
      currentSessionStartTime: state.currentSessionStartTime?.toISOString() || null,
      currentSessionTime: state.currentSessionTime,
      date: state.date.toISOString()
    };
  }
  
  private deserializeState(data: any): TimerStateData {
    return {
      status: TimerStatus.fromString(data.status),
      currentSessionStartTime: data.currentSessionStartTime ? new Date(data.currentSessionStartTime) : undefined,
      currentSessionTime: data.currentSessionTime,
      date: WorkDayDate.fromDate(new Date(data.date))
    };
  }
}