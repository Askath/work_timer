/**
 * @fileoverview Stop work command handler.
 * @author Work Timer Application
 */

import { Injectable } from '@angular/core';
import { StopWorkCommand } from '../commands/stop-work.command';
import { TimerApplicationService } from '../services/timer-application.service';

@Injectable({
  providedIn: 'root'
})
export class StopWorkHandler {
  constructor(private timerApplicationService: TimerApplicationService) {}

  async handle(command: StopWorkCommand): Promise<void> {
    this.timerApplicationService.stopWork();
  }
}