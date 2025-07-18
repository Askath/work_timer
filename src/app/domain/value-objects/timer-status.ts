/**
 * @fileoverview TimerStatus value object representing the state of the timer.
 * @author Work Timer Application
 */

export class TimerStatus {
  static readonly STOPPED = new TimerStatus('STOPPED');
  static readonly RUNNING = new TimerStatus('RUNNING');
  static readonly PAUSED = new TimerStatus('PAUSED');

  private constructor(public readonly value: 'STOPPED' | 'RUNNING' | 'PAUSED') {}

  isStopped(): boolean {
    return this.value === 'STOPPED';
  }

  isRunning(): boolean {
    return this.value === 'RUNNING';
  }

  isPaused(): boolean {
    return this.value === 'PAUSED';
  }

  equals(other: TimerStatus): boolean {
    return this.value === other.value;
  }

  canTransitionTo(newStatus: TimerStatus): boolean {
    switch (this.value) {
      case 'STOPPED':
        return newStatus.isRunning();
      case 'RUNNING':
        return newStatus.isPaused();
      case 'PAUSED':
        return newStatus.isRunning();
      default:
        return false;
    }
  }

  getDisplayText(): string {
    switch (this.value) {
      case 'STOPPED':
        return 'Stopped';
      case 'RUNNING':
        return 'Running';
      case 'PAUSED':
        return 'Paused';
      default:
        return 'Unknown';
    }
  }

  getCssClass(): string {
    return `status-${this.value.toLowerCase()}`;
  }
}