/**
 * @fileoverview App initialization service for setting up database and migrating data.
 * @author Work Timer Application
 */

import { Injectable } from '@angular/core';
import { SqliteDatabaseService } from './sqlite-database.service';

@Injectable({
  providedIn: 'root'
})
export class AppInitializationService {
  private isInitialized = false;

  constructor(private databaseService: SqliteDatabaseService) {}

  async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    try {
      console.log('Initializing SQLite database...');
      await this.databaseService.initialize();
      
      console.log('Migrating data from localStorage...');
      await this.databaseService.migrateFromLocalStorage();
      
      this.isInitialized = true;
      console.log('App initialization completed successfully');
    } catch (error) {
      console.error('Failed to initialize app:', error);
      throw error;
    }
  }

  getInitializationStatus(): boolean {
    return this.isInitialized;
  }
}