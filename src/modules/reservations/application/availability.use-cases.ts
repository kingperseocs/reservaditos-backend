import { Inject, Injectable } from '@nestjs/common';
import { DateRange } from '../../../shared/domain/date-range';
import { LocalDate } from '../../../shared/domain/local-date';
import { Area } from '../../areas/domain/area';
import {
  AREA_REPOSITORY,
  type AreaRepository,
} from '../../areas/domain/area.repository';
import { Reservation } from '../domain/reservation';
import { SLOT_HOLDING_STATUSES } from '../domain/reservation-status';
import {
  RESERVATION_REPOSITORY,
  type ReservationRepository,
} from '../domain/reservation.repository';
import { SlotAvailability, SlotView } from '../domain/slot-availability';
import { BookingContext } from './booking-context';
import { ExpireOverdueReservationsUseCase } from './expire-overdue-reservations.use-case';

/** Loads slot-holding bookings for a date range and computes availability. */
@Injectable()
export class AvailabilityReader {
  constructor(
    @Inject(RESERVATION_REPOSITORY)
    private readonly reservations: ReservationRepository,
    private readonly context: BookingContext,
    private readonly expireOverdue: ExpireOverdueReservationsUseCase,
  ) {}

  async holders(range: DateRange, areaId?: string): Promise<Reservation[]> {
    await this.expireOverdue.execute();
    return this.reservations.search({
      statuses: [...SLOT_HOLDING_STATUSES],
      areaId,
      from: range.from,
      to: range.to,
    });
  }

  slotsOf(
    area: Area,
    date: LocalDate,
    holders: Reservation[],
    now: Date,
  ): SlotView[] {
    const ofDay = holders.filter(
      (r) => r.areaId === area.id && r.date.equals(date),
    );
    return SlotAvailability.forDay(
      area,
      date,
      ofDay,
      now,
      this.context.timezone,
    );
  }
}

export interface ResidentAreaView {
  area: Area;
  availableToday: boolean;
}

@Injectable()
export class ListAreasForResidentUseCase {
  constructor(
    @Inject(AREA_REPOSITORY) private readonly areas: AreaRepository,
    private readonly context: BookingContext,
    private readonly reader: AvailabilityReader,
  ) {}

  async execute(): Promise<ResidentAreaView[]> {
    const now = this.context.now();
    const today = this.context.today(now);
    const [areas, holders] = await Promise.all([
      this.areas.findAll(),
      this.reader.holders(DateRange.of(today, today)),
    ]);
    return areas.map((area) => ({
      area,
      availableToday: SlotAvailability.hasFreeSlot(
        this.reader.slotsOf(area, today, holders, now),
      ),
    }));
  }
}

export interface DayAvailability {
  date: LocalDate;
  available: boolean;
}

@Injectable()
export class GetMonthAvailabilityUseCase {
  constructor(
    private readonly context: BookingContext,
    private readonly reader: AvailabilityReader,
  ) {}

  async execute(areaId: string, month: string): Promise<DayAvailability[]> {
    const area = await this.context.getArea(areaId);
    const range = DateRange.ofMonth(month);
    const now = this.context.now();
    const holders = await this.reader.holders(range, area.id);
    return range.days().map((date) => ({
      date,
      available: SlotAvailability.hasFreeSlot(
        this.reader.slotsOf(area, date, holders, now),
      ),
    }));
  }
}

@Injectable()
export class GetDaySlotsUseCase {
  constructor(
    private readonly context: BookingContext,
    private readonly reader: AvailabilityReader,
  ) {}

  async execute(
    areaId: string,
    date: string,
  ): Promise<{ area: Area; slots: SlotView[] }> {
    const area = await this.context.getArea(areaId);
    const day = LocalDate.of(date);
    const holders = await this.reader.holders(DateRange.of(day, day), area.id);
    return {
      area,
      slots: this.reader.slotsOf(area, day, holders, this.context.now()),
    };
  }
}
