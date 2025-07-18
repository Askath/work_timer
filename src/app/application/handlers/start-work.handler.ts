/**
 * @fileoverview Start work command handler.
 * @author Work Timer Application
 */

import { Injectable } from '@angular/core';
import { StartWorkCommand } from '../commands/start-work.command';
import { TimerApplicationService } from '../services/timer-application.service';

@Injectable({
  providedIn: 'root'
})
export class StartWorkHandler {
  constructor(private timerApplicationService: TimerApplicationService) {}

  async handle(command: StartWorkCommand): Promise<void> {
    this.timerApplicationService.startWork();
  }
}