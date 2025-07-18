/**
 * @fileoverview Work day repository interface.
 * @author Work Timer Application
 */

import { WorkDay, WorkDayDate } from '../index';

export interface WorkDayRepository {
  save(workDay: WorkDay): Promise<void>;
  findByDate(date: WorkDayDate): Promise<WorkDay | null>;
  findAll(): Promise<WorkDay[]>;
  delete(date: WorkDayDate): Promise<void>;
  exists(date: WorkDayDate): Promise<boolean>;
}