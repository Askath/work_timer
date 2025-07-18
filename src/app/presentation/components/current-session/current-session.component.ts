/**
 * @fileoverview Current session dumb component for displaying session time and status.
 * @author Work Timer Application
 */

import { Component, input, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CurrentSessionData } from '../../interfaces/component-data.interfaces';

/**
 * Dumb component for displaying current session time, status, and count.
 * Receives all data through inputs and emits no events.
 * @class
 */
@Component({
  selector: 'app-current-session',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './current-session.component.html',
  styleUrl: './current-session.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CurrentSessionComponent {
  /** Current session data containing time, status, and count */
  readonly data = input.required<CurrentSessionData>();
}