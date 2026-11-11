import { LocalDate } from '../../../shared/domain/local-date';

export interface Due {
  id: string;
  amount: number;
  dueDate: LocalDate;
  paidAt: Date | null;
}

export interface Standing {
  upToDate: boolean;
  overdueAmount: number;
  oldestOverdueDate: LocalDate | null;
}

/**
 * Rule 5: only residents up to date can book, with one day of grace.
 * A due of 05/11 still allows booking on 06/11 and blocks from 07/11.
 */
export class DuesStandingPolicy {
  static readonly GRACE_DAYS = 1;

  static evaluate(dues: readonly Due[], today: LocalDate): Standing {
    const overdue = dues
      .filter(
        (due) =>
          due.paidAt === null &&
          today.isAfter(due.dueDate.plusDays(DuesStandingPolicy.GRACE_DAYS)),
      )
      .sort((a, b) => a.dueDate.value.localeCompare(b.dueDate.value));

    return {
      upToDate: overdue.length === 0,
      overdueAmount: overdue.reduce((sum, due) => sum + due.amount, 0),
      oldestOverdueDate: overdue[0]?.dueDate ?? null,
    };
  }
}
