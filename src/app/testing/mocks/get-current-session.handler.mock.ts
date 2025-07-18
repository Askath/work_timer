/**
 * @fileoverview Mock implementation of GetCurrentSessionHandler for testing.
 * @author Work Timer Application
 */

import { Injectable } from '@angular/core';
import { GetCurrentSessionHandler } from '../../application/handlers/get-current-session.handler';
import { GetCurrentSessionQuery } from '../../application/queries/get-current-session.query';

@Injectable()
export class MockGetCurrentSessionHandler implements Partial<GetCurrentSessionHandler> {
  handle = jasmine.createSpy('handle').and.returnValue(Promise.resolve(null));
}