import {
  after,
  aReservation,
  hours,
  NOW,
} from '../../../../test/builders/reservation.builder';
import { ReservationStatus } from './reservation-status';

const expectCode = (fn: () => void, code: string): void => {
  expect(fn).toThrow(expect.objectContaining({ code }) as Error);
};

describe('Reservation', () => {
  describe('request (rule 1)', () => {
    it('starts waiting for approval with fee and deposit', () => {
      const reservation = aReservation();

      expect(reservation.status).toBe(ReservationStatus.PENDING_APPROVAL);
      expect(reservation.total).toBe(150);
      expect(reservation.requestedAt).toEqual(NOW);
      expect(reservation.slotKey).toBe('grill|2026-11-14|12:00');
    });

    it('cannot be requested less than 3 h before the event', () => {
      expectCode(
        () => aReservation({ eventStart: after(NOW, hours(2)) }),
        'TOO_LATE_TO_REQUEST',
      );
    });
  });

  describe('approve (rules 2 and 3)', () => {
    it('opens a 24 h payment window with a payment token', () => {
      const reservation = aReservation();

      reservation.approve(NOW, 'token-1');

      expect(reservation.status).toBe(ReservationStatus.APPROVED);
      expect(reservation.paymentDeadline).toEqual(after(NOW, hours(24)));
      expect(reservation.paymentToken).toBe('token-1');
    });

    it('limits the window to 3 h before an event that starts in less than 24 h', () => {
      const reservation = aReservation({ eventStart: after(NOW, hours(12)) });

      reservation.approve(NOW, 'token-1');

      expect(reservation.paymentDeadline).toEqual(after(NOW, hours(9)));
    });

    it('cannot be approved when there is no time left to pay', () => {
      const reservation = aReservation({ eventStart: after(NOW, hours(5)) });

      expectCode(
        () => reservation.approve(after(NOW, hours(3)), 't'),
        'TOO_LATE_TO_APPROVE',
      );
    });

    it('cannot be approved twice', () => {
      const reservation = aReservation();
      reservation.approve(NOW, 't');

      expectCode(
        () => reservation.approve(NOW, 't'),
        'INVALID_RESERVATION_TRANSITION',
      );
    });
  });

  describe('pay', () => {
    it('confirms the booking within the deadline', () => {
      const reservation = aReservation();
      reservation.approve(NOW, 't');

      reservation.pay(after(NOW, hours(23)), 'DEMO-4821');

      expect(reservation.status).toBe(ReservationStatus.CONFIRMED);
      expect(reservation.code).toBe('DEMO-4821');
      expect(reservation.holdsSlot).toBe(true);
    });

    it('rejects a payment after the deadline (rule 2)', () => {
      const reservation = aReservation();
      reservation.approve(NOW, 't');

      expectCode(
        () => reservation.pay(after(NOW, hours(24)), 'DEMO-1'),
        'PAYMENT_DEADLINE_PASSED',
      );
    });

    it('cannot pay before the administration approves', () => {
      expectCode(
        () => aReservation().pay(NOW, 'DEMO-1'),
        'INVALID_RESERVATION_TRANSITION',
      );
    });
  });

  describe('expire (rule 2)', () => {
    it('expires an unpaid booking after the deadline and releases the slot', () => {
      const reservation = aReservation();
      reservation.approve(NOW, 't');

      reservation.expire(after(NOW, hours(24)));

      expect(reservation.status).toBe(ReservationStatus.EXPIRED);
      expect(reservation.holdsSlot).toBe(false);
    });

    it('does not expire while the payment window is open', () => {
      const reservation = aReservation();
      reservation.approve(NOW, 't');

      expectCode(
        () => reservation.expire(after(NOW, hours(1))),
        'PAYMENT_STILL_OPEN',
      );
    });
    it('reports an expired link as a passed deadline when paying', () => {
      const reservation = aReservation();
      reservation.approve(NOW, 't');
      reservation.expire(after(NOW, hours(24)));

      expectCode(
        () => reservation.pay(after(NOW, hours(25)), 'DEMO-1'),
        'PAYMENT_DEADLINE_PASSED',
      );
    });
  });

  describe('reject', () => {
    it('stores the reason', () => {
      const reservation = aReservation();

      reservation.reject('El área está en mantenimiento ese día.', NOW);

      expect(reservation.status).toBe(ReservationStatus.REJECTED);
      expect(reservation.rejectionReason).toBe(
        'El área está en mantenimiento ese día.',
      );
    });

    it('requires a reason', () => {
      expectCode(
        () => aReservation().reject('  ', NOW),
        'REJECTION_REASON_REQUIRED',
      );
    });
  });

  describe('cancelBySuspension (rule 6)', () => {
    it('refunds 100 % of a paid booking', () => {
      const reservation = aReservation();
      reservation.approve(NOW, 't');
      reservation.pay(NOW, 'DEMO-1');

      reservation.cancelBySuspension('Mantenimiento', NOW);

      expect(reservation.status).toBe(ReservationStatus.REFUNDED);
      expect(reservation.refundAmount).toBe(150);
    });

    it('rejects a booking that was not paid yet', () => {
      const reservation = aReservation();

      reservation.cancelBySuspension('Mantenimiento', NOW);

      expect(reservation.status).toBe(ReservationStatus.REJECTED);
      expect(reservation.refundAmount).toBeNull();
    });
  });
});
