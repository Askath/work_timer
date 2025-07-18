/**
 * @fileoverview LocalStorage implementation of WorkDayRepository.
 * @author Work Timer Application
 */

import { Injectable } from '@angular/core';
import { WorkDay, WorkDayDate } from '../../domain/index';
import { WorkDayRepository } from '../../domain/repositories/work-day.repository';
import { LocalStorageAdapter } from '../adapters/local-storage.adapter';

@Injectable({
  providedIn: 'root'
})
export class LocalStorageWorkDayRepository implements WorkDayRepository {
  private readonly STORAGE_KEY = 'work-timer-workdays';
  
  constructor(private readonly storageAdapter: LocalStorageAdapter) {}
  
  async save(workDay: WorkDay): Promise<void> {
    const workDays = await this.findAll();
    const existingIndex = workDays.findIndex(wd => wd.date.equals(workDay.date));
    
    if (existingIndex >= 0) {
      workDays[existingIndex] = workDay;
    } else {
      workDays.push(workDay);
    }
    
    this.saveToStorage(workDays);
  }
  
  async findByDate(date: WorkDayDate): Promise<WorkDay | null> {
    const workDays = await this.findAll();
    return workDays.find(wd => wd.date.equals(date)) || null;
  }
  
  async findAll(): Promise<WorkDay[]> {
    const stored = this.storageAdapter.getItem(this.STORAGE_KEY);
    if (!stored) return [];
    
    try {
      const data = JSON.parse(stored);
      return data.map((item: any) => this.deserializeWorkDay(item));
    } catch (error) {
      console.error('Error parsing stored work days:', error);
      return [];
    }
  }
  
  async delete(date: WorkDayDate): Promise<void> {
    const workDays = await this.findAll();
    const filtered = workDays.filter(wd => !wd.date.equals(date));
    this.saveToStorage(filtered);
  }
  
  async exists(date: WorkDayDate): Promise<boolean> {
    const workDay = await this.findByDate(date);
    return workDay !== null;
  }
  
  private saveToStorage(workDays: WorkDay[]): void {
    const serialized = workDays.map(workDay => this.serializeWorkDay(workDay));
    this.storageAdapter.setItem(this.STORAGE_KEY, JSON.stringify(serialized));
  }
  
  private serializeWorkDay(workDay: WorkDay): any {
    return workDay.toData();
  }
  
  private deserializeWorkDay(data: any): WorkDay {
    return WorkDay.fromData(data);
  }
}