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

const SLOT_LOST_REASON = 'El horario ya fue reservado por otro residente.';

/** Simulated payment through the link sent after approval. */
@Injectable()
export class PayReservationUseCase {
  constructor(
    @Inject(RESERVATION_REPOSITORY)
    private readonly reservations: ReservationRepository,
    @Inject(RANDOM_GENERATOR) private readonly random: RandomGenerator,
    private readonly context: BookingContext,
  ) {}

  async execute(paymentToken: string): Promise<Reservation> {
    const reservation =
      await this.reservations.findByPaymentToken(paymentToken);
    if (!reservation) throw notFound('payment', paymentToken);

    const now = this.context.now();
    if (reservation.isPaymentOverdue(now)) {
      reservation.expire(now);
      await this.reservations.save(reservation);
    }

    reservation.pay(
      now,
      `${this.context.building.code}-${this.random.digits(4)}`,
    );
    await this.reservations.save(reservation);

    const sameSlot = await this.reservations.findBySlotKey(reservation.slotKey);
    for (const loser of SlotAllocationPolicy.losers(reservation, sameSlot)) {
      loser.reject(SLOT_LOST_REASON, now);
      await this.reservations.save(loser);
    }
    return reservation;
  }
}
