/**
 * @fileoverview Dashboard component for the work timer application.
 * @author Work Timer Application
 */

import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TimerFacade } from '../application/facades/timer.facade';
import { TimerStatus } from '../domain';

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
  styleUrl: './dashboard.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DashboardComponent {
  /** Injected timer facade for timer operations */
  readonly timerFacade = inject(TimerFacade);
  
  /** Timer status enum reference for template usage */
  readonly TimerStatus = TimerStatus;
  
  /** Current date formatted for display */
  readonly currentDate = this.timerFacade.currentDate;

  /**
   * Toggles the timer between start/stop states.
   * Calls appropriate facade method based on current status.
   * @returns {void}
   */
  toggleTimer(): void {
    if (this.timerFacade.currentStatus().isRunning()) {
      this.timerFacade.stopWork();
    } else {
      this.timerFacade.startWork();
    }
  }

  /**
   * Resets the timer with user confirmation.
   * Shows confirmation dialog before clearing all data.
   * @returns {void}
   */
  resetTimer(): void {
    if (confirm('Are you sure you want to reset the timer? This will clear all data for today.')) {
      this.timerFacade.resetTimer();
    }
  }

  /**
   * Gets the appropriate button text based on current timer status.
   * @returns {string} Button text for current state
   */
  getButtonText(): string {
    return this.timerFacade.buttonText();
  }

  /**
   * Gets the current timer status as a display string.
   * @returns {string} Human-readable status text
   */
  getStatusText(): string {
    return this.timerFacade.statusText();
  }

  /**
   * Calculates the progress percentage towards the daily 10-hour limit.
   * @returns {number} Progress percentage (0-100)
   */
  getProgressPercentage(): number {
    return this.timerFacade.progressPercentage();
  }

  /**
   * Gets formatted progress text for display.
   * @returns {string} Progress text with percentage
   */
  getProgressText(): string {
    return this.timerFacade.getProgressText();
  }

  /**
   * Formats milliseconds into HH:MM:SS string format.
   * @param {number} milliseconds - Time in milliseconds to format
   * @returns {string} Formatted time string (HH:MM:SS)
   */
  formatTime(milliseconds: number): string {
    return this.timerFacade.formatTime(milliseconds);
  }
}