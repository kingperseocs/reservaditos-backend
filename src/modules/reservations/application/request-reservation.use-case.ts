import { Inject, Injectable } from '@nestjs/common';
import {
  DomainError,
  DomainErrorType,
} from '../../../shared/domain/domain-error';
import { LocalDate } from '../../../shared/domain/local-date';
import {
  RANDOM_GENERATOR,
  type RandomGenerator,
} from '../../../shared/domain/ports';
import { User } from '../../users/domain/user';
import { Reservation } from '../domain/reservation';
import {
  RESERVATION_REPOSITORY,
  type ReservationRepository,
} from '../domain/reservation.repository';
import { SlotAllocationPolicy } from '../domain/slot-allocation.policy';
import { BookingContext } from './booking-context';
import { ExpireOverdueReservationsUseCase } from './expire-overdue-reservations.use-case';

export interface RequestReservationInput {
  resident: User;
  areaId: string;
  date: string;
  startTime: string;
  endTime: string;
}

/** Rules 1 and 5: an up-to-date resident asks for an area, date and slot. */
@Injectable()
export class RequestReservationUseCase {
  constructor(
    @Inject(RESERVATION_REPOSITORY)
    private readonly reservations: ReservationRepository,
    @Inject(RANDOM_GENERATOR) private readonly random: RandomGenerator,
    private readonly context: BookingContext,
    private readonly expireOverdue: ExpireOverdueReservationsUseCase,
  ) {}

  async execute(input: RequestReservationInput): Promise<Reservation> {
    const now = this.context.now();
    input.resident.assertCanBook(this.context.today(now));

    const area = await this.context.getArea(input.areaId);
    const date = LocalDate.of(input.date);
    const slot = area.findSlot(input.startTime, input.endTime);
    if (!slot) {
      throw new DomainError(
        'SLOT_NOT_OFFERED',
        `${area.name} no tiene el horario ${input.startTime}–${input.endTime}.`,
      );
    }
    if (!area.isBookableOn(date)) {
      const suspension = area.suspensionOn(date);
      throw new DomainError(
        'AREA_UNAVAILABLE',
        suspension
          ? `${area.name} está suspendida ese día: ${suspension.reason}`
          : `${area.name} no atiende ese día.`,
        DomainErrorType.CONFLICT,
      );
    }

    const reservation = Reservation.request({
      id: this.random.uuid(),
      residentId: input.resident.id,
      areaId: area.id,
      date,
      slot,
      eventStart: date.atTime(slot.start, this.context.timezone),
      fee: area.fee,
      deposit: area.deposit,
      now,
    });

    await this.expireOverdue.execute();
    const sameSlot = await this.reservations.findBySlotKey(reservation.slotKey);
    if (
      sameSlot.some((r) => r.residentId === input.resident.id && r.isActive)
    ) {
      throw new DomainError(
        'DUPLICATE_REQUEST',
        'Ya tienes una solicitud para ese horario.',
        DomainErrorType.CONFLICT,
      );
    }
    SlotAllocationPolicy.assertSlotFree(sameSlot);

    await this.reservations.save(reservation);
    return reservation;
  }
}
