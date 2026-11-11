import { DomainError } from './domain-error';

const HH_MM = /^([01]\d|2[0-3]):[0-5]\d$/;

/** Bookable time window within a day, e.g. 12:00–15:00. */
export class TimeSlot {
  private constructor(
    readonly start: string,
    readonly end: string,
  ) {}

  static of(start: string, end: string): TimeSlot {
    if (!HH_MM.test(start) || !HH_MM.test(end) || start >= end) {
      throw new DomainError(
        'INVALID_TIME_SLOT',
        `Horario inválido: ${start}–${end}`,
      );
    }
    return new TimeSlot(start, end);
  }

  get label(): string {
    return `${this.start}–${this.end}`;
  }

  equals(other: TimeSlot): boolean {
    return this.start === other.start && this.end === other.end;
  }
}
