import { LocalDate } from '../../src/shared/domain/local-date';
import { TimeSlot } from '../../src/shared/domain/time-slot';
import {
  RequestReservationProps,
  Reservation,
} from '../../src/modules/reservations/domain/reservation';

export const TZ = 'America/Lima';

/** Wednesday 11/11/2026 09:00 in Lima. */
export const NOW = new Date('2026-11-11T14:00:00Z');

export const hours = (n: number): number => n * 60 * 60 * 1000;
export const after = (date: Date, ms: number): Date =>
  new Date(date.getTime() + ms);

export function aReservation(
  overrides: Partial<RequestReservationProps> & {
    start?: string;
    end?: string;
  } = {},
): Reservation {
  const date = overrides.date ?? LocalDate.of('2026-11-14');
  const slot =
    overrides.slot ??
    TimeSlot.of(overrides.start ?? '12:00', overrides.end ?? '15:00');
  return Reservation.request({
    id: overrides.id ?? 'res-1',
    residentId: overrides.residentId ?? 'ana-perez',
    areaId: overrides.areaId ?? 'grill',
    date,
    slot,
    eventStart: overrides.eventStart ?? date.atTime(slot.start, TZ),
    fee: overrides.fee ?? 50,
    deposit: overrides.deposit ?? 100,
    now: overrides.now ?? NOW,
  });
}
