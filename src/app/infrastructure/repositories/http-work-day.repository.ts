/**
 * @fileoverview HTTP implementation of WorkDayRepository using Node.js backend.
 * @author Work Timer Application
 */

import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { WorkDay, WorkDayDate } from '../../domain/index';
import { WorkDayRepository } from '../../domain/repositories/work-day.repository';

@Injectable({
  providedIn: 'root'
})
export class HttpWorkDayRepository implements WorkDayRepository {
  private readonly baseUrl = '/api/workdays';

  constructor(private http: HttpClient) {}

  async save(workDay: WorkDay): Promise<void> {
    try {
      const workDayData = workDay.toData();
      await firstValueFrom(
        this.http.post(this.baseUrl, workDayData)
      );
    } catch (error) {
      console.error('Error saving work day via HTTP:', error);
      throw this.handleError(error, 'Failed to save work day');
    }
  }

  async findByDate(date: WorkDayDate): Promise<WorkDay | null> {
    try {
      const dateString = date.toISOString();
      const response = await firstValueFrom(
        this.http.get<any>(`${this.baseUrl}/${dateString}`)
      );
      
      return WorkDay.fromData(response);
    } catch (error) {
      if (error instanceof HttpErrorResponse && error.status === 404) {
        return null;
      }
      
      console.error('Error finding work day by date via HTTP:', error);
      throw this.handleError(error, 'Failed to find work day');
    }
  }

  async findAll(): Promise<WorkDay[]> {
    try {
      const response = await firstValueFrom(
        this.http.get<any[]>(this.baseUrl)
      );
      
      return response.map(workDayData => WorkDay.fromData(workDayData));
    } catch (error) {
      console.error('Error finding all work days via HTTP:', error);
      throw this.handleError(error, 'Failed to load work days');
    }
  }

  async delete(date: WorkDayDate): Promise<void> {
    try {
      const dateString = date.toISOString();
      await firstValueFrom(
        this.http.delete(`${this.baseUrl}/${dateString}`)
      );
    } catch (error) {
      if (error instanceof HttpErrorResponse && error.status === 404) {
        // Already deleted, consider it success
        return;
      }
      
      console.error('Error deleting work day via HTTP:', error);
      throw this.handleError(error, 'Failed to delete work day');
    }
  }

  async exists(date: WorkDayDate): Promise<boolean> {
    try {
      const dateString = date.toISOString();
      const response = await firstValueFrom(
        this.http.get<{ exists: boolean }>(`${this.baseUrl}/${dateString}/exists`)
      );
      
      return response.exists;
    } catch (error) {
      console.error('Error checking if work day exists via HTTP:', error);
      // Default to false if we can't check
      return false;
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