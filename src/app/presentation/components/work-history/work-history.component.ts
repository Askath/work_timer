/**
 * @fileoverview Work history component for displaying past work sessions.
 * @author Work Timer Application
 */

import { Component, signal, computed, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { WorkSession, WorkDay, WorkDayDate } from '../../../domain/index';
import { WorkDayRepository } from '../../../domain/repositories/work-day.repository';
import { WorkSessionRepository } from '../../../domain/repositories/work-session.repository';
import { WORK_DAY_REPOSITORY, WORK_SESSION_REPOSITORY } from '../../../domain/repositories/injection-tokens';

interface WorkHistoryEntry {
  date: string;
  workDay: WorkDay;
  sessions: WorkSession[];
  totalWorkTime: string;
  effectiveWorkTime: string;
  sessionCount: number;
}

@Component({
  selector: 'app-work-history',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="work-history">
      <div class="history-header">
        <h2>Work History</h2>
        <button 
          class="refresh-btn" 
          (click)="loadHistory()"
          [disabled]="isLoading()">
          @if (isLoading()) {
            Loading...
          } @else {
            Refresh
          }
        </button>
      </div>

      @if (error()) {
        <div class="error-message">
          <p>Error loading work history: {{ error() }}</p>
          <button (click)="loadHistory()">Retry</button>
        </div>
      }

      @if (historyEntries().length === 0 && !isLoading() && !error()) {
        <div class="no-data">
          <p>No work history found. Start working to see your progress here!</p>
        </div>
      }

      @for (entry of historyEntries(); track entry.date) {
        <div class="history-entry">
          <div class="entry-header">
            <h3>{{ formatDate(entry.date) }}</h3>
            <div class="entry-summary">
              <span class="total-time">{{ entry.totalWorkTime }}</span>
              <span class="session-count">{{ entry.sessionCount }} session{{ entry.sessionCount !== 1 ? 's' : '' }}</span>
            </div>
          </div>
          
          <div class="sessions-list">
            @for (session of entry.sessions; track session.id) {
              <div class="session-item">
                <div class="session-info">
                  <span class="session-time">
                    {{ formatTime(session.startTime) }} - 
                    {{ session.endTime ? formatTime(session.endTime) : 'In progress' }}
                  </span>
                  <span class="session-duration">
                    {{ formatDuration(session.duration.milliseconds) }}
                  </span>
                </div>
                @if (editingSession() === session.id) {
                  <div class="session-edit">
                    <input 
                      type="datetime-local" 
                      [(ngModel)]="editStartTime"
                      class="time-input">
                    <input 
                      type="datetime-local" 
                      [(ngModel)]="editEndTime"
                      class="time-input">
                    <button (click)="saveSessionEdit(session)" class="save-btn">Save</button>
                    <button (click)="cancelEdit()" class="cancel-btn">Cancel</button>
                  </div>
                } @else {
                  <div class="session-actions">
                    <button (click)="startEditSession(session)" class="edit-btn">Edit</button>
                    <button (click)="deleteSession(session)" class="delete-btn">Delete</button>
                  </div>
                }
              </div>
            }
          </div>
        </div>
      }
    </div>
  `,
  styleUrl: './work-history.component.css'
})
export class WorkHistoryComponent implements OnInit {
  private workDayRepository = inject(WORK_DAY_REPOSITORY);
  private workSessionRepository = inject(WORK_SESSION_REPOSITORY);

  private readonly _historyEntries = signal<WorkHistoryEntry[]>([]);
  private readonly _isLoading = signal(false);
  private readonly _error = signal<string | null>(null);
  private readonly _editingSession = signal<string | null>(null);

  editStartTime = '';
  editEndTime = '';

  readonly historyEntries = computed(() => this._historyEntries());
  readonly isLoading = computed(() => this._isLoading());
  readonly error = computed(() => this._error());
  readonly editingSession = computed(() => this._editingSession());

  async ngOnInit(): Promise<void> {
    await this.loadHistory();
  }

  async loadHistory(): Promise<void> {
    this._isLoading.set(true);
    this._error.set(null);

    try {
      const workDays = await this.workDayRepository.findAll();
      const entries: WorkHistoryEntry[] = [];

      for (const workDay of workDays) {
        if (workDay.hasActivity()) {
          const sessions = await this.workSessionRepository.findByDate(workDay.date);
          const completedSessions = sessions.filter(s => s.isCompleted);
          
          const totalWorkTime = workDay.calculateTotalWorkTime();
          const effectiveWorkTime = this.calculateEffectiveWorkTime(workDay);

          entries.push({
            date: workDay.date.toISOString(),
            workDay,
            sessions: completedSessions,
            totalWorkTime: this.formatDuration(totalWorkTime.milliseconds),
            effectiveWorkTime: this.formatDuration(effectiveWorkTime.milliseconds),
            sessionCount: completedSessions.length
          });
        }
      }

      // Sort by date descending (most recent first)
      entries.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      
      this._historyEntries.set(entries);
    } catch (error) {
      console.error('Error loading work history:', error);
      this._error.set(error instanceof Error ? error.message : 'Unknown error');
    } finally {
      this._isLoading.set(false);
    }
  }

  startEditSession(session: WorkSession): void {
    this._editingSession.set(session.id);
    this.editStartTime = this.formatDateTimeLocal(session.startTime);
    this.editEndTime = session.endTime ? this.formatDateTimeLocal(session.endTime) : '';
  }

  async saveSessionEdit(session: WorkSession): Promise<void> {
    try {
      const startTime = new Date(this.editStartTime);
      const endTime = this.editEndTime ? new Date(this.editEndTime) : null;

      if (!endTime) {
        alert('End time is required for completed sessions');
        return;
      }

      if (startTime >= endTime) {
        alert('Start time must be before end time');
        return;
      }

      // Create updated session
      const updatedSession = session.stop(endTime);
      const newSession = WorkSession.fromData({
        id: session.id,
        startTime,
        endTime,
        duration: endTime.getTime() - startTime.getTime(),
        date: session.workDate.toISOString()
      });

      await this.workSessionRepository.save(newSession);
      await this.loadHistory();
      this.cancelEdit();
      
    } catch (error) {
      console.error('Error saving session edit:', error);
      alert('Failed to save changes: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  }

  cancelEdit(): void {
    this._editingSession.set(null);
    this.editStartTime = '';
    this.editEndTime = '';
  }

  async deleteSession(session: WorkSession): Promise<void> {
    if (!confirm('Are you sure you want to delete this work session?')) {
      return;
    }

    try {
      await this.workSessionRepository.delete(session.id);
      await this.loadHistory();
    } catch (error) {
      console.error('Error deleting session:', error);
      alert('Failed to delete session: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  }

  private calculateEffectiveWorkTime(workDay: WorkDay): any {
    const totalWorkTime = workDay.calculateTotalWorkTime();
    // Simplified calculation - in real implementation, apply pause deduction logic
    return totalWorkTime;
  }

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  formatTime(date: Date): string {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  formatDuration(milliseconds: number): string {
    const totalSeconds = Math.floor(milliseconds / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    if (hours > 0) {
      return `${hours}h ${minutes}m ${seconds}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds}s`;
    } else {
      return `${seconds}s`;
    }
  }

  private formatDateTimeLocal(date: Date): string {
    const offset = date.getTimezoneOffset();
    const localDate = new Date(date.getTime() - (offset * 60 * 1000));
    return localDate.toISOString().slice(0, 16);
  }
}