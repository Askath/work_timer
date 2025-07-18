/**
 * @fileoverview WorkSession entity representing a single work period.
 * @author Work Timer Application
 */

import { Duration } from '../value-objects/duration';
import { WorkDayDate } from '../value-objects/work-day-date';

export class WorkSession {
  private constructor(
    public readonly id: string,
    public readonly startTime: Date,
    public readonly endTime: Date | null,
    public readonly workDate: WorkDayDate,
    private _duration: Duration
  ) {}

  static create(startTime: Date): WorkSession {
    const id = `${startTime.getTime()}-${Math.random().toString(36).substring(2, 9)}`;
    const workDate = WorkDayDate.fromDate(startTime);
    return new WorkSession(id, startTime, null, workDate, Duration.zero());
  }

  static fromData(data: { 
    id: string; 
    startTime: Date; 
    endTime: Date | null; 
    duration: number;
    date: string;
  }): WorkSession {
    const workDate = WorkDayDate.fromString(data.date);
    return new WorkSession(
      data.id, 
      data.startTime, 
      data.endTime, 
      workDate, 
      Duration.fromMilliseconds(data.duration)
    );
  }

  get duration(): Duration {
    return this._duration;
  }

  get isRunning(): boolean {
    return this.endTime === null;
  }

  get isCompleted(): boolean {
    return this.endTime !== null;
  }

  stop(endTime: Date): WorkSession {
    if (this.isCompleted) {
      throw new Error('Work session has already been stopped.');
    }
    
    if (endTime.getTime() <= this.startTime.getTime()) {
      throw new Error('End time must be after start time.');
    }

    const duration = Duration.fromMilliseconds(endTime.getTime() - this.startTime.getTime());
    return new WorkSession(this.id, this.startTime, endTime, this.workDate, duration);
  }

  updateCurrentDuration(currentTime: Date): Duration {
    if (this.isCompleted) {
      return this._duration;
    }
    return Duration.fromMilliseconds(currentTime.getTime() - this.startTime.getTime());
  }

  toData(): { 
    id: string; 
    startTime: Date; 
    endTime: Date | null; 
    duration: number;
    date: string;
  } {
    return {
      id: this.id,
      startTime: this.startTime,
      endTime: this.endTime,
      duration: this._duration.milliseconds,
      date: this.workDate.toISOString()
    };
  }

  equals(other: WorkSession): boolean {
    return this.id === other.id;
  }
}