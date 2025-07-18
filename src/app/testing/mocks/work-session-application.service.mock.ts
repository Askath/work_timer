/**
 * @fileoverview Mock implementation of WorkSessionApplicationService for testing.
 * @author Work Timer Application
 */

import { Injectable } from '@angular/core';
import { WorkSessionApplicationService } from '../../application/services/work-session-application.service';
import { WorkSession, Duration } from '../../domain';

@Injectable()
export class MockWorkSessionApplicationService implements Partial<WorkSessionApplicationService> {
  formatSessionsForDisplay = jasmine.createSpy('formatSessionsForDisplay').and.returnValue([]);
  
  getSessionsByDate = jasmine.createSpy('getSessionsByDate').and.returnValue([]);
  
  getTotalDurationForSessions = jasmine.createSpy('getTotalDurationForSessions').and.returnValue(Duration.zero());
  
  getAverageSessionDuration = jasmine.createSpy('getAverageSessionDuration').and.returnValue(Duration.zero());
  
  getLongestSession = jasmine.createSpy('getLongestSession').and.returnValue(null);
  
  getShortestSession = jasmine.createSpy('getShortestSession').and.returnValue(null);
  
  getSessionsInTimeRange = jasmine.createSpy('getSessionsInTimeRange').and.returnValue([]);
  
  getProductivityMetrics = jasmine.createSpy('getProductivityMetrics').and.returnValue({
    totalSessions: 0,
    totalDuration: Duration.zero(),
    averageDuration: Duration.zero(),
    longestSession: Duration.zero(),
    shortestSession: Duration.zero()
  });
}