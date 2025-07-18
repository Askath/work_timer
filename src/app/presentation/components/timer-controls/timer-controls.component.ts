/**
 * @fileoverview Timer controls dumb component for start/stop/reset buttons.
 * @author Work Timer Application
 */

import { Component, input, output } from '@angular/core';
import { TimerControlsData, TimerControlsEvents } from '../../interfaces/component-data.interfaces';

/**
 * Dumb component for timer control buttons (start/stop/reset).
 * Receives data through inputs and emits events through outputs.
 * @class
 */
@Component({
  selector: 'app-timer-controls',
  standalone: true,
  templateUrl: './timer-controls.component.html',
  styleUrl: './timer-controls.component.css'
})
export class TimerControlsComponent {
  /** Timer controls data containing button states and text */
  readonly data = input.required<TimerControlsData>();

  /** Event emitted when start/stop button is clicked */
  readonly startStopClicked = output<void>();

  /** Event emitted when reset button is clicked */
  readonly resetClicked = output<void>();

  /**
   * Handles start/stop button click by emitting the appropriate event.
   */
  onStartStopClick(): void {
    this.startStopClicked.emit();
  }

  /**
   * Handles reset button click by emitting the appropriate event.
   */
  onResetClick(): void {
    this.resetClicked.emit();
  }
}