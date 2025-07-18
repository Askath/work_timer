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
  template: `
    <div class="dashboard">
      <header class="dashboard-header">
        <h1>Work Timer</h1>
        <p class="date">{{ currentDate }}</p>
      </header>

      <div class="main-content">
        <!-- Timer Controls -->
        <div class="timer-controls">
          <button 
            class="btn btn-primary"
            [class.btn-stop]="timerService.currentStatus() === TimerStatus.RUNNING"
            [disabled]="timerService.isWorkComplete()"
            (click)="toggleTimer()">
            {{ getButtonText() }}
          </button>
          
          <button 
            class="btn btn-secondary"
            (click)="resetTimer()">
            Reset
          </button>
        </div>

        <!-- Current Session Display -->
        <div class="current-session">
          <h2>Current Session</h2>
          <div class="time-display current-time">
            {{ timerService.formattedCurrentSession() }}
          </div>
          <div class="session-info">
            <span class="status" [class]="'status-' + timerService.currentStatus()">
              {{ getStatusText() }}
            </span>
            <span class="sessions-count">
              Session {{ timerService.sessionsCount() }}
            </span>
          </div>
        </div>

        <!-- Daily Summary -->
        <div class="daily-summary">
          <div class="summary-grid">
            <div class="summary-item">
              <h3>Total Work Time</h3>
              <div class="time-display">{{ timerService.formattedCurrentTime() }}</div>
            </div>
            
            <div class="summary-item">
              <h3>Effective Work Time</h3>
              <div class="time-display">{{ timerService.formattedEffectiveTime() }}</div>
            </div>
            
            <div class="summary-item">
              <h3>Pause Time</h3>
              <div class="time-display">{{ timerService.formattedPauseTime() }}</div>
            </div>
            
            <div class="summary-item">
              <h3>Pause Deduction</h3>
              <div class="time-display">{{ formatTime(timerService.pauseDeduction()) }}</div>
            </div>
          </div>
        </div>

        <!-- Daily Limit Display -->
        <div class="daily-limit">
          <h2>Daily Limit (10 Hours)</h2>
          <div class="progress-container">
            <div class="progress-bar">
              <div 
                class="progress-fill"
                [style.width.%]="getProgressPercentage()">
              </div>
            </div>
            <div class="progress-text">
              {{ getProgressText() }}
            </div>
          </div>
          
          <div class="limit-info">
            <div class="remaining-time">
              <h3>Remaining Time</h3>
              <div class="time-display" [class.complete]="timerService.isWorkComplete()">
                {{ timerService.formattedRemainingTime() }}
              </div>
            </div>
          </div>
        </div>

        <!-- Work Complete Message -->
        <div class="work-complete" *ngIf="timerService.isWorkComplete()">
          <h2>🎉 Work Complete!</h2>
          <p>You've reached your daily 10-hour limit.</p>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .dashboard {
      max-width: 800px;
      margin: 0 auto;
      padding: 20px;
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    }

    .dashboard-header {
      text-align: center;
      margin-bottom: 30px;
    }

    .dashboard-header h1 {
      font-size: 2.5rem;
      color: #333;
      margin: 0;
      font-weight: 600;
    }

    .date {
      color: #666;
      font-size: 1.1rem;
      margin-top: 5px;
    }

    .main-content {
      display: flex;
      flex-direction: column;
      gap: 30px;
    }

    .timer-controls {
      display: flex;
      justify-content: center;
      gap: 20px;
    }

    .btn {
      padding: 15px 30px;
      border: none;
      border-radius: 8px;
      font-size: 1.1rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.3s ease;
    }

    .btn-primary {
      background: #007bff;
      color: white;
    }

    .btn-primary:hover {
      background: #0056b3;
    }

    .btn-stop {
      background: #dc3545;
    }

    .btn-stop:hover {
      background: #c82333;
    }

    .btn-secondary {
      background: #6c757d;
      color: white;
    }

    .btn-secondary:hover {
      background: #5a6268;
    }

    .btn:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    .current-session {
      text-align: center;
      background: #f8f9fa;
      padding: 30px;
      border-radius: 12px;
      border: 2px solid #e9ecef;
    }

    .current-session h2 {
      margin: 0 0 20px 0;
      color: #495057;
      font-size: 1.5rem;
    }

    .time-display {
      font-size: 3rem;
      font-weight: 700;
      color: #007bff;
      margin: 10px 0;
      font-family: 'Monaco', 'Menlo', monospace;
    }

    .current-time {
      font-size: 4rem;
    }

    .session-info {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-top: 15px;
      font-size: 1.1rem;
    }

    .status {
      padding: 5px 12px;
      border-radius: 15px;
      font-weight: 600;
      text-transform: uppercase;
      font-size: 0.9rem;
    }

    .status-stopped {
      background: #dc3545;
      color: white;
    }

    .status-running {
      background: #28a745;
      color: white;
    }

    .status-paused {
      background: #ffc107;
      color: #212529;
    }

    .sessions-count {
      color: #6c757d;
    }

    .daily-summary {
      background: white;
      padding: 25px;
      border-radius: 12px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }

    .summary-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
      gap: 20px;
    }

    .summary-item {
      text-align: center;
      padding: 20px;
      background: #f8f9fa;
      border-radius: 8px;
    }

    .summary-item h3 {
      margin: 0 0 10px 0;
      color: #495057;
      font-size: 1rem;
      font-weight: 600;
    }

    .summary-item .time-display {
      font-size: 1.5rem;
      color: #007bff;
    }

    .daily-limit {
      background: white;
      padding: 25px;
      border-radius: 12px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }

    .daily-limit h2 {
      margin: 0 0 20px 0;
      color: #495057;
      font-size: 1.5rem;
      text-align: center;
    }

    .progress-container {
      margin-bottom: 20px;
    }

    .progress-bar {
      width: 100%;
      height: 20px;
      background: #e9ecef;
      border-radius: 10px;
      overflow: hidden;
      position: relative;
    }

    .progress-fill {
      height: 100%;
      background: linear-gradient(90deg, #28a745 0%, #ffc107 70%, #dc3545 100%);
      transition: width 0.3s ease;
    }

    .progress-text {
      text-align: center;
      margin-top: 10px;
      font-weight: 600;
      color: #495057;
    }

    .limit-info {
      display: flex;
      justify-content: center;
    }

    .remaining-time {
      text-align: center;
    }

    .remaining-time h3 {
      margin: 0 0 10px 0;
      color: #495057;
      font-size: 1.2rem;
    }

    .remaining-time .time-display {
      font-size: 2rem;
      color: #28a745;
    }

    .remaining-time .time-display.complete {
      color: #dc3545;
    }

    .work-complete {
      background: #d4edda;
      border: 2px solid #c3e6cb;
      color: #155724;
      padding: 30px;
      border-radius: 12px;
      text-align: center;
    }

    .work-complete h2 {
      margin: 0 0 10px 0;
      font-size: 2rem;
    }

    .work-complete p {
      margin: 0;
      font-size: 1.1rem;
    }

    @media (max-width: 768px) {
      .dashboard {
        padding: 15px;
      }

      .timer-controls {
        flex-direction: column;
        align-items: center;
      }

      .btn {
        width: 200px;
      }

      .current-time {
        font-size: 2.5rem;
      }

      .time-display {
        font-size: 2rem;
      }

      .summary-grid {
        grid-template-columns: 1fr;
      }
    }
  `]
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