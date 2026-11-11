import {
  DomainError,
  DomainErrorType,
} from '../../../shared/domain/domain-error';
import { Reservation } from './reservation';
import { ReservationStatus } from './reservation-status';

/** Rule 4: when two residents ask for the same slot, the first one wins. */
export class SlotAllocationPolicy {
  /** Earliest pending request of a slot (ties broken by id for determinism). */
  static firstInLine(
    sameSlot: readonly Reservation[],
  ): Reservation | undefined {
    return sameSlot
      .filter((r) => r.status === ReservationStatus.PENDING_APPROVAL)
      .sort(
        (a, b) =>
          a.requestedAt.getTime() - b.requestedAt.getTime() ||
          a.id.localeCompare(b.id),
      )[0];
  }

  /** The slot is free when nobody holds it (approved or confirmed). */
  static assertSlotFree(
    sameSlot: readonly Reservation[],
    exceptId?: string,
  ): void {
    if (sameSlot.some((r) => r.id !== exceptId && r.holdsSlot)) {
      throw new DomainError(
        'SLOT_TAKEN',
        'Ese horario ya está reservado.',
        DomainErrorType.CONFLICT,
      );
    }
  }

  static assertCanApprove(
    candidate: Reservation,
    sameSlot: readonly Reservation[],
  ): void {
    this.assertSlotFree(sameSlot, candidate.id);
    const first = this.firstInLine(sameSlot);
    if (first && first.id !== candidate.id) {
      throw new DomainError(
        'NOT_FIRST_IN_LINE',
        'Otro residente pidió este horario primero; resuelve esa solicitud antes.',
        DomainErrorType.CONFLICT,
        { firstReservationId: first.id },
      );
    }
  }

  /** Pending requests that lose the slot once someone confirms it. */
  static losers(
    winner: Reservation,
    sameSlot: readonly Reservation[],
  ): Reservation[] {
    return sameSlot.filter(
      (r) =>
        r.id !== winner.id && r.status === ReservationStatus.PENDING_APPROVAL,
    );
  }
}
