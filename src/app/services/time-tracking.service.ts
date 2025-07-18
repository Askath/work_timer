/**
 * @fileoverview Time tracking service for managing work sessions and time calculations.
 * @author Work Timer Application
 */

import { Injectable, signal, computed, effect } from '@angular/core';
import { LocalStorageService } from './local-storage.service';
import { TimerState, TimerStatus, TimeSession, DailyTimeData, WorkTimeCalculations } from '../models';

/**
 * Core service for managing work time tracking, pause calculations, and daily limits.
 * Uses Angular signals for reactive state management and provides real-time updates.
 * Implements business logic for the 30-minute pause deduction rule and 10-hour daily limit.
 * @class
 */
@Injectable({
  providedIn: 'root'
})
export class TimeTrackingService {
  /** Maximum allowed work time per day in milliseconds (10 hours) */
  private readonly MAX_WORK_TIME = 10 * 60 * 60 * 1000;
  
  /** Threshold for pause deduction in milliseconds (30 minutes) */
  private readonly PAUSE_DEDUCTION_THRESHOLD = 30 * 60 * 1000;
  
  /** Amount to deduct when pause is under threshold in milliseconds (30 minutes) */
  private readonly PAUSE_DEDUCTION_AMOUNT = 30 * 60 * 1000;

  /** Interval ID for the timer that updates every second */
  private timerInterval: number | null = null;
  
  /** Core timer state signal containing all timer data */
  private readonly timerState = signal<TimerState>({
    status: TimerStatus.STOPPED,
    startTime: null,
    currentSessionStart: null,
    totalWorkTime: 0,
    totalPauseTime: 0,
    currentSessionTime: 0,
    sessionsCount: 0,
    lastPauseDeduction: 0
  });
  
  /** Current timer status (stopped, running, or paused) */
  readonly currentStatus = computed(() => this.timerState().status);
  
  /** 
   * Total work time including live session time when running.
   * Updates in real-time while timer is active.
   */
  readonly currentWorkTime = computed(() => {
    const state = this.timerState();
    if (state.status === TimerStatus.RUNNING) {
      return state.totalWorkTime + state.currentSessionTime;
    }
    return state.totalWorkTime;
  });
  
  /** Total pause time accumulated between sessions */
  readonly currentPauseTime = computed(() => this.timerState().totalPauseTime);
  
  /** Current session elapsed time, resets on each start/stop */
  readonly currentSessionTime = computed(() => this.timerState().currentSessionTime);
  
  /** Number of work sessions completed */
  readonly sessionsCount = computed(() => this.timerState().sessionsCount);
  
  /** 
   * Computed calculations for all work time metrics.
   * Includes pause deduction logic and daily limit calculations.
   */
  private readonly dailyCalculations = computed(() => {
    const state = this.timerState();
    const totalWorkTime = this.currentWorkTime();
    return this.calculateWorkTime(totalWorkTime, state.totalPauseTime, state.lastPauseDeduction);
  });
  
  /** Total work time from daily calculations */
  readonly totalWorkTime = computed(() => this.dailyCalculations().totalWorkTime);
  
  /** Total pause time from daily calculations */
  readonly totalPauseTime = computed(() => this.dailyCalculations().totalPauseTime);
  
  /** Amount deducted due to pause rules */
  readonly pauseDeduction = computed(() => this.dailyCalculations().pauseDeduction);
  
  /** Effective work time after deductions */
  readonly effectiveWorkTime = computed(() => this.dailyCalculations().effectiveWorkTime);
  
  /** Remaining time until 10-hour daily limit */
  readonly remainingTime = computed(() => this.dailyCalculations().remainingTime);
  
  /** Whether the 10-hour daily limit has been reached */
  readonly isWorkComplete = computed(() => this.dailyCalculations().isComplete);

  /** Formatted current total work time as HH:MM:SS */
  readonly formattedCurrentTime = computed(() => this.formatTime(this.currentWorkTime()));
  
  /** Formatted current session time as HH:MM:SS */
  readonly formattedCurrentSession = computed(() => this.formatTime(this.currentSessionTime()));
  
  /** Formatted pause time as HH:MM:SS */
  readonly formattedPauseTime = computed(() => this.formatTime(this.currentPauseTime()));
  
  /** Formatted effective work time as HH:MM:SS */
  readonly formattedEffectiveTime = computed(() => this.formatTime(this.effectiveWorkTime()));
  
  /** Formatted remaining time as HH:MM:SS */
  readonly formattedRemainingTime = computed(() => this.formatTime(this.remainingTime()));

  /**
   * Initializes the time tracking service.
   * Loads saved state, sets up auto-save, and resumes timer if it was running.
   * @param {LocalStorageService} localStorageService - Service for data persistence
   */
  constructor(private localStorageService: LocalStorageService) {
    // Load saved state
    const savedState = this.localStorageService.getTimerState();
    if (savedState) {
      this.timerState.set(savedState);
    }

    // Auto-save state changes
    effect(() => {
      this.localStorageService.saveTimerState(this.timerState());
    });

    // Start timer if it was running
    if (this.currentStatus() === TimerStatus.RUNNING) {
      this.startTimer();
    }
  }

  /**
   * Starts or resumes the work timer.
   * Handles both initial start and resume from pause states.
   * Applies pause deduction logic when resuming.
   * @returns {void}
   */
  startWork(): void {
    try {
      const now = new Date();
      const currentState = this.timerState();
      
      if (currentState.status === TimerStatus.STOPPED) {
        // First start of the day
        this.timerState.set({
          ...currentState,
          status: TimerStatus.RUNNING,
          startTime: now,
          currentSessionStart: now,
          sessionsCount: 1
        });
      } else if (currentState.status === TimerStatus.PAUSED) {
        // Resume after pause
        const pauseDuration = now.getTime() - (currentState.currentSessionStart?.getTime() || 0);
        const newTotalPauseTime = currentState.totalPauseTime + pauseDuration;
        
        // Check if we should apply the 30-minute deduction
        let newLastPauseDeduction = currentState.lastPauseDeduction;
        if (newTotalPauseTime > 0 && newTotalPauseTime <= this.PAUSE_DEDUCTION_THRESHOLD && currentState.lastPauseDeduction === 0) {
          newLastPauseDeduction = this.PAUSE_DEDUCTION_AMOUNT;
        }
        
        this.timerState.set({
          ...currentState,
          status: TimerStatus.RUNNING,
          currentSessionStart: now,
          totalPauseTime: newTotalPauseTime,
          sessionsCount: currentState.sessionsCount + 1,
          lastPauseDeduction: newLastPauseDeduction
        });
      }
      
      this.startTimer();
    } catch (error) {
      console.error('Error starting work timer:', error);
    }
  }

  /**
   * Stops the work timer and transitions to paused state.
   * Saves the current work session and updates daily data.
   * @returns {void}
   */
  stopWork(): void {
    try {
      const currentState = this.timerState();
      
      if (currentState.status === TimerStatus.RUNNING) {
        const now = new Date();
        const sessionDuration = now.getTime() - (currentState.currentSessionStart?.getTime() || 0);
        
        // Save the work session
        this.saveWorkSession(currentState.currentSessionStart!, now, sessionDuration);
        
        // Calculate if pause deduction should be applied
        const newTotalWorkTime = currentState.totalWorkTime + sessionDuration;
        let newLastPauseDeduction = currentState.lastPauseDeduction;
        
        // Apply 30-minute deduction if total pause time will be 0-30 minutes and hasn't been applied yet
        if (currentState.totalPauseTime === 0 && currentState.lastPauseDeduction === 0) {
          // This is the first pause, so we'll apply the deduction when resuming
          newLastPauseDeduction = 0; // Will be applied in calculateWorkTime when pause > 0
        }
        
        // Update state
        this.timerState.set({
          ...currentState,
          status: TimerStatus.PAUSED,
          totalWorkTime: newTotalWorkTime,
          currentSessionTime: 0,
          currentSessionStart: now, // Set for pause calculation
          lastPauseDeduction: newLastPauseDeduction
        });
        
        this.stopTimer();
        this.saveDailyData();
      }
    } catch (error) {
      console.error('Error stopping work timer:', error);
    }
  }

  /**
   * Resets the timer to initial state and clears all data.
   * Removes all stored data from localStorage.
   * @returns {void}
   */
  resetTimer(): void {
    try {
      this.stopTimer();
      this.timerState.set({
        status: TimerStatus.STOPPED,
        startTime: null,
        currentSessionStart: null,
        totalWorkTime: 0,
        totalPauseTime: 0,
        currentSessionTime: 0,
        sessionsCount: 0,
        lastPauseDeduction: 0
      });
      this.localStorageService.clearData();
    } catch (error) {
      console.error('Error resetting timer:', error);
    }
  }

  /**
   * Starts the internal timer interval that updates every second.
   * Updates the current session time for real-time display.
   * @private
   * @returns {void}
   */
  private startTimer(): void {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
    }
    
    this.timerInterval = window.setInterval(() => {
      const currentState = this.timerState();
      if (currentState.status === TimerStatus.RUNNING && currentState.currentSessionStart) {
        const sessionTime = Date.now() - currentState.currentSessionStart.getTime();
        this.timerState.set({
          ...currentState,
          currentSessionTime: sessionTime
        });
      }
    }, 1000);
  }

  /**
   * Stops the internal timer interval.
   * @private
   * @returns {void}
   */
  private stopTimer(): void {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
  }

  /**
   * Calculates work time metrics including pause deduction logic.
   * Applies the 30-minute deduction rule when pause time is 0-30 minutes.
   * @private
   * @param {number} totalWorkTime - Total work time in milliseconds
   * @param {number} totalPauseTime - Total pause time in milliseconds
   * @param {number} lastPauseDeduction - Previously applied deduction in milliseconds
   * @returns {WorkTimeCalculations} Calculated work time metrics
   */
  private calculateWorkTime(totalWorkTime: number, totalPauseTime: number, lastPauseDeduction: number): WorkTimeCalculations {
    // Apply pause deduction logic
    let pauseDeduction = lastPauseDeduction;
    
    // If total pause time is between 0 and 30 minutes, apply 30-minute deduction
    if (totalPauseTime > 0 && totalPauseTime <= this.PAUSE_DEDUCTION_THRESHOLD && lastPauseDeduction === 0) {
      pauseDeduction = this.PAUSE_DEDUCTION_AMOUNT;
    }
    
    const effectiveWorkTime = Math.max(0, totalWorkTime - pauseDeduction);
    const remainingTime = Math.max(0, this.MAX_WORK_TIME - effectiveWorkTime);
    const isComplete = effectiveWorkTime >= this.MAX_WORK_TIME;
    
    return {
      totalWorkTime,
      totalPauseTime,
      pauseDeduction,
      effectiveWorkTime,
      remainingTime,
      isComplete
    };
  }

  /**
   * Saves a completed work session to localStorage.
   * @private
   * @param {Date} startTime - When the session started
   * @param {Date} endTime - When the session ended
   * @param {number} duration - Session duration in milliseconds
   * @returns {void}
   */
  private saveWorkSession(startTime: Date, endTime: Date, duration: number): void {
    const session: TimeSession = {
      id: this.generateSessionId(),
      startTime,
      endTime,
      duration,
      isPause: false,
      date: this.formatDate(startTime)
    };
    
    this.localStorageService.saveSession(session);
  }

  /**
   * Saves aggregated daily time data to localStorage.
   * Combines all sessions and calculations for the current day.
   * @private
   * @returns {void}
   */
  private saveDailyData(): void {
    const today = this.formatDate(new Date());
    const calculations = this.dailyCalculations();
    const sessions = this.localStorageService.getSessionsByDate(today);
    
    const dailyData: DailyTimeData = {
      date: today,
      sessions,
      totalWorkTime: calculations.totalWorkTime,
      totalPauseTime: calculations.totalPauseTime,
      pauseDeduction: calculations.pauseDeduction,
      effectiveWorkTime: calculations.effectiveWorkTime,
      remainingTime: calculations.remainingTime,
      isComplete: calculations.isComplete,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    this.localStorageService.saveDailyData(dailyData);
  }


  /**
   * Formats milliseconds into HH:MM:SS string format.
   * @private
   * @param {number} milliseconds - Time in milliseconds to format
   * @returns {string} Formatted time string (HH:MM:SS)
   */
  private formatTime(milliseconds: number): string {
    const totalSeconds = Math.floor(milliseconds / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }

  /**
   * Formats a Date object to YYYY-MM-DD string format.
   * @private
   * @param {Date} date - Date to format
   * @returns {string} Formatted date string (YYYY-MM-DD)
   */
  private formatDate(date: Date): string {
    return date.toISOString().split('T')[0];
  }

  /**
   * Generates a unique session ID using timestamp and random string.
   * @private
   * @returns {string} Unique session identifier
   */
  private generateSessionId(): string {
    return Date.now().toString() + Math.random().toString(36).substr(2, 9);
  }
}