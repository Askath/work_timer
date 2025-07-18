/**
 * @fileoverview Get current session query handler.
 * @author Work Timer Application
 */

import { Injectable } from '@angular/core';
import { GetCurrentSessionQuery } from '../queries/get-current-session.query';
import { TimerApplicationService } from '../services/timer-application.service';
import { WorkSession } from '../../domain';

@Injectable({
  providedIn: 'root'
})
export class GetCurrentSessionHandler {
  constructor(private timerApplicationService: TimerApplicationService) {}

  async handle(query: GetCurrentSessionQuery): Promise<WorkSession | null> {
    const state = this.timerApplicationService.getCurrentState();
    return state.workDay.currentSession;
  }
}