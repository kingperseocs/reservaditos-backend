import { Inject, Injectable } from '@nestjs/common';
import { DateRange } from '../../../shared/domain/date-range';
import { ReservationStatus } from '../domain/reservation-status';
import {
  RESERVATION_REPOSITORY,
  type ReservationRepository,
} from '../domain/reservation.repository';
import { Reservation } from '../domain/reservation';
import { SlotAllocationPolicy } from '../domain/slot-allocation.policy';
import { ExpireOverdueReservationsUseCase } from './expire-overdue-reservations.use-case';
import {
  ReservationDetails,
  ReservationDetailsAssembler,
} from './reservation-details.assembler';

export interface AdminReservationsFilter {
  status?: ReservationStatus;
  areaId?: string;
  /** yyyy-MM */
  month?: string;
}

export interface AdminReservationView extends ReservationDetails {
  /** True for the earliest pending request of a slot that others also want (rule 4). */
  firstInLine: boolean;
}

@Injectable()
export class ListAdminReservationsUseCase {
  constructor(
    @Inject(RESERVATION_REPOSITORY)
    private readonly reservations: ReservationRepository,
    private readonly assembler: ReservationDetailsAssembler,
    private readonly expireOverdue: ExpireOverdueReservationsUseCase,
  ) {}

  async execute(
    filter: AdminReservationsFilter,
  ): Promise<AdminReservationView[]> {
    await this.expireOverdue.execute();
    const range = filter.month ? DateRange.ofMonth(filter.month) : undefined;
    const found = await this.reservations.search({
      statuses: [filter.status ?? ReservationStatus.PENDING_APPROVAL],
      areaId: filter.areaId,
      from: range?.from,
      to: range?.to,
    });

    const firstInLine = this.contestedWinners(found);
    const details = await this.assembler.assemble(found);
    return details.map((d) => ({
      ...d,
      firstInLine: firstInLine.has(d.reservation.id),
    }));
  }

  private contestedWinners(reservations: Reservation[]): Set<string> {
    const bySlot = new Map<string, Reservation[]>();
    for (const r of reservations) {
      bySlot.set(r.slotKey, [...(bySlot.get(r.slotKey) ?? []), r]);
    }
    const winners = new Set<string>();
    for (const group of bySlot.values()) {
      const first = SlotAllocationPolicy.firstInLine(group);
      const pending = group.filter(
        (r) => r.status === ReservationStatus.PENDING_APPROVAL,
      );
      if (first && pending.length > 1) winners.add(first.id);
    }
    return winners;
  }
}
