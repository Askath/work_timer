/**
 * @fileoverview Root application component for the work timer application.
 * @author Work Timer Application
 */

import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { DashboardContainer } from './presentation/containers/dashboard/dashboard.container';

/**
 * Root application component that hosts the main dashboard.
 * Uses Angular's standalone component architecture.
 * @class
 */
@Component({
  selector: 'app-root',
  imports: [RouterOutlet, DashboardContainer],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  /** Application title signal */
  protected readonly title = signal('work_timer');
}
