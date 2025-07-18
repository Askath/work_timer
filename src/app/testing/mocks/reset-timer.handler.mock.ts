/**
 * @fileoverview Mock implementation of ResetTimerHandler for testing.
 * @author Work Timer Application
 */

import { Injectable } from '@angular/core';
import { ResetTimerHandler } from '../../application/handlers/reset-timer.handler';
import { ResetTimerCommand } from '../../application/commands/reset-timer.command';

@Injectable()
export class MockResetTimerHandler implements Partial<ResetTimerHandler> {
  handle = jasmine.createSpy('handle').and.returnValue(Promise.resolve());
}