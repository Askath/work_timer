/**
 * @fileoverview LocalStorage implementation of WorkSessionRepository.
 * @author Work Timer Application
 */

import { Injectable } from '@angular/core';
import { WorkSession, WorkDayDate } from '../../domain/index';
import { WorkSessionRepository } from '../../domain/repositories/work-session.repository';

@Injectable({
  providedIn: 'root'
})
export class LocalStorageWorkSessionRepository implements WorkSessionRepository {
  private readonly STORAGE_KEY = 'work-timer-sessions';
  
  async save(session: WorkSession): Promise<void> {
    const sessions = await this.findAll();
    const existingIndex = sessions.findIndex(s => s.id === session.id);
    
    if (existingIndex >= 0) {
      sessions[existingIndex] = session;
    } else {
      sessions.push(session);
    }
    
    this.saveToStorage(sessions);
  }
  
  async findById(id: string): Promise<WorkSession | null> {
    const sessions = await this.findAll();
    return sessions.find(s => s.id === id) || null;
  }
  
  async findByDate(date: WorkDayDate): Promise<WorkSession[]> {
    const sessions = await this.findAll();
    return sessions.filter(session => 
      session.workDate.equals(date)
    );
  }
  
  async findAll(): Promise<WorkSession[]> {
    const stored = localStorage.getItem(this.STORAGE_KEY);
    if (!stored) return [];
    
    try {
      const data = JSON.parse(stored);
      return data.map((item: any) => this.deserializeSession(item));
    } catch (error) {
      console.error('Error parsing stored sessions:', error);
      return [];
    }
  }
  
  async delete(id: string): Promise<void> {
    const sessions = await this.findAll();
    const filtered = sessions.filter(s => s.id !== id);
    this.saveToStorage(filtered);
  }
  
  async deleteByDate(date: WorkDayDate): Promise<void> {
    const sessions = await this.findAll();
    const filtered = sessions.filter(session => 
      !session.workDate.equals(date)
    );
    this.saveToStorage(filtered);
  }
  
  private saveToStorage(sessions: WorkSession[]): void {
    const serialized = sessions.map(session => this.serializeSession(session));
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(serialized));
  }
  
  private serializeSession(session: WorkSession): any {
    return {
      id: session.id,
      startTime: session.startTime.toISOString(),
      endTime: session.endTime?.toISOString() || null,
      date: session.workDate.toISOString(),
      duration: session.duration.milliseconds
    };
  }
  
  private deserializeSession(data: any): WorkSession {
    return WorkSession.fromData({
      id: data.id,
      startTime: new Date(data.startTime),
      endTime: data.endTime ? new Date(data.endTime) : null,
      date: data.date,
      duration: data.duration
    });
  }
}