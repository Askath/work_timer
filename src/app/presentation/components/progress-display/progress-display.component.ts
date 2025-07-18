/**
 * @fileoverview Progress display dumb component for showing daily limit progress.
 * @author Work Timer Application
 */

import { Component, input } from '@angular/core';
import { ProgressData } from '../../interfaces/component-data.interfaces';

/**
 * Dumb component for displaying progress towards daily work limit.
 * Receives all data through inputs and emits no events.
 * @class
 */
@Component({
  selector: 'app-progress-display',
  standalone: true,
  templateUrl: './progress-display.component.html',
  styleUrl: './progress-display.component.css'
})
export class ProgressDisplayComponent {
  /** Progress data containing percentage, text, and remaining time */
  readonly data = input.required<ProgressData>();
}