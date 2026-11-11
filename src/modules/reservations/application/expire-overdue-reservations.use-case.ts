import { Inject, Injectable } from '@nestjs/common';
import { CLOCK, type Clock } from '../../../shared/domain/ports';
import {
  RESERVATION_REPOSITORY,
  type ReservationRepository,
} from '../domain/reservation.repository';

/**
 * Rule 2: approved bookings not paid in time expire and release the slot.
 * Runs every minute and before every read/write that depends on slot state,
 * so correctness never depends on the scheduler.
 */
@Injectable()
export class ExpireOverdueReservationsUseCase {
  constructor(
    @Inject(RESERVATION_REPOSITORY)
    private readonly reservations: ReservationRepository,
    @Inject(CLOCK) private readonly clock: Clock,
  ) {}

  async execute(): Promise<number> {
    const now = this.clock.now();
    const overdue = await this.reservations.findApprovedWithDeadlineBefore(now);
    for (const reservation of overdue) {
      reservation.expire(now);
      await this.reservations.save(reservation);
    }
    return overdue.length;
  }
}
