/**
 * @fileoverview Work session repository interface.
 * @author Work Timer Application
 */

import { WorkSession, WorkDayDate } from '../index';

export interface WorkSessionRepository {
  save(session: WorkSession): Promise<void>;
  findById(id: string): Promise<WorkSession | null>;
  findByDate(date: WorkDayDate): Promise<WorkSession[]>;
  findAll(): Promise<WorkSession[]>;
  delete(id: string): Promise<void>;
  deleteByDate(date: WorkDayDate): Promise<void>;
}