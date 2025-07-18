/**
 * @fileoverview Date and time utilities adapter.
 * @author Work Timer Application
 */

import { Injectable } from '@angular/core';
import { WorkDayDate } from '../../domain/index';

export interface DateTimeAdapter {
  getCurrentDate(): WorkDayDate;
  isToday(date: WorkDayDate): boolean;
  formatTime(totalMinutes: number): string;
  formatDuration(startTime: Date, endTime?: Date): string;
  getTimezoneOffset(): number;
}

@Injectable({
  providedIn: 'root'
})
export class SystemDateTimeAdapter implements DateTimeAdapter {
  
  getCurrentDate(): WorkDayDate {
    return WorkDayDate.today();
  }
  
  isToday(date: WorkDayDate): boolean {
    return date.isToday();
  }
  
  formatTime(totalMinutes: number): string {
    const hours = Math.floor(totalMinutes / 60);
    const minutes = Math.floor(totalMinutes % 60);
    const seconds = Math.floor((totalMinutes % 1) * 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes}m ${seconds}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds}s`;
    } else {
      return `${seconds}s`;
    }
  }
  
  formatDuration(startTime: Date, endTime?: Date): string {
    const end = endTime || new Date();
    const durationMs = end.getTime() - startTime.getTime();
    const totalMinutes = durationMs / (1000 * 60);
    
    return this.formatTime(totalMinutes);
  }
  
  getTimezoneOffset(): number {
    return new Date().getTimezoneOffset();
  }
}