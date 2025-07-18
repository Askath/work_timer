/**
 * @fileoverview Start work command handler tests.
 * @author Work Timer Application
 */

import { TestBed } from '@angular/core/testing';
import { StartWorkHandler } from './start-work.handler';
import { StartWorkCommand } from '../commands/start-work.command';
import { TimerApplicationService } from '../services/timer-application.service';
import { TestTimes } from '../../testing/helpers/time.helpers';

describe('StartWorkHandler', () => {
  let handler: StartWorkHandler;
  let mockTimerApplicationService: jasmine.SpyObj<TimerApplicationService>;

  beforeEach(() => {
    const spy = jasmine.createSpyObj('TimerApplicationService', ['startWork']);

    TestBed.configureTestingModule({
      providers: [
        StartWorkHandler,
        { provide: TimerApplicationService, useValue: spy }
      ]
    });

    handler = TestBed.inject(StartWorkHandler);
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
    it('should call startWork on timer application service', async () => {
      const command = new StartWorkCommand(TestTimes.NINE_AM);
      
      await handler.handle(command);
      
      expect(mockTimerApplicationService.startWork).toHaveBeenCalledTimes(1);
    });

    it('should handle command with default timestamp', async () => {
      const command = new StartWorkCommand();
      
      await handler.handle(command);
      
      expect(mockTimerApplicationService.startWork).toHaveBeenCalledTimes(1);
    });

    it('should handle command with specific timestamp', async () => {
      const specificTime = TestTimes.TEN_AM;
      const command = new StartWorkCommand(specificTime);
      
      await handler.handle(command);
      
      expect(mockTimerApplicationService.startWork).toHaveBeenCalledTimes(1);
    });

    it('should handle command with user ID', async () => {
      const command = new StartWorkCommand(TestTimes.NINE_AM, 'user-123');
      
      await handler.handle(command);
      
      expect(mockTimerApplicationService.startWork).toHaveBeenCalledTimes(1);
    });

    it('should propagate service errors', async () => {
      const command = new StartWorkCommand(TestTimes.NINE_AM);
      const error = new Error('Timer service error');
      mockTimerApplicationService.startWork.and.rejectWith(error);
      
      await expectAsync(handler.handle(command)).toBeRejectedWith(error);
    });
  });

  describe('Command Validation', () => {
    it('should handle multiple commands sequentially', async () => {
      const command1 = new StartWorkCommand(TestTimes.NINE_AM);
      const command2 = new StartWorkCommand(TestTimes.TEN_AM);
      
      await handler.handle(command1);
      await handler.handle(command2);
      
      expect(mockTimerApplicationService.startWork).toHaveBeenCalledTimes(2);
    });

    it('should not validate command content', async () => {
      // Handler should delegate validation to the service layer
      const command = new StartWorkCommand(TestTimes.NINE_AM);
      
      await handler.handle(command);
      
      expect(mockTimerApplicationService.startWork).toHaveBeenCalledTimes(1);
    });
  });

  describe('Async Behavior', () => {
    it('should complete when service completes', async () => {
      const command = new StartWorkCommand(TestTimes.NINE_AM);
      mockTimerApplicationService.startWork.and.returnValue(Promise.resolve());
      
      const result = handler.handle(command);
      
      await expectAsync(result).toBeResolved();
      expect(mockTimerApplicationService.startWork).toHaveBeenCalledTimes(1);
    });

    it('should reject when service rejects', async () => {
      const command = new StartWorkCommand(TestTimes.NINE_AM);
      const error = new Error('Service failure');
      mockTimerApplicationService.startWork.and.returnValue(Promise.reject(error));
      
      const result = handler.handle(command);
      
      await expectAsync(result).toBeRejectedWith(error);
    });
  });
});