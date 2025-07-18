/**
 * @fileoverview Mock implementation of StopWorkHandler for testing.
 * @author Work Timer Application
 */

import { Injectable } from '@angular/core';
import { StopWorkHandler } from '../../application/handlers/stop-work.handler';
import { StopWorkCommand } from '../../application/commands/stop-work.command';

@Injectable()
export class MockStopWorkHandler implements Partial<StopWorkHandler> {
  handle = jasmine.createSpy('handle').and.returnValue(Promise.resolve());
}