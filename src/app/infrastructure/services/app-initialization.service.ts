/**
 * @fileoverview App initialization service for setting up HTTP backend connection.
 * @author Work Timer Application
 */

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AppInitializationService {
  private isInitialized = false;

  constructor(private http: HttpClient) {}

  async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    try {
      console.log('Connecting to work timer backend...');
      
      // Check if backend is available
      await firstValueFrom(this.http.get('/api/health'));
      
      this.isInitialized = true;
      console.log('App initialization completed successfully');
    } catch (error) {
      console.error('Failed to initialize app:', error);
      throw new Error('Unable to connect to backend server. Please ensure the Node.js server is running on port 3001.');
    }
  }

  getInitializationStatus(): boolean {
    return this.isInitialized;
  }
}