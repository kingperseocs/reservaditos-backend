import { Clock } from '../../src/shared/domain/ports';

export class FakeClock implements Clock {
  constructor(private current: Date) {}

  now(): Date {
    return new Date(this.current);
  }

  set(date: Date): void {
    this.current = new Date(date);
  }

  advanceHours(hours: number): void {
    this.current = new Date(this.current.getTime() + hours * 60 * 60 * 1000);
  }
}
