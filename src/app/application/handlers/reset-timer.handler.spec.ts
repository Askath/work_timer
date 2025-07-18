/**
 * @fileoverview Reset timer command handler tests.
 * @author Work Timer Application
 */

import { TestBed } from '@angular/core/testing';
import { ResetTimerHandler } from './reset-timer.handler';
import { ResetTimerCommand } from '../commands/reset-timer.command';
import { TimerApplicationService } from '../services/timer-application.service';

describe('ResetTimerHandler', () => {
  let handler: ResetTimerHandler;
  let mockTimerApplicationService: jasmine.SpyObj<TimerApplicationService>;

  beforeEach(() => {
    const spy = jasmine.createSpyObj('TimerApplicationService', ['resetTimer']);

    TestBed.configureTestingModule({
      providers: [
        ResetTimerHandler,
        { provide: TimerApplicationService, useValue: spy }
      ]
    });

    handler = TestBed.inject(ResetTimerHandler);
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
    it('should call resetTimer on timer application service', async () => {
      const command = new ResetTimerCommand();
      
      await handler.handle(command);
      
      expect(mockTimerApplicationService.resetTimer).toHaveBeenCalledTimes(1);
    });

    it('should handle command with user ID', async () => {
      const command = new ResetTimerCommand('user-789');
      
      await handler.handle(command);
      
      expect(mockTimerApplicationService.resetTimer).toHaveBeenCalledTimes(1);
    });

    it('should propagate service errors', async () => {
      const command = new ResetTimerCommand();
      const error = new Error('Reset service error');
      mockTimerApplicationService.resetTimer.and.rejectWith(error);
      
      await expectAsync(handler.handle(command)).toBeRejectedWith(error);
    });
  });

  describe('Command Validation', () => {
    it('should handle multiple reset commands sequentially', async () => {
      const command1 = new ResetTimerCommand();
      const command2 = new ResetTimerCommand('user-123');
      
      await handler.handle(command1);
      await handler.handle(command2);
      
      expect(mockTimerApplicationService.resetTimer).toHaveBeenCalledTimes(2);
    });

    it('should not validate command content', async () => {
      // Handler should delegate validation to the service layer
      const command = new ResetTimerCommand();
      
      await handler.handle(command);
      
      expect(mockTimerApplicationService.resetTimer).toHaveBeenCalledTimes(1);
    });
  });

  describe('Async Behavior', () => {
    it('should complete when service completes', async () => {
      const command = new ResetTimerCommand();
      mockTimerApplicationService.resetTimer.and.returnValue(Promise.resolve());
      
      const result = handler.handle(command);
      
      await expectAsync(result).toBeResolved();
      expect(mockTimerApplicationService.resetTimer).toHaveBeenCalledTimes(1);
    });

    it('should reject when service rejects', async () => {
      const command = new ResetTimerCommand();
      const error = new Error('Service failure');
      mockTimerApplicationService.resetTimer.and.returnValue(Promise.reject(error));
      
      const result = handler.handle(command);
      
      await expectAsync(result).toBeRejectedWith(error);
    });
  });

  describe('Business Context', () => {
    it('should handle day reset scenarios', async () => {
      const command = new ResetTimerCommand();
      
      await handler.handle(command);
      
      expect(mockTimerApplicationService.resetTimer).toHaveBeenCalledTimes(1);
    });

    it('should handle error recovery scenarios', async () => {
      const command = new ResetTimerCommand('recovery-user');
      
      await handler.handle(command);
      
      expect(mockTimerApplicationService.resetTimer).toHaveBeenCalledTimes(1);
    });

    it('should handle concurrent reset attempts', async () => {
      const command1 = new ResetTimerCommand();
      const command2 = new ResetTimerCommand();
      
      const promise1 = handler.handle(command1);
      const promise2 = handler.handle(command2);
      
      await Promise.all([promise1, promise2]);
      
      expect(mockTimerApplicationService.resetTimer).toHaveBeenCalledTimes(2);
    });
  });
});