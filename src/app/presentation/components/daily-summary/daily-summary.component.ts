/**
 * @fileoverview Daily summary dumb component for displaying work metrics.
 * @author Work Timer Application
 */

import { Component, input } from '@angular/core';
import { DailySummaryData } from '../../interfaces/component-data.interfaces';

/**
 * Dumb component for displaying daily work summary metrics.
 * Receives all data through inputs and emits no events.
 * @class
 */
@Component({
  selector: 'app-daily-summary',
  standalone: true,
  templateUrl: './daily-summary.component.html',
  styleUrl: './daily-summary.component.css'
})
export class DailySummaryComponent {
  /** Daily summary data containing work time metrics */
  readonly data = input.required<DailySummaryData>();
}