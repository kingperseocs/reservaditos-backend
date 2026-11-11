import {
  DomainError,
  DomainErrorType,
} from '../../../shared/domain/domain-error';
import { LocalDate } from '../../../shared/domain/local-date';
import { TimeSlot } from '../../../shared/domain/time-slot';
import { PaymentDeadlinePolicy } from './payment-deadline.policy';
import {
  ACTIVE_STATUSES,
  ReservationStatus,
  SLOT_HOLDING_STATUSES,
} from './reservation-status';

export interface ReservationProps {
  id: string;
  residentId: string;
  areaId: string;
  date: LocalDate;
  slot: TimeSlot;
  eventStart: Date;
  fee: number;
  deposit: number;
  status: ReservationStatus;
  requestedAt: Date;
  approvedAt: Date | null;
  paymentDeadline: Date | null;
  paymentToken: string | null;
  paidAt: Date | null;
  code: string | null;
  rejectedAt: Date | null;
  rejectionReason: string | null;
  expiredAt: Date | null;
  refundedAt: Date | null;
  refundAmount: number | null;
}

export interface RequestReservationProps {
  id: string;
  residentId: string;
  areaId: string;
  date: LocalDate;
  slot: TimeSlot;
  eventStart: Date;
  fee: number;
  deposit: number;
  now: Date;
}

/** Aggregate root. Every status change goes through a method that checks the transition. */
export class Reservation {
  private constructor(private props: ReservationProps) {}

  /** Rule 1: a resident requests an area for a date and a slot. */
  static request(input: RequestReservationProps): Reservation {
    if (
      input.now >= PaymentDeadlinePolicy.latestPaymentMoment(input.eventStart)
    ) {
      throw new DomainError(
        'TOO_LATE_TO_REQUEST',
        `Las reservas se piden con al menos ${PaymentDeadlinePolicy.HOURS_BEFORE_EVENT} h de anticipación.`,
        DomainErrorType.CONFLICT,
      );
    }
    const { now, ...rest } = input;
    return new Reservation({
      ...rest,
      status: ReservationStatus.PENDING_APPROVAL,
      requestedAt: now,
      approvedAt: null,
      paymentDeadline: null,
      paymentToken: null,
      paidAt: null,
      code: null,
      rejectedAt: null,
      rejectionReason: null,
      expiredAt: null,
      refundedAt: null,
      refundAmount: null,
    });
  }

  static restore(props: ReservationProps): Reservation {
    return new Reservation({ ...props });
  }

  get id(): string {
    return this.props.id;
  }
  get residentId(): string {
    return this.props.residentId;
  }
  get areaId(): string {
    return this.props.areaId;
  }
  get date(): LocalDate {
    return this.props.date;
  }
  get slot(): TimeSlot {
    return this.props.slot;
  }
  get eventStart(): Date {
    return this.props.eventStart;
  }
  get fee(): number {
    return this.props.fee;
  }
  get deposit(): number {
    return this.props.deposit;
  }
  get total(): number {
    return this.props.fee + this.props.deposit;
  }
  get status(): ReservationStatus {
    return this.props.status;
  }
  get requestedAt(): Date {
    return this.props.requestedAt;
  }
  get approvedAt(): Date | null {
    return this.props.approvedAt;
  }
  get paymentDeadline(): Date | null {
    return this.props.paymentDeadline;
  }
  get paymentToken(): string | null {
    return this.props.paymentToken;
  }
  get paidAt(): Date | null {
    return this.props.paidAt;
  }
  get code(): string | null {
    return this.props.code;
  }
  get rejectedAt(): Date | null {
    return this.props.rejectedAt;
  }
  get rejectionReason(): string | null {
    return this.props.rejectionReason;
  }
  get expiredAt(): Date | null {
    return this.props.expiredAt;
  }
  get refundedAt(): Date | null {
    return this.props.refundedAt;
  }
  get refundAmount(): number | null {
    return this.props.refundAmount;
  }

  /** Same area, date and slot ⇒ same key. */
  get slotKey(): string {
    return `${this.props.areaId}|${this.props.date.value}|${this.props.slot.start}`;
  }

  get isActive(): boolean {
    return ACTIVE_STATUSES.includes(this.props.status);
  }

  get holdsSlot(): boolean {
    return SLOT_HOLDING_STATUSES.includes(this.props.status);
  }

  isPaymentOverdue(now: Date): boolean {
    return (
      this.props.status === ReservationStatus.APPROVED &&
      this.props.paymentDeadline !== null &&
      now >= this.props.paymentDeadline
    );
  }

  /** Rules 2 and 3: approval opens the payment window. */
  approve(now: Date, paymentToken: string): void {
    this.assertStatus('approve', ReservationStatus.PENDING_APPROVAL);
    const deadline = PaymentDeadlinePolicy.deadlineFor(
      now,
      this.props.eventStart,
    );
    if (deadline <= now) {
      throw new DomainError(
        'TOO_LATE_TO_APPROVE',
        'Ya no hay tiempo para pagar antes del evento; no se puede aprobar.',
        DomainErrorType.CONFLICT,
      );
    }
    this.props = {
      ...this.props,
      status: ReservationStatus.APPROVED,
      approvedAt: now,
      paymentDeadline: deadline,
      paymentToken,
    };
  }

  reject(reason: string, now: Date): void {
    this.assertStatus(
      'reject',
      ReservationStatus.PENDING_APPROVAL,
      ReservationStatus.APPROVED,
    );
    const trimmed = reason.trim();
    if (!trimmed) {
      throw new DomainError(
        'REJECTION_REASON_REQUIRED',
        'Indica el motivo del rechazo.',
      );
    }
    this.props = {
      ...this.props,
      status: ReservationStatus.REJECTED,
      rejectedAt: now,
      rejectionReason: trimmed,
    };
  }

  /** Simulated payment of fee + deposit. */
  pay(now: Date, code: string): void {
    if (
      this.props.status === ReservationStatus.EXPIRED ||
      this.isPaymentOverdue(now)
    ) {
      throw new DomainError(
        'PAYMENT_DEADLINE_PASSED',
        'El plazo de pago venció y el horario se liberó.',
        DomainErrorType.CONFLICT,
      );
    }
    this.assertStatus('pay', ReservationStatus.APPROVED);
    this.props = {
      ...this.props,
      status: ReservationStatus.CONFIRMED,
      paidAt: now,
      code,
    };
  }

  /** Rule 2: not paid in time ⇒ expires and releases the slot. */
  expire(now: Date): void {
    this.assertStatus('expire', ReservationStatus.APPROVED);
    if (!this.isPaymentOverdue(now)) {
      throw new DomainError(
        'PAYMENT_STILL_OPEN',
        'El plazo de pago aún no vence.',
        DomainErrorType.CONFLICT,
      );
    }
    this.props = {
      ...this.props,
      status: ReservationStatus.EXPIRED,
      expiredAt: now,
    };
  }

  /**
   * Rule 6: the area was suspended on this date.
   * Paid bookings are refunded 100 %; pending or approved ones are rejected.
   */
  cancelBySuspension(reason: string, now: Date): void {
    if (this.props.status === ReservationStatus.CONFIRMED) {
      this.props = {
        ...this.props,
        status: ReservationStatus.REFUNDED,
        refundedAt: now,
        refundAmount: this.total,
        rejectionReason: reason,
      };
      return;
    }
    this.reject(reason, now);
  }

  private assertStatus(action: string, ...allowed: ReservationStatus[]): void {
    if (!allowed.includes(this.props.status)) {
      throw new DomainError(
        'INVALID_RESERVATION_TRANSITION',
        `No se puede ${ACTION_LABELS[action] ?? action} una reserva en estado ${this.props.status}.`,
        DomainErrorType.CONFLICT,
        { action, status: this.props.status },
      );
    }
  }
}

const ACTION_LABELS: Record<string, string> = {
  approve: 'aprobar',
  reject: 'rechazar',
  pay: 'pagar',
  expire: 'vencer',
};
