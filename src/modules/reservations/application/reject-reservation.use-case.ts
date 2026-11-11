import { Inject, Injectable } from '@nestjs/common';
import { notFound } from '../../../shared/domain/errors';
import { Reservation } from '../domain/reservation';
import {
  RESERVATION_REPOSITORY,
  type ReservationRepository,
} from '../domain/reservation.repository';
import { BookingContext } from './booking-context';

@Injectable()
export class RejectReservationUseCase {
  constructor(
    @Inject(RESERVATION_REPOSITORY)
    private readonly reservations: ReservationRepository,
    private readonly context: BookingContext,
  ) {}

  async execute(id: string, reason: string): Promise<Reservation> {
    const reservation = await this.reservations.findById(id);
    if (!reservation) throw notFound('reservation', id);

    reservation.reject(reason, this.context.now());
    await this.reservations.save(reservation);
    return reservation;
  }
}
