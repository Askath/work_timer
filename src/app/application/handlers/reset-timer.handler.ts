/**
 * @fileoverview Reset timer command handler.
 * @author Work Timer Application
 */

import { Injectable } from '@angular/core';
import { ResetTimerCommand } from '../commands/reset-timer.command';
import { TimerApplicationService } from '../services/timer-application.service';

@Injectable({
  providedIn: 'root'
})
export class ResetTimerHandler {
  constructor(private timerApplicationService: TimerApplicationService) {}

  async handle(command: ResetTimerCommand): Promise<void> {
    this.timerApplicationService.resetTimer();
  }
}