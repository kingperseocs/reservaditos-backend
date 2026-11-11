import { Inject, Injectable } from '@nestjs/common';
import {
  BUILDING_SETTINGS,
  type BuildingSettings,
} from '../../../shared/domain/ports';
import { TimeSlot } from '../../../shared/domain/time-slot';
import { Area } from '../../areas/domain/area';
import { AreaSummaryDto, SlotDto } from '../../areas/presentation/area.dto';
import { AdminReservationView } from '../application/list-admin-reservations.use-case';
import { ReservationDetails } from '../application/reservation-details.assembler';
import { ReservationStatus } from '../domain/reservation-status';
import {
  AdminReservationDto,
  PaymentDto,
  ReservationDto,
} from './dto/reservation.response.dto';

const iso = (date: Date | null): string | null => date?.toISOString() ?? null;

/** Maps domain objects to API responses. */
@Injectable()
export class ReservationPresenter {
  constructor(
    @Inject(BUILDING_SETTINGS) private readonly building: BuildingSettings,
  ) {}

  static slot(slot: TimeSlot): SlotDto {
    return { start: slot.start, end: slot.end, label: slot.label };
  }

  static area(area: Area): AreaSummaryDto {
    return { id: area.id, name: area.name, icon: area.icon };
  }

  reservation({ reservation: r, area }: ReservationDetails): ReservationDto {
    return {
      id: r.id,
      status: r.status,
      area: ReservationPresenter.area(area),
      buildingName: this.building.name,
      date: r.date.value,
      slot: ReservationPresenter.slot(r.slot),
      fee: r.fee,
      deposit: r.deposit,
      total: r.total,
      requestedAt: r.requestedAt.toISOString(),
      paymentDeadline: iso(r.paymentDeadline),
      paymentUrl:
        r.status === ReservationStatus.APPROVED && r.paymentToken
          ? `${this.building.publicBaseUrl}/v1/payments/${r.paymentToken}`
          : null,
      paidAt: iso(r.paidAt),
      code: r.code,
      rejectionReason: r.rejectionReason,
      refundAmount: r.refundAmount,
    };
  }

  admin(view: AdminReservationView): AdminReservationDto {
    const { reservation: r, area, resident } = view;
    return {
      id: r.id,
      status: r.status,
      resident: {
        id: r.residentId,
        name: resident?.name ?? r.residentId,
        apartment: resident?.apartment ?? null,
      },
      area: ReservationPresenter.area(area),
      date: r.date.value,
      slot: ReservationPresenter.slot(r.slot),
      requestedAt: r.requestedAt.toISOString(),
      firstInLine: view.firstInLine,
    };
  }

  payment({ reservation: r, area }: ReservationDetails): PaymentDto {
    return {
      reservationId: r.id,
      status: r.status,
      areaName: area.name,
      date: r.date.value,
      slot: ReservationPresenter.slot(r.slot),
      amount: r.total,
      deadline: iso(r.paymentDeadline),
      code: r.code,
    };
  }
}
