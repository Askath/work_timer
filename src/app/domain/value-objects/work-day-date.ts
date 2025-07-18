/**
 * @fileoverview WorkDayDate value object for handling date-related operations.
 * @author Work Timer Application
 */

export class WorkDayDate {
  private constructor(private readonly date: Date) {}

  static fromDate(date: Date): WorkDayDate {
    const normalizedDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    return new WorkDayDate(normalizedDate);
  }

  static today(): WorkDayDate {
    return WorkDayDate.fromDate(new Date());
  }

  static fromString(dateString: string): WorkDayDate {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      throw new Error(`Invalid date string: ${dateString}`);
    }
    return WorkDayDate.fromDate(date);
  }

  equals(other: WorkDayDate): boolean {
    return this.toISOString() === other.toISOString();
  }

  isBefore(other: WorkDayDate): boolean {
    return this.date.getTime() < other.date.getTime();
  }

  isAfter(other: WorkDayDate): boolean {
    return this.date.getTime() > other.date.getTime();
  }

  isToday(): boolean {
    return this.equals(WorkDayDate.today());
  }

  toISOString(): string {
    return this.date.toISOString().split('T')[0];
  }

  toDate(): Date {
    return new Date(this.date);
  }

  getStartOfDay(): Date {
    return new Date(this.date.getFullYear(), this.date.getMonth(), this.date.getDate(), 0, 0, 0, 0);
  }

  getEndOfDay(): Date {
    return new Date(this.date.getFullYear(), this.date.getMonth(), this.date.getDate(), 23, 59, 59, 999);
  }

  format(): string {
    return this.date.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  }

  addDays(days: number): WorkDayDate {
    const newDate = new Date(this.date);
    newDate.setDate(newDate.getDate() + days);
    return WorkDayDate.fromDate(newDate);
  }

  subtractDays(days: number): WorkDayDate {
    return this.addDays(-days);
  }
}