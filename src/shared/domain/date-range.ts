import { DomainError } from './domain-error';
import { LocalDate } from './local-date';

/** Inclusive range of calendar dates. */
export class DateRange {
  private constructor(
    readonly from: LocalDate,
    readonly to: LocalDate,
  ) {}

  static of(from: LocalDate, to: LocalDate): DateRange {
    if (to.isBefore(from)) {
      throw new DomainError(
        'INVALID_DATE_RANGE',
        'La fecha "hasta" no puede ser anterior a "desde".',
      );
    }
    return new DateRange(from, to);
  }

  /** Whole month given as yyyy-MM. */
  static ofMonth(month: string): DateRange {
    const first = LocalDate.of(`${month}-01`);
    let last = first;
    while (last.plusDays(1).value.startsWith(month)) {
      last = last.plusDays(1);
    }
    return new DateRange(first, last);
  }

  includes(date: LocalDate): boolean {
    return !date.isBefore(this.from) && !date.isAfter(this.to);
  }

  days(): LocalDate[] {
    const days: LocalDate[] = [];
    for (let day = this.from; !day.isAfter(this.to); day = day.plusDays(1)) {
      days.push(day);
    }
    return days;
  }
}
