/**
 * @fileoverview Simple storage service using localStorage for data persistence.
 * @author Work Timer Application
 */

import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class SimpleStorageService {
  private readonly STORAGE_PREFIX = 'work-timer-';
  
  /**
   * Save data to localStorage with JSON serialization
   */
  save<T>(key: string, data: T): void {
    try {
      const serializedData = JSON.stringify(data);
      localStorage.setItem(this.getStorageKey(key), serializedData);
    } catch (error) {
      console.error(`Failed to save data for key ${key}:`, error);
      throw new Error(`Storage quota exceeded or serialization failed`);
    }
  }

  /**
   * Load data from localStorage with JSON deserialization
   */
  load<T>(key: string): T | null {
    try {
      const item = localStorage.getItem(this.getStorageKey(key));
      return item ? JSON.parse(item) : null;
    } catch (error) {
      console.error(`Failed to load data for key ${key}:`, error);
      return null;
    }
  }

  /**
   * Remove data from localStorage
   */
  remove(key: string): void {
    localStorage.removeItem(this.getStorageKey(key));
  }

  /**
   * Check if data exists for a key
   */
  exists(key: string): boolean {
    return localStorage.getItem(this.getStorageKey(key)) !== null;
  }

  /**
   * Clear all work timer data
   */
  clear(): void {
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(this.STORAGE_PREFIX)) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach(key => localStorage.removeItem(key));
  }

  /**
   * Get all keys with the work timer prefix
   */
  getAllKeys(): string[] {
    const keys: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(this.STORAGE_PREFIX)) {
        keys.push(key.replace(this.STORAGE_PREFIX, ''));
      }
    }
    return keys;
  }

  private getStorageKey(key: string): string {
    return `${this.STORAGE_PREFIX}${key}`;
  }
}