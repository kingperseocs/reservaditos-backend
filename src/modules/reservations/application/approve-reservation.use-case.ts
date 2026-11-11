import { Inject, Injectable } from '@nestjs/common';
import { notFound } from '../../../shared/domain/errors';
import {
  RANDOM_GENERATOR,
  type RandomGenerator,
} from '../../../shared/domain/ports';
import { Reservation } from '../domain/reservation';
import {
  RESERVATION_REPOSITORY,
  type ReservationRepository,
} from '../domain/reservation.repository';
import { SlotAllocationPolicy } from '../domain/slot-allocation.policy';
import { BookingContext } from './booking-context';
import { ExpireOverdueReservationsUseCase } from './expire-overdue-reservations.use-case';

/** Rules 2, 3 and 4: approve the first request of a free slot and open the payment link. */
@Injectable()
export class ApproveReservationUseCase {
  constructor(
    @Inject(RESERVATION_REPOSITORY)
    private readonly reservations: ReservationRepository,
    @Inject(RANDOM_GENERATOR) private readonly random: RandomGenerator,
    private readonly context: BookingContext,
    private readonly expireOverdue: ExpireOverdueReservationsUseCase,
  ) {}

  async execute(id: string): Promise<Reservation> {
    await this.expireOverdue.execute();
    const reservation = await this.reservations.findById(id);
    if (!reservation) throw notFound('reservation', id);

    const sameSlot = await this.reservations.findBySlotKey(reservation.slotKey);
    SlotAllocationPolicy.assertCanApprove(reservation, sameSlot);

    reservation.approve(this.context.now(), this.random.uuid());
    await this.reservations.save(reservation);
    return reservation;
  }
}
