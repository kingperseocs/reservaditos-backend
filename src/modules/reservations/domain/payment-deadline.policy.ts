const HOUR_MS = 60 * 60 * 1000;

/**
 * Rules 2 and 3: the resident pays within 24 h of the approval, but never
 * later than 3 h before the event.
 *   deadline = min(approvedAt + 24h, eventStart - 3h)
 */
export class PaymentDeadlinePolicy {
  static readonly PAYMENT_WINDOW_HOURS = 24;
  static readonly HOURS_BEFORE_EVENT = 3;

  static deadlineFor(approvedAt: Date, eventStart: Date): Date {
    const windowEnd =
      approvedAt.getTime() + this.PAYMENT_WINDOW_HOURS * HOUR_MS;
    return new Date(
      Math.min(windowEnd, this.latestPaymentMoment(eventStart).getTime()),
    );
  }

  /** Last moment a booking can still be paid (and therefore approved or requested). */
  static latestPaymentMoment(eventStart: Date): Date {
    return new Date(eventStart.getTime() - this.HOURS_BEFORE_EVENT * HOUR_MS);
  }
}
