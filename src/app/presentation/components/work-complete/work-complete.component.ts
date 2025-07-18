/**
 * @fileoverview Work complete dumb component for displaying completion message.
 * @author Work Timer Application
 */

import { Component } from '@angular/core';

/**
 * Dumb component for displaying work completion message.
 * Pure presentation component with no inputs or outputs.
 * @class
 */
@Component({
  selector: 'app-work-complete',
  standalone: true,
  templateUrl: './work-complete.component.html',
  styleUrl: './work-complete.component.css'
})
export class WorkCompleteComponent {
  // No inputs or outputs needed - this is a static display component
}