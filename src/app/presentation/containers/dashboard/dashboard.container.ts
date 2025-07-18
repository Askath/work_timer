/**
 * @fileoverview Dashboard container (smart component) for coordinating timer UI.
 * @author Work Timer Application
 */

import { Component, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TimerFacade } from '../../../application/facades/timer.facade';
import { 
  DashboardData, 
  HeaderData, 
  TimerControlsData, 
  CurrentSessionData, 
  DailySummaryData, 
  ProgressData 
} from '../../interfaces/component-data.interfaces';
import { AppHeaderComponent } from '../../components/app-header/app-header.component';
import { TimerControlsComponent } from '../../components/timer-controls/timer-controls.component';
import { CurrentSessionComponent } from '../../components/current-session/current-session.component';
import { DailySummaryComponent } from '../../components/daily-summary/daily-summary.component';
import { ProgressDisplayComponent } from '../../components/progress-display/progress-display.component';
import { WorkCompleteComponent } from '../../components/work-complete/work-complete.component';

/**
 * Smart container component that coordinates all dashboard UI components.
 * Manages data flow and event handling between dumb components and the facade.
 * @class
 */
@Component({
  selector: 'app-dashboard-container',
  standalone: true,
  imports: [
    CommonModule,
    AppHeaderComponent,
    TimerControlsComponent,
    CurrentSessionComponent,
    DailySummaryComponent,
    ProgressDisplayComponent,
    WorkCompleteComponent
  ],
  templateUrl: './dashboard.container.html',
  styleUrl: './dashboard.container.css'
})
export class DashboardContainer {
  /** Injected timer facade for timer operations */
  private readonly timerFacade = inject(TimerFacade);

  /** Computed header data for app header component */
  readonly headerData = computed<HeaderData>(() => ({
    title: 'Work Timer',
    currentDate: this.timerFacade.currentDate
  }));

  /** Computed timer controls data for timer controls component */
  readonly controlsData = computed<TimerControlsData>(() => ({
    buttonText: this.timerFacade.buttonText(),
    isRunning: this.timerFacade.currentStatus().isRunning(),
    isDisabled: this.timerFacade.isWorkComplete(),
    canReset: this.timerFacade.currentWorkTime().milliseconds > 0
  }));

  /** Computed current session data for current session component */
  readonly sessionData = computed<CurrentSessionData>(() => ({
    sessionTime: this.timerFacade.formattedCurrentSession(),
    status: this.timerFacade.statusText(),
    statusClass: this.getStatusClass(),
    sessionCount: this.timerFacade.sessionsCount()
  }));

  /** Computed daily summary data for daily summary component */
  readonly summaryData = computed<DailySummaryData>(() => ({
    totalWorkTime: this.timerFacade.formattedCurrentTime(),
    effectiveWorkTime: this.timerFacade.formattedEffectiveTime(),
    pauseTime: this.timerFacade.formattedPauseTime(),
    pauseDeduction: this.timerFacade.pauseDeduction().format()
  }));

  /** Computed progress data for progress display component */
  readonly progressData = computed<ProgressData>(() => ({
    progressPercentage: this.timerFacade.progressPercentage(),
    progressText: this.timerFacade.getProgressText(),
    remainingTime: this.timerFacade.formattedRemainingTime(),
    isComplete: this.timerFacade.isWorkComplete()
  }));

  /** Computed work complete status */
  readonly isWorkComplete = computed(() => this.timerFacade.isWorkComplete());

  /** Combined dashboard data for potential unified data passing */
  readonly dashboardData = computed<DashboardData>(() => ({
    header: this.headerData(),
    controls: this.controlsData(),
    session: this.sessionData(),
    summary: this.summaryData(),
    progress: this.progressData(),
    isWorkComplete: this.isWorkComplete()
  }));

  /**
   * Handles start/stop button click from timer controls component.
   * Toggles the timer between start/stop states.
   */
  onStartStopClick(): void {
    if (this.timerFacade.currentStatus().isRunning()) {
      this.timerFacade.stopWork();
    } else {
      this.timerFacade.startWork();
    }
  }

  /**
   * Handles reset button click from timer controls component.
   * Shows confirmation dialog before clearing all data.
   */
  onResetClick(): void {
    if (confirm('Are you sure you want to reset the timer? This will clear all data for today.')) {
      this.timerFacade.resetTimer();
    }
  }

  /**
   * Gets the CSS class for the current timer status.
   * @returns {string} CSS class name for status styling
   */
  private getStatusClass(): string {
    const status = this.timerFacade.currentStatus();
    if (status.isRunning()) return 'status-running';
    if (status.isPaused()) return 'status-paused';
    return 'status-stopped';
  }
}