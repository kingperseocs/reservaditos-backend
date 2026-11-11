import { Inject, Injectable } from '@nestjs/common';
import { DateRange } from '../../../shared/domain/date-range';
import { DomainError } from '../../../shared/domain/domain-error';
import { LocalDate } from '../../../shared/domain/local-date';
import {
  RANDOM_GENERATOR,
  type RandomGenerator,
} from '../../../shared/domain/ports';
import { Suspension } from '../../areas/domain/area';
import {
  AREA_REPOSITORY,
  type AreaRepository,
} from '../../areas/domain/area.repository';
import { Reservation } from '../domain/reservation';
import {
  ACTIVE_STATUSES,
  ReservationStatus,
} from '../domain/reservation-status';
import {
  RESERVATION_REPOSITORY,
  type ReservationRepository,
} from '../domain/reservation.repository';
import { BookingContext } from './booking-context';

export interface SuspensionInput {
  areaId: string;
  from: string;
  to: string;
}

export interface SuspensionImpact {
  paidCount: number;
  refundAmount: number;
  unpaidCount: number;
}

export interface SuspensionResult extends SuspensionImpact {
  suspension: Suspension;
}

/** Active bookings of an area inside a range, split by what rule 6 does with them. */
@Injectable()
export class SuspensionImpactCalculator {
  constructor(
    @Inject(RESERVATION_REPOSITORY)
    private readonly reservations: ReservationRepository,
    private readonly context: BookingContext,
  ) {}

  range(input: SuspensionInput): DateRange {
    const range = DateRange.of(
      LocalDate.of(input.from),
      LocalDate.of(input.to),
    );
    if (range.from.isBefore(this.context.today())) {
      throw new DomainError(
        'SUSPENSION_IN_PAST',
        'La suspensión no puede empezar en una fecha pasada.',
      );
    }
    return range;
  }

  affected(areaId: string, range: DateRange): Promise<Reservation[]> {
    return this.reservations.search({
      areaId,
      statuses: [...ACTIVE_STATUSES],
      from: range.from,
      to: range.to,
    });
  }

  impact(affected: Reservation[]): SuspensionImpact {
    const paid = affected.filter(
      (r) => r.status === ReservationStatus.CONFIRMED,
    );
    return {
      paidCount: paid.length,
      refundAmount: paid.reduce((sum, r) => sum + r.total, 0),
      unpaidCount: affected.length - paid.length,
    };
  }
}

@Injectable()
export class PreviewAreaSuspensionUseCase {
  constructor(
    private readonly context: BookingContext,
    private readonly calculator: SuspensionImpactCalculator,
  ) {}

  async execute(input: SuspensionInput): Promise<SuspensionImpact> {
    const area = await this.context.getArea(input.areaId);
    const range = this.calculator.range(input);
    return this.calculator.impact(
      await this.calculator.affected(area.id, range),
    );
  }
}

/** Rule 6: suspend an area; paid bookings in range are refunded 100 %. */
@Injectable()
export class SuspendAreaUseCase {
  constructor(
    @Inject(AREA_REPOSITORY) private readonly areas: AreaRepository,
    @Inject(RESERVATION_REPOSITORY)
    private readonly reservations: ReservationRepository,
    @Inject(RANDOM_GENERATOR) private readonly random: RandomGenerator,
    private readonly context: BookingContext,
    private readonly calculator: SuspensionImpactCalculator,
  ) {}

  async execute(
    input: SuspensionInput & { reason: string },
  ): Promise<SuspensionResult> {
    const now = this.context.now();
    const area = await this.context.getArea(input.areaId);
    const range = this.calculator.range(input);

    const suspension = area.suspend(
      this.random.uuid(),
      range,
      input.reason,
      now,
    );
    await this.areas.save(area);

    const affected = await this.calculator.affected(area.id, range);
    const impact = this.calculator.impact(affected);
    for (const reservation of affected) {
      reservation.cancelBySuspension(
        `Área suspendida: ${suspension.reason}`,
        now,
      );
      await this.reservations.save(reservation);
    }
    return { suspension, ...impact };
  }
}
