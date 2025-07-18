/**
 * @fileoverview Local storage adapter for abstracting storage operations.
 * @author Work Timer Application
 */

import { Injectable } from '@angular/core';

export interface StorageAdapter {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
  clear(): void;
  hasItem(key: string): boolean;
  getAllKeys(): string[];
}

@Injectable({
  providedIn: 'root'
})
export class LocalStorageAdapter implements StorageAdapter {
  
  getItem(key: string): string | null {
    try {
      return localStorage.getItem(key);
    } catch (error) {
      console.error('Error reading from localStorage:', error);
      return null;
    }
  }
  
  setItem(key: string, value: string): void {
    try {
      localStorage.setItem(key, value);
    } catch (error) {
      console.error('Error writing to localStorage:', error);
      throw new Error(`Failed to store data with key: ${key}`);
    }
  }
  
  removeItem(key: string): void {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.error('Error removing from localStorage:', error);
    }
  }
  
  clear(): void {
    try {
      localStorage.clear();
    } catch (error) {
      console.error('Error clearing localStorage:', error);
    }
  }
  
  hasItem(key: string): boolean {
    return this.getItem(key) !== null;
  }
  
  getAllKeys(): string[] {
    try {
      const keys: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key) keys.push(key);
      }
      return keys;
    } catch (error) {
      console.error('Error getting localStorage keys:', error);
      return [];
    }
  }
}