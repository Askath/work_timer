/**
 * @fileoverview Dashboard component for the work timer application.
 * @author Work Timer Application
 */

import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TimeTrackingService } from '../services';
import { TimerStatus } from '../models';

/**
 * Main dashboard component that displays the work timer interface.
 * Provides controls for starting/stopping work, displays real-time metrics,
 * and shows progress towards the daily 10-hour limit.
 * @class
 */
@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent {
  /** Injected time tracking service for timer operations */
  readonly timerService = inject(TimeTrackingService);
  
  /** Timer status enum reference for template usage */
  readonly TimerStatus = TimerStatus;
  
  /** Current date formatted for display */
  readonly currentDate = new Date().toLocaleDateString('en-US', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });

  /**
   * Toggles the timer between start/stop states.
   * Calls appropriate service method based on current status.
   * @returns {void}
   */
  toggleTimer(): void {
    if (this.timerService.currentStatus() === TimerStatus.RUNNING) {
      this.timerService.stopWork();
    } else {
      this.timerService.startWork();
    }
  }

  /**
   * Resets the timer with user confirmation.
   * Shows confirmation dialog before clearing all data.
   * @returns {void}
   */
  resetTimer(): void {
    if (confirm('Are you sure you want to reset the timer? This will clear all data for today.')) {
      this.timerService.resetTimer();
    }
  }

  /**
   * Gets the appropriate button text based on current timer status.
   * @returns {string} Button text for current state
   */
  getButtonText(): string {
    const status = this.timerService.currentStatus();
    if (this.timerService.isWorkComplete()) {
      return 'Work Complete';
    }
    
    switch (status) {
      case TimerStatus.STOPPED:
        return 'Start Work';
      case TimerStatus.RUNNING:
        return 'Stop Work';
      case TimerStatus.PAUSED:
        return 'Resume Work';
      default:
        return 'Start Work';
    }
  }

  /**
   * Gets the current timer status as a display string.
   * @returns {string} Human-readable status text
   */
  getStatusText(): string {
    const status = this.timerService.currentStatus();
    switch (status) {
      case TimerStatus.STOPPED:
        return 'Stopped';
      case TimerStatus.RUNNING:
        return 'Running';
      case TimerStatus.PAUSED:
        return 'Paused';
      default:
        return 'Unknown';
    }
  }

  /**
   * Calculates the progress percentage towards the daily 10-hour limit.
   * @returns {number} Progress percentage (0-100)
   */
  getProgressPercentage(): number {
    const maxTime = 10 * 60 * 60 * 1000; // 10 hours in milliseconds
    const effectiveTime = this.timerService.effectiveWorkTime();
    return Math.min(100, Math.max(0, (effectiveTime / maxTime) * 100));
  }

  /**
   * Gets formatted progress text for display.
   * @returns {string} Progress text with percentage
   */
  getProgressText(): string {
    const percentage = this.getProgressPercentage();
    return `${percentage.toFixed(1)}% of daily limit`;
  }

  /**
   * Formats milliseconds into HH:MM:SS string format.
   * @param {number} milliseconds - Time in milliseconds to format
   * @returns {string} Formatted time string (HH:MM:SS)
   */
  formatTime(milliseconds: number): string {
    const totalSeconds = Math.floor(milliseconds / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }
}