import { DateTime } from 'luxon';
import { DomainError } from './domain-error';

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const FORMAT = 'yyyy-MM-dd';

/** Calendar date without time or zone (e.g. 2026-11-14). */
export class LocalDate {
  private constructor(readonly value: string) {}

  static of(value: string): LocalDate {
    if (!ISO_DATE.test(value) || !DateTime.fromISO(value).isValid) {
      throw new DomainError('INVALID_DATE', `Fecha inválida: ${value}`);
    }
    return new LocalDate(value);
  }

  static fromInstant(instant: Date, zone: string): LocalDate {
    return new LocalDate(
      DateTime.fromJSDate(instant, { zone }).toFormat(FORMAT),
    );
  }

  /** 1 = Monday … 7 = Sunday */
  get dayOfWeek(): number {
    return this.toDateTime().weekday;
  }

  plusDays(days: number): LocalDate {
    return new LocalDate(this.toDateTime().plus({ days }).toFormat(FORMAT));
  }

  /** Instant of this date at `time` (HH:mm) in `zone`. */
  atTime(time: string, zone: string): Date {
    const [hour, minute] = time.split(':').map(Number);
    return DateTime.fromISO(this.value, { zone })
      .set({ hour, minute, second: 0, millisecond: 0 })
      .toJSDate();
  }

  isBefore(other: LocalDate): boolean {
    return this.value < other.value;
  }

  isAfter(other: LocalDate): boolean {
    return this.value > other.value;
  }

  equals(other: LocalDate): boolean {
    return this.value === other.value;
  }

  toString(): string {
    return this.value;
  }

  private toDateTime(): DateTime {
    return DateTime.fromISO(this.value, { zone: 'utc' });
  }
}
