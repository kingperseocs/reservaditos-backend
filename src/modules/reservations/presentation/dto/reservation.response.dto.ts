import { ApiProperty } from '@nestjs/swagger';
import {
  AreaSummaryDto,
  SlotDto,
  SuspensionDto,
} from '../../../areas/presentation/area.dto';
import { ReservationStatus } from '../../domain/reservation-status';
import { SlotStatus } from '../../domain/slot-availability';

export class ResidentAreaDto extends AreaSummaryDto {
  @ApiProperty({ example: 50 })
  fee: number;

  @ApiProperty({ example: 100 })
  deposit: number;

  @ApiProperty({ example: 150 })
  total: number;

  @ApiProperty({ example: true, description: 'At least one free slot today' })
  availableToday: boolean;
}

export class DayAvailabilityDto {
  @ApiProperty({ example: '2026-11-14' })
  date: string;

  @ApiProperty({ example: true, description: 'Has at least one free slot' })
  available: boolean;
}

export class MonthAvailabilityDto {
  @ApiProperty({ example: 'grill' })
  areaId: string;

  @ApiProperty({ example: '2026-11' })
  month: string;

  @ApiProperty({ type: [DayAvailabilityDto] })
  days: DayAvailabilityDto[];
}

export class SlotAvailabilityDto extends SlotDto {
  @ApiProperty({ enum: SlotStatus, example: SlotStatus.FREE })
  status: SlotStatus;
}

export class DaySlotsDto {
  @ApiProperty({ example: 'grill' })
  areaId: string;

  @ApiProperty({ example: '2026-11-14' })
  date: string;

  @ApiProperty({ type: [SlotAvailabilityDto] })
  slots: SlotAvailabilityDto[];
}

export class ReservationDto {
  @ApiProperty({ example: '5b0c6d1e-…' })
  id: string;

  @ApiProperty({ enum: ReservationStatus, example: ReservationStatus.APPROVED })
  status: ReservationStatus;

  @ApiProperty({ type: AreaSummaryDto })
  area: AreaSummaryDto;

  @ApiProperty({ example: 'Edificio Demo' })
  buildingName: string;

  @ApiProperty({ example: '2026-11-14' })
  date: string;

  @ApiProperty({ type: SlotDto })
  slot: SlotDto;

  @ApiProperty({ example: 50 })
  fee: number;

  @ApiProperty({ example: 100 })
  deposit: number;

  @ApiProperty({ example: 150 })
  total: number;

  @ApiProperty({ example: '2026-11-11T14:00:00.000Z' })
  requestedAt: string;

  @ApiProperty({
    example: '2026-11-12T02:00:00.000Z',
    nullable: true,
    type: String,
  })
  paymentDeadline: string | null;

  @ApiProperty({
    example: 'http://localhost:8000/v1/payments/9f2c…',
    nullable: true,
    type: String,
    description: 'Only while APPROVED',
  })
  paymentUrl: string | null;

  @ApiProperty({
    example: '2026-11-12T23:32:00.000Z',
    nullable: true,
    type: String,
  })
  paidAt: string | null;

  @ApiProperty({ example: 'DEMO-4821', nullable: true, type: String })
  code: string | null;

  @ApiProperty({ example: null, nullable: true, type: String })
  rejectionReason: string | null;

  @ApiProperty({ example: null, nullable: true, type: Number })
  refundAmount: number | null;
}

export class ResidentSummaryDto {
  @ApiProperty({ example: 'ana-perez' })
  id: string;

  @ApiProperty({ example: 'Ana Pérez' })
  name: string;

  @ApiProperty({ example: '502', nullable: true, type: String })
  apartment: string | null;
}

export class AdminReservationDto {
  @ApiProperty({ example: '5b0c6d1e-…' })
  id: string;

  @ApiProperty({ enum: ReservationStatus })
  status: ReservationStatus;

  @ApiProperty({ type: ResidentSummaryDto })
  resident: ResidentSummaryDto;

  @ApiProperty({ type: AreaSummaryDto })
  area: AreaSummaryDto;

  @ApiProperty({ example: '2026-11-14' })
  date: string;

  @ApiProperty({ type: SlotDto })
  slot: SlotDto;

  @ApiProperty({ example: '2026-11-11T12:00:00.000Z' })
  requestedAt: string;

  @ApiProperty({
    example: true,
    description:
      'Earliest of several requests for the same slot ("Pedida primero")',
  })
  firstInLine: boolean;
}

export class PaymentDto {
  @ApiProperty({ example: '5b0c6d1e-…' })
  reservationId: string;

  @ApiProperty({ enum: ReservationStatus, example: ReservationStatus.APPROVED })
  status: ReservationStatus;

  @ApiProperty({ example: 'Parrilla' })
  areaName: string;

  @ApiProperty({ example: '2026-11-14' })
  date: string;

  @ApiProperty({ type: SlotDto })
  slot: SlotDto;

  @ApiProperty({ example: 150 })
  amount: number;

  @ApiProperty({
    example: '2026-11-12T02:00:00.000Z',
    nullable: true,
    type: String,
  })
  deadline: string | null;

  @ApiProperty({ example: null, nullable: true, type: String })
  code: string | null;
}

export class SuspensionImpactDto {
  @ApiProperty({ example: 3, description: 'Paid bookings to refund 100 %' })
  paidCount: number;

  @ApiProperty({ example: 450 })
  refundAmount: number;

  @ApiProperty({
    example: 1,
    description: 'Pending or approved bookings to reject',
  })
  unpaidCount: number;
}

export class SuspensionResultDto extends SuspensionImpactDto {
  @ApiProperty({ type: SuspensionDto })
  suspension: SuspensionDto;
}
