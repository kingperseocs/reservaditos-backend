import { Area } from '../../areas/domain/area';
import { LocalDate } from '../../../shared/domain/local-date';
import { TimeSlot } from '../../../shared/domain/time-slot';
import { PaymentDeadlinePolicy } from './payment-deadline.policy';
import { Reservation } from './reservation';

export enum SlotStatus {
  FREE = 'FREE',
  TAKEN = 'TAKEN',
  UNAVAILABLE = 'UNAVAILABLE',
}

export interface SlotView {
  slot: TimeSlot;
  status: SlotStatus;
}

/** Computes what a resident sees for an area on a given day. */
export class SlotAvailability {
  static forDay(
    area: Area,
    date: LocalDate,
    reservationsOfDay: readonly Reservation[],
    now: Date,
    timezone: string,
  ): SlotView[] {
    const bookable = area.isBookableOn(date);
    return area.slots.map((slot) => {
      const eventStart = date.atTime(slot.start, timezone);
      const tooLate =
        now >= PaymentDeadlinePolicy.latestPaymentMoment(eventStart);
      if (!bookable || tooLate) {
        return { slot, status: SlotStatus.UNAVAILABLE };
      }
      const taken = reservationsOfDay.some(
        (r) => r.holdsSlot && r.slot.equals(slot),
      );
      return { slot, status: taken ? SlotStatus.TAKEN : SlotStatus.FREE };
    });
  }

  static hasFreeSlot(views: readonly SlotView[]): boolean {
    return views.some((v) => v.status === SlotStatus.FREE);
  }
}
