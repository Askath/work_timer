/**
 * @fileoverview App header dumb component for displaying application title and date.
 * @author Work Timer Application
 */

import { Component, input } from '@angular/core';
import { HeaderData } from '../../interfaces/component-data.interfaces';

/**
 * Dumb component for displaying the application header with title and current date.
 * Receives all data through inputs and emits no events.
 * @class
 */
@Component({
  selector: 'app-header',
  standalone: true,
  templateUrl: './app-header.component.html',
  styleUrl: './app-header.component.css'
})
export class AppHeaderComponent {
  /** Header data containing title and current date */
  readonly data = input.required<HeaderData>();
}