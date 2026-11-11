import { anArea } from '../../../../test/builders/area.builder';
import { NOW } from '../../../../test/builders/reservation.builder';
import { DateRange } from '../../../shared/domain/date-range';
import { LocalDate } from '../../../shared/domain/local-date';

const d = (value: string) => LocalDate.of(value);

describe('Area', () => {
  it('is bookable only on its open weekdays', () => {
    const pool = anArea({ openWeekdays: [5, 6, 7] });

    expect(pool.isBookableOn(d('2026-11-11'))).toBe(false); // Wednesday
    expect(pool.isBookableOn(d('2026-11-14'))).toBe(true); // Saturday
  });

  it('is not bookable inside a suspension range (rule 6)', () => {
    const area = anArea();

    area.suspend(
      's1',
      DateRange.of(d('2026-11-20'), d('2026-11-22')),
      ' Mantenimiento ',
      NOW,
    );

    expect(area.isBookableOn(d('2026-11-21'))).toBe(false);
    expect(area.isBookableOn(d('2026-11-23'))).toBe(true);
    expect(area.suspensionOn(d('2026-11-20'))?.reason).toBe('Mantenimiento');
  });

  it('requires a reason to suspend', () => {
    const range = DateRange.of(d('2026-11-20'), d('2026-11-20'));

    expect(() => anArea().suspend('s1', range, '', NOW)).toThrow(
      expect.objectContaining({ code: 'SUSPENSION_REASON_REQUIRED' }) as Error,
    );
  });

  it('rejects a range that ends before it starts', () => {
    expect(() => DateRange.of(d('2026-11-22'), d('2026-11-20'))).toThrow(
      expect.objectContaining({ code: 'INVALID_DATE_RANGE' }) as Error,
    );
  });

  it('adds fee and deposit', () => {
    expect(anArea().total).toBe(150);
  });
});
