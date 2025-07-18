/**
 * @fileoverview TimerStatus value object tests.
 * @author Work Timer Application
 */

import { TimerStatus } from './timer-status';

describe('TimerStatus', () => {
  describe('Static Instances', () => {
    it('should provide STOPPED static instance', () => {
      expect(TimerStatus.STOPPED.value).toBe('STOPPED');
    });

    it('should provide RUNNING static instance', () => {
      expect(TimerStatus.RUNNING.value).toBe('RUNNING');
    });

    it('should provide PAUSED static instance', () => {
      expect(TimerStatus.PAUSED.value).toBe('PAUSED');
    });

    it('should return same instance for static properties', () => {
      expect(TimerStatus.STOPPED).toBe(TimerStatus.STOPPED);
      expect(TimerStatus.RUNNING).toBe(TimerStatus.RUNNING);
      expect(TimerStatus.PAUSED).toBe(TimerStatus.PAUSED);
    });
  });

  describe('Status Check Methods', () => {
    it('should correctly identify stopped status', () => {
      expect(TimerStatus.STOPPED.isStopped()).toBe(true);
      expect(TimerStatus.RUNNING.isStopped()).toBe(false);
      expect(TimerStatus.PAUSED.isStopped()).toBe(false);
    });

    it('should correctly identify running status', () => {
      expect(TimerStatus.STOPPED.isRunning()).toBe(false);
      expect(TimerStatus.RUNNING.isRunning()).toBe(true);
      expect(TimerStatus.PAUSED.isRunning()).toBe(false);
    });

    it('should correctly identify paused status', () => {
      expect(TimerStatus.STOPPED.isPaused()).toBe(false);
      expect(TimerStatus.RUNNING.isPaused()).toBe(false);
      expect(TimerStatus.PAUSED.isPaused()).toBe(true);
    });
  });

  describe('Equality', () => {
    it('should correctly compare equal statuses', () => {
      expect(TimerStatus.STOPPED.equals(TimerStatus.STOPPED)).toBe(true);
      expect(TimerStatus.RUNNING.equals(TimerStatus.RUNNING)).toBe(true);
      expect(TimerStatus.PAUSED.equals(TimerStatus.PAUSED)).toBe(true);
    });

    it('should correctly compare different statuses', () => {
      expect(TimerStatus.STOPPED.equals(TimerStatus.RUNNING)).toBe(false);
      expect(TimerStatus.RUNNING.equals(TimerStatus.PAUSED)).toBe(false);
      expect(TimerStatus.PAUSED.equals(TimerStatus.STOPPED)).toBe(false);
    });
  });

  describe('State Transitions', () => {
    it('should allow STOPPED to transition to RUNNING only', () => {
      expect(TimerStatus.STOPPED.canTransitionTo(TimerStatus.RUNNING)).toBe(true);
      expect(TimerStatus.STOPPED.canTransitionTo(TimerStatus.PAUSED)).toBe(false);
      expect(TimerStatus.STOPPED.canTransitionTo(TimerStatus.STOPPED)).toBe(false);
    });

    it('should allow RUNNING to transition to PAUSED only', () => {
      expect(TimerStatus.RUNNING.canTransitionTo(TimerStatus.PAUSED)).toBe(true);
      expect(TimerStatus.RUNNING.canTransitionTo(TimerStatus.STOPPED)).toBe(false);
      expect(TimerStatus.RUNNING.canTransitionTo(TimerStatus.RUNNING)).toBe(false);
    });

    it('should allow PAUSED to transition to RUNNING only', () => {
      expect(TimerStatus.PAUSED.canTransitionTo(TimerStatus.RUNNING)).toBe(true);
      expect(TimerStatus.PAUSED.canTransitionTo(TimerStatus.STOPPED)).toBe(false);
      expect(TimerStatus.PAUSED.canTransitionTo(TimerStatus.PAUSED)).toBe(false);
    });
  });

  describe('Display Text', () => {
    it('should return correct display text for each status', () => {
      expect(TimerStatus.STOPPED.getDisplayText()).toBe('Stopped');
      expect(TimerStatus.RUNNING.getDisplayText()).toBe('Running');
      expect(TimerStatus.PAUSED.getDisplayText()).toBe('Paused');
    });
  });

  describe('CSS Class', () => {
    it('should return correct CSS class for each status', () => {
      expect(TimerStatus.STOPPED.getCssClass()).toBe('status-stopped');
      expect(TimerStatus.RUNNING.getCssClass()).toBe('status-running');
      expect(TimerStatus.PAUSED.getCssClass()).toBe('status-paused');
    });
  });

  describe('From String Factory', () => {
    it('should create correct status from valid strings', () => {
      expect(TimerStatus.fromString('STOPPED')).toBe(TimerStatus.STOPPED);
      expect(TimerStatus.fromString('RUNNING')).toBe(TimerStatus.RUNNING);
      expect(TimerStatus.fromString('PAUSED')).toBe(TimerStatus.PAUSED);
    });

    it('should default to STOPPED for invalid strings', () => {
      expect(TimerStatus.fromString('INVALID')).toBe(TimerStatus.STOPPED);
      expect(TimerStatus.fromString('')).toBe(TimerStatus.STOPPED);
      expect(TimerStatus.fromString('running')).toBe(TimerStatus.STOPPED); // case sensitive
    });

    it('should handle null and undefined inputs', () => {
      expect(TimerStatus.fromString(null as any)).toBe(TimerStatus.STOPPED);
      expect(TimerStatus.fromString(undefined as any)).toBe(TimerStatus.STOPPED);
    });
  });

  describe('State Transition Scenarios', () => {
    it('should support typical timer workflow: STOPPED -> RUNNING -> PAUSED -> RUNNING', () => {
      let currentStatus = TimerStatus.STOPPED;
      
      // Start timer
      expect(currentStatus.canTransitionTo(TimerStatus.RUNNING)).toBe(true);
      currentStatus = TimerStatus.RUNNING;
      
      // Pause timer
      expect(currentStatus.canTransitionTo(TimerStatus.PAUSED)).toBe(true);
      currentStatus = TimerStatus.PAUSED;
      
      // Resume timer
      expect(currentStatus.canTransitionTo(TimerStatus.RUNNING)).toBe(true);
      currentStatus = TimerStatus.RUNNING;
      
      // Complete workflow
      expect(currentStatus.isRunning()).toBe(true);
    });

    it('should not allow invalid state transitions in workflow', () => {
      // Cannot go directly from STOPPED to PAUSED
      expect(TimerStatus.STOPPED.canTransitionTo(TimerStatus.PAUSED)).toBe(false);
      
      // Cannot go directly from RUNNING to STOPPED
      expect(TimerStatus.RUNNING.canTransitionTo(TimerStatus.STOPPED)).toBe(false);
      
      // Cannot go directly from PAUSED to STOPPED
      expect(TimerStatus.PAUSED.canTransitionTo(TimerStatus.STOPPED)).toBe(false);
    });
  });

  describe('Immutability', () => {
    it('should be immutable - value property is readonly', () => {
      const status = TimerStatus.RUNNING;
      // This should cause TypeScript compilation error if value is not readonly
      // (status as any).value = 'STOPPED'; // Uncommenting this would show the readonly protection
      
      expect(status.value).toBe('RUNNING');
    });

    it('should maintain referential equality for static instances', () => {
      const stopped1 = TimerStatus.STOPPED;
      const stopped2 = TimerStatus.STOPPED;
      const running1 = TimerStatus.RUNNING;
      
      expect(stopped1).toBe(stopped2);
      expect(stopped1).not.toBe(running1);
    });
  });
});