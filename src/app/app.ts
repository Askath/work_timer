/**
 * @fileoverview Root application component for the work timer application.
 * @author Work Timer Application
 */

import { Component, signal, inject, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { DashboardContainer } from './presentation/containers/dashboard/dashboard.container';
import { AppInitializationService } from './infrastructure/services/app-initialization.service';

/**
 * Root application component that hosts the main dashboard.
 * Uses Angular's standalone component architecture.
 * @class
 */
@Component({
  selector: 'app-root',
  imports: [RouterOutlet, DashboardContainer, CommonModule],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App implements OnInit {
  /** Application title signal */
  protected readonly title = signal('work_timer');
  
  /** Initialization status signal */
  protected readonly isInitialized = signal(false);
  
  /** Initialization error signal */
  protected readonly initializationError = signal<string | null>(null);
  
  /** Injected initialization service */
  private readonly initializationService = inject(AppInitializationService);

  async ngOnInit(): Promise<void> {
    try {
      await this.initializationService.initialize();
      this.isInitialized.set(true);
    } catch (error) {
      console.error('Failed to initialize app:', error);
      this.initializationError.set(
        error instanceof Error ? error.message : 'Unknown initialization error'
      );
    }
  }
}
