/**
 * @fileoverview HTTP implementation of WorkSessionRepository using Node.js backend.
 * @author Work Timer Application
 */

import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { WorkSession, WorkDayDate } from '../../domain/index';
import { WorkSessionRepository } from '../../domain/repositories/work-session.repository';

@Injectable({
  providedIn: 'root'
})
export class HttpWorkSessionRepository implements WorkSessionRepository {
  private readonly baseUrl = '/api/sessions';

  constructor(private http: HttpClient) {}

  async save(session: WorkSession): Promise<void> {
    try {
      const sessionData = session.toData();
      await firstValueFrom(
        this.http.post(this.baseUrl, sessionData)
      );
    } catch (error) {
      console.error('Error saving work session via HTTP:', error);
      throw this.handleError(error, 'Failed to save work session');
    }
  }

  async findById(id: string): Promise<WorkSession | null> {
    try {
      const response = await firstValueFrom(
        this.http.get<any>(`${this.baseUrl}/${id}`)
      );
      
      return WorkSession.fromData(response);
    } catch (error) {
      if (error instanceof HttpErrorResponse && error.status === 404) {
        return null;
      }
      
      console.error('Error finding work session by id via HTTP:', error);
      throw this.handleError(error, 'Failed to find work session');
    }
  }

  async findByDate(date: WorkDayDate): Promise<WorkSession[]> {
    try {
      const dateString = date.toISOString();
      const response = await firstValueFrom(
        this.http.get<any[]>(`${this.baseUrl}?date=${encodeURIComponent(dateString)}`)
      );
      
      return response.map(sessionData => WorkSession.fromData(sessionData));
    } catch (error) {
      console.error('Error finding work sessions by date via HTTP:', error);
      throw this.handleError(error, 'Failed to load work sessions');
    }
  }

  async findAll(): Promise<WorkSession[]> {
    try {
      const response = await firstValueFrom(
        this.http.get<any[]>(this.baseUrl)
      );
      
      return response.map(sessionData => WorkSession.fromData(sessionData));
    } catch (error) {
      console.error('Error finding all work sessions via HTTP:', error);
      throw this.handleError(error, 'Failed to load work sessions');
    }
  }

  async delete(id: string): Promise<void> {
    try {
      await firstValueFrom(
        this.http.delete(`${this.baseUrl}/${id}`)
      );
    } catch (error) {
      if (error instanceof HttpErrorResponse && error.status === 404) {
        // Already deleted, consider it success
        return;
      }
      
      console.error('Error deleting work session via HTTP:', error);
      throw this.handleError(error, 'Failed to delete work session');
    }
  }

  async deleteByDate(date: WorkDayDate): Promise<void> {
    try {
      const dateString = date.toISOString();
      await firstValueFrom(
        this.http.delete(`${this.baseUrl}/by-date/${encodeURIComponent(dateString)}`)
      );
    } catch (error) {
      if (error instanceof HttpErrorResponse && error.status === 404) {
        // No sessions found for this date, consider it success
        return;
      }
      
      console.error('Error deleting work sessions by date via HTTP:', error);
      throw this.handleError(error, 'Failed to delete work sessions');
    }
  }

  /**
   * Handle HTTP errors and convert to user-friendly messages
   */
  private handleError(error: any, defaultMessage: string): Error {
    if (error instanceof HttpErrorResponse) {
      if (error.status === 0) {
        return new Error('Unable to connect to server. Please ensure the Node.js backend is running.');
      }
      
      if (error.error?.error) {
        return new Error(error.error.error);
      }
      
      return new Error(`Server error: ${error.message}`);
    }
    
    return new Error(defaultMessage);
  }
}