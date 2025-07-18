/**
 * @fileoverview Duration value object for handling time calculations.
 * @author Work Timer Application
 */

export class Duration {
  private constructor(public readonly milliseconds: number) {
    if (milliseconds < 0) {
      throw new Error('Duration cannot be negative.');
    }
  }

  static fromMilliseconds(milliseconds: number): Duration {
    return new Duration(milliseconds);
  }

  static fromSeconds(seconds: number): Duration {
    return new Duration(seconds * 1000);
  }

  static fromMinutes(minutes: number): Duration {
    return new Duration(minutes * 60 * 1000);
  }

  static fromHours(hours: number): Duration {
    return new Duration(hours * 60 * 60 * 1000);
  }

  static zero(): Duration {
    return new Duration(0);
  }

  add(other: Duration): Duration {
    return new Duration(this.milliseconds + other.milliseconds);
  }

  subtract(other: Duration): Duration {
    const result = this.milliseconds - other.milliseconds;
    return new Duration(Math.max(0, result));
  }

  isGreaterThan(other: Duration): boolean {
    return this.milliseconds > other.milliseconds;
  }

  isLessThan(other: Duration): boolean {
    return this.milliseconds < other.milliseconds;
  }

  isGreaterThanOrEqual(other: Duration): boolean {
    return this.milliseconds >= other.milliseconds;
  }

  isLessThanOrEqual(other: Duration): boolean {
    return this.milliseconds <= other.milliseconds;
  }

  equals(other: Duration): boolean {
    return this.milliseconds === other.milliseconds;
  }

  isZero(): boolean {
    return this.milliseconds === 0;
  }

  toSeconds(): number {
    return Math.floor(this.milliseconds / 1000);
  }

  toMinutes(): number {
    return Math.floor(this.milliseconds / (60 * 1000));
  }

  toHours(): number {
    return Math.floor(this.milliseconds / (60 * 60 * 1000));
  }

  format(): string {
    const totalSeconds = Math.floor(this.milliseconds / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }
}