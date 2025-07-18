/**
 * @fileoverview Mock implementation of StartWorkHandler for testing.
 * @author Work Timer Application
 */

import { Injectable } from '@angular/core';
import { StartWorkHandler } from '../../application/handlers/start-work.handler';
import { StartWorkCommand } from '../../application/commands/start-work.command';

@Injectable()
export class MockStartWorkHandler implements Partial<StartWorkHandler> {
  handle = jasmine.createSpy('handle').and.returnValue(Promise.resolve());
}