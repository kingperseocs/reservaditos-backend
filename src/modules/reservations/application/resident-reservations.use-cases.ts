import { Inject, Injectable } from '@nestjs/common';
import { notFound } from '../../../shared/domain/errors';
import { User } from '../../users/domain/user';
import {
  RESERVATION_REPOSITORY,
  type ReservationRepository,
} from '../domain/reservation.repository';
import { ExpireOverdueReservationsUseCase } from './expire-overdue-reservations.use-case';
import {
  ReservationDetails,
  ReservationDetailsAssembler,
} from './reservation-details.assembler';

@Injectable()
export class ListResidentReservationsUseCase {
  constructor(
    @Inject(RESERVATION_REPOSITORY)
    private readonly reservations: ReservationRepository,
    private readonly assembler: ReservationDetailsAssembler,
    private readonly expireOverdue: ExpireOverdueReservationsUseCase,
  ) {}

  async execute(resident: User): Promise<ReservationDetails[]> {
    await this.expireOverdue.execute();
    const found = await this.reservations.search({ residentId: resident.id });
    const newestFirst = found.sort(
      (a, b) => b.requestedAt.getTime() - a.requestedAt.getTime(),
    );
    return this.assembler.assemble(newestFirst);
  }
}

@Injectable()
export class GetResidentReservationUseCase {
  constructor(
    @Inject(RESERVATION_REPOSITORY)
    private readonly reservations: ReservationRepository,
    private readonly assembler: ReservationDetailsAssembler,
    private readonly expireOverdue: ExpireOverdueReservationsUseCase,
  ) {}

  async execute(resident: User, id: string): Promise<ReservationDetails> {
    await this.expireOverdue.execute();
    const reservation = await this.reservations.findById(id);
    if (!reservation || reservation.residentId !== resident.id) {
      throw notFound('reservation', id);
    }
    return this.assembler.assembleOne(reservation);
  }
}

@Injectable()
export class GetPaymentUseCase {
  constructor(
    @Inject(RESERVATION_REPOSITORY)
    private readonly reservations: ReservationRepository,
    private readonly assembler: ReservationDetailsAssembler,
    private readonly expireOverdue: ExpireOverdueReservationsUseCase,
  ) {}

  async execute(paymentToken: string): Promise<ReservationDetails> {
    await this.expireOverdue.execute();
    const reservation =
      await this.reservations.findByPaymentToken(paymentToken);
    if (!reservation) throw notFound('payment', paymentToken);
    return this.assembler.assembleOne(reservation);
  }
}
