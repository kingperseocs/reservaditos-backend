import { LocalDate } from '../../../shared/domain/local-date';
import { TimeSlot } from '../../../shared/domain/time-slot';
import { Reservation } from '../domain/reservation';
import { ReservationRecord } from './reservation.schema';

export const ReservationMapper = {
  toDomain(record: ReservationRecord): Reservation {
    return Reservation.restore({
      id: record._id,
      residentId: record.residentId,
      areaId: record.areaId,
      date: LocalDate.of(record.date),
      slot: TimeSlot.of(record.slotStart, record.slotEnd),
      eventStart: record.eventStart,
      fee: record.fee,
      deposit: record.deposit,
      status: record.status,
      requestedAt: record.requestedAt,
      approvedAt: record.approvedAt,
      paymentDeadline: record.paymentDeadline,
      paymentToken: record.paymentToken,
      paidAt: record.paidAt,
      code: record.code,
      rejectedAt: record.rejectedAt,
      rejectionReason: record.rejectionReason,
      expiredAt: record.expiredAt,
      refundedAt: record.refundedAt,
      refundAmount: record.refundAmount,
    });
  },

  toRecord(reservation: Reservation): ReservationRecord {
    return {
      _id: reservation.id,
      residentId: reservation.residentId,
      areaId: reservation.areaId,
      date: reservation.date.value,
      slotStart: reservation.slot.start,
      slotEnd: reservation.slot.end,
      slotKey: reservation.slotKey,
      ...(reservation.holdsSlot && { slotLock: reservation.slotKey }),
      eventStart: reservation.eventStart,
      fee: reservation.fee,
      deposit: reservation.deposit,
      status: reservation.status,
      requestedAt: reservation.requestedAt,
      approvedAt: reservation.approvedAt,
      paymentDeadline: reservation.paymentDeadline,
      paymentToken: reservation.paymentToken,
      paidAt: reservation.paidAt,
      code: reservation.code,
      rejectedAt: reservation.rejectedAt,
      rejectionReason: reservation.rejectionReason,
      expiredAt: reservation.expiredAt,
      refundedAt: reservation.refundedAt,
      refundAmount: reservation.refundAmount,
    };
  },
};
