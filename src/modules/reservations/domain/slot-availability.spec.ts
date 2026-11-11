import {
  after,
  aReservation,
  hours,
  NOW,
  TZ,
} from '../../../../test/builders/reservation.builder';
import { DateRange } from '../../../shared/domain/date-range';
import { LocalDate } from '../../../shared/domain/local-date';
import { anArea } from '../../../../test/builders/area.builder';
import { SlotAvailability, SlotStatus } from './slot-availability';

const SATURDAY = LocalDate.of('2026-11-14');
const statuses = (views: ReturnType<typeof SlotAvailability.forDay>) =>
  views.map((v) => `${v.slot.label} ${v.status}`);

describe('SlotAvailability', () => {
  it('marks approved or confirmed slots as taken and ignores pending ones', () => {
    const confirmed = aReservation({ id: 'a', start: '15:00', end: '18:00' });
    confirmed.approve(NOW, 't');
    const pending = aReservation({ id: 'b', start: '12:00', end: '15:00' });

    const views = SlotAvailability.forDay(
      anArea(),
      SATURDAY,
      [confirmed, pending],
      NOW,
      TZ,
    );

    expect(statuses(views)).toEqual([
      '12:00–15:00 FREE',
      '15:00–18:00 TAKEN',
      '19:00–22:00 FREE',
    ]);
  });

  it('marks every slot unavailable on a suspended day', () => {
    const area = anArea();
    area.suspend('s1', DateRange.of(SATURDAY, SATURDAY), 'Mantenimiento', NOW);

    const views = SlotAvailability.forDay(area, SATURDAY, [], NOW, TZ);

    expect(SlotAvailability.hasFreeSlot(views)).toBe(false);
  });

  it('marks slots unavailable when they start in less than 3 h', () => {
    const today = LocalDate.of('2026-11-11');
    const at11am = after(NOW, hours(2));

    const views = SlotAvailability.forDay(anArea(), today, [], at11am, TZ);

    expect(views.map((v) => v.status)).toEqual([
      SlotStatus.UNAVAILABLE,
      SlotStatus.FREE,
      SlotStatus.FREE,
    ]);
  });
});
