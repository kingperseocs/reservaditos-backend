export enum ReservationStatus {
  PENDING_APPROVAL = 'PENDING_APPROVAL',
  APPROVED = 'APPROVED',
  CONFIRMED = 'CONFIRMED',
  REJECTED = 'REJECTED',
  EXPIRED = 'EXPIRED',
  REFUNDED = 'REFUNDED',
}

/** Statuses that keep a request alive for its slot. */
export const ACTIVE_STATUSES: readonly ReservationStatus[] = [
  ReservationStatus.PENDING_APPROVAL,
  ReservationStatus.APPROVED,
  ReservationStatus.CONFIRMED,
];

/** Statuses that block the slot for everyone else. */
export const SLOT_HOLDING_STATUSES: readonly ReservationStatus[] = [
  ReservationStatus.APPROVED,
  ReservationStatus.CONFIRMED,
];
