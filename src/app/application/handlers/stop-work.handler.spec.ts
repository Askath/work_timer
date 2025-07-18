/**
 * @fileoverview Stop work command handler tests.
 * @author Work Timer Application
 */

import { TestBed } from '@angular/core/testing';
import { StopWorkHandler } from './stop-work.handler';
import { StopWorkCommand } from '../commands/stop-work.command';
import { TimerApplicationService } from '../services/timer-application.service';
import { TestTimes } from '../../testing/helpers/time.helpers';

describe('StopWorkHandler', () => {
  let handler: StopWorkHandler;
  let mockTimerApplicationService: jasmine.SpyObj<TimerApplicationService>;

  beforeEach(() => {
    const spy = jasmine.createSpyObj('TimerApplicationService', ['stopWork']);

    TestBed.configureTestingModule({
      providers: [
        StopWorkHandler,
        { provide: TimerApplicationService, useValue: spy }
      ]
    });

    handler = TestBed.inject(StopWorkHandler);
    mockTimerApplicationService = TestBed.inject(TimerApplicationService) as jasmine.SpyObj<TimerApplicationService>;
  });

  describe('Handler Setup', () => {
    it('should be created', () => {
      expect(handler).toBeTruthy();
    });

    it('should inject TimerApplicationService', () => {
      expect(mockTimerApplicationService).toBeTruthy();
    });
  });

  describe('Command Handling', () => {
    it('should call stopWork on timer application service', async () => {
      const command = new StopWorkCommand(TestTimes.TEN_THIRTY_AM);
      
      await handler.handle(command);
      
      expect(mockTimerApplicationService.stopWork).toHaveBeenCalledTimes(1);
    });

    it('should handle command with default timestamp', async () => {
      const command = new StopWorkCommand();
      
      await handler.handle(command);
      
      expect(mockTimerApplicationService.stopWork).toHaveBeenCalledTimes(1);
    });

    it('should handle command with specific timestamp', async () => {
      const specificTime = TestTimes.FIVE_PM;
      const command = new StopWorkCommand(specificTime);
      
      await handler.handle(command);
      
      expect(mockTimerApplicationService.stopWork).toHaveBeenCalledTimes(1);
    });

    it('should handle command with user ID', async () => {
      const command = new StopWorkCommand(TestTimes.FIVE_PM, 'user-456');
      
      await handler.handle(command);
      
      expect(mockTimerApplicationService.stopWork).toHaveBeenCalledTimes(1);
    });

    it('should propagate service errors', async () => {
      const command = new StopWorkCommand(TestTimes.FIVE_PM);
      const error = new Error('Timer service error');
      mockTimerApplicationService.stopWork.and.throwError(error);
      
      await expectAsync(handler.handle(command)).toBeRejectedWith(error);
    });
  });

  describe('Command Validation', () => {
    it('should handle multiple commands sequentially', async () => {
      const command1 = new StopWorkCommand(TestTimes.TEN_THIRTY_AM);
      const command2 = new StopWorkCommand(TestTimes.FIVE_PM);
      
      await handler.handle(command1);
      await handler.handle(command2);
      
      expect(mockTimerApplicationService.stopWork).toHaveBeenCalledTimes(2);
    });

    it('should not validate command content', async () => {
      // Handler should delegate validation to the service layer
      const command = new StopWorkCommand(TestTimes.FIVE_PM);
      
      await handler.handle(command);
      
      expect(mockTimerApplicationService.stopWork).toHaveBeenCalledTimes(1);
    });
  });

  describe('Async Behavior', () => {
    it('should complete when service completes', async () => {
      const command = new StopWorkCommand(TestTimes.FIVE_PM);
      mockTimerApplicationService.stopWork.and.returnValue(undefined);
      
      const result = handler.handle(command);
      
      await expectAsync(result).toBeResolved();
      expect(mockTimerApplicationService.stopWork).toHaveBeenCalledTimes(1);
    });

    it('should reject when service rejects', async () => {
      const command = new StopWorkCommand(TestTimes.FIVE_PM);
      const error = new Error('Service failure');
      mockTimerApplicationService.stopWork.and.throwError(error);
      
      const result = handler.handle(command);
      
      await expectAsync(result).toBeRejectedWith(error);
    });
  });

  describe('Business Context', () => {
    it('should handle work session completion', async () => {
      const workEndTime = TestTimes.FIVE_PM;
      const command = new StopWorkCommand(workEndTime);
      
      await handler.handle(command);
      
      expect(mockTimerApplicationService.stopWork).toHaveBeenCalledTimes(1);
    });

    it('should handle pause scenarios', async () => {
      const pauseTime = TestTimes.NOON;
      const command = new StopWorkCommand(pauseTime);
      
      await handler.handle(command);
      
      expect(mockTimerApplicationService.stopWork).toHaveBeenCalledTimes(1);
    });
  });
});