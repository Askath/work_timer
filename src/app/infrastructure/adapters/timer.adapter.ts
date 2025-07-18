/**
 * @fileoverview System timer adapter for abstracting time-related operations.
 * @author Work Timer Application
 */

import { Injectable } from '@angular/core';

export interface TimerAdapter {
  getCurrentTime(): Date;
  createInterval(callback: () => void, intervalMs: number): TimerHandle;
  clearInterval(handle: TimerHandle): void;
  setTimeout(callback: () => void, delayMs: number): TimerHandle;
  clearTimeout(handle: TimerHandle): void;
}

export interface TimerHandle {
  readonly id: number;
}

@Injectable({
  providedIn: 'root'
})
export class SystemTimerAdapter implements TimerAdapter {
  
  getCurrentTime(): Date {
    return new Date();
  }
  
  createInterval(callback: () => void, intervalMs: number): TimerHandle {
    const id = window.setInterval(callback, intervalMs);
    return { id };
  }
  
  clearInterval(handle: TimerHandle): void {
    window.clearInterval(handle.id);
  }
  
  setTimeout(callback: () => void, delayMs: number): TimerHandle {
    const id = window.setTimeout(callback, delayMs);
    return { id };
  }
  
  clearTimeout(handle: TimerHandle): void {
    window.clearTimeout(handle.id);
  }
}