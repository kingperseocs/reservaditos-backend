import { LocalDate } from '../../../shared/domain/local-date';
import { Due, DuesStandingPolicy } from './dues-standing.policy';
import { User, UserRole } from './user';

const d = (value: string) => LocalDate.of(value);
const due = (
  dueDate: string,
  amount = 350,
  paidAt: Date | null = null,
): Due => ({
  id: dueDate,
  amount,
  dueDate: d(dueDate),
  paidAt,
});

describe('DuesStandingPolicy (rule 5: up to date with one day of grace)', () => {
  it('is up to date on the due date and on the grace day', () => {
    expect(
      DuesStandingPolicy.evaluate([due('2026-11-05')], d('2026-11-05'))
        .upToDate,
    ).toBe(true);
    expect(
      DuesStandingPolicy.evaluate([due('2026-11-05')], d('2026-11-06'))
        .upToDate,
    ).toBe(true);
  });

  it('is overdue the day after the grace day', () => {
    const standing = DuesStandingPolicy.evaluate(
      [due('2026-11-05')],
      d('2026-11-07'),
    );

    expect(standing).toEqual({
      upToDate: false,
      overdueAmount: 350,
      oldestOverdueDate: d('2026-11-05'),
    });
  });

  it('ignores paid dues', () => {
    const paid = due('2026-10-05', 350, new Date('2026-10-04T15:00:00Z'));

    expect(DuesStandingPolicy.evaluate([paid], d('2026-11-11')).upToDate).toBe(
      true,
    );
  });

  it('adds every overdue due and reports the oldest date', () => {
    const standing = DuesStandingPolicy.evaluate(
      [due('2026-11-05', 350), due('2026-10-05', 300)],
      d('2026-11-11'),
    );

    expect(standing.overdueAmount).toBe(650);
    expect(standing.oldestOverdueDate).toEqual(d('2026-10-05'));
  });

  it('blocks a resident who is not up to date from booking', () => {
    const resident = User.restore({
      id: 'rosa',
      name: 'Rosa Medina',
      role: UserRole.RESIDENT,
      apartment: '403',
      dues: [due('2026-11-05')],
    });

    expect(() => resident.assertCanBook(d('2026-11-11'))).toThrow(
      expect.objectContaining({
        code: 'RESIDENT_NOT_UP_TO_DATE',
        details: { overdueAmount: 350, oldestOverdueDate: '2026-11-05' },
      }) as Error,
    );
  });
});
