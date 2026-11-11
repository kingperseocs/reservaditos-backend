import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsISO8601,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
} from 'class-validator';
import { ReservationStatus } from '../../domain/reservation-status';

const HH_MM = /^([01]\d|2[0-3]):[0-5]\d$/;
const YYYY_MM = /^\d{4}-(0[1-9]|1[0-2])$/;

export class CreateReservationDto {
  @ApiProperty({ example: 'grill' })
  @IsString()
  @IsNotEmpty()
  areaId: string;

  @ApiProperty({ example: '2026-11-14' })
  @IsISO8601({ strict: true })
  date: string;

  @ApiProperty({ example: '12:00' })
  @Matches(HH_MM, { message: 'startTime must be HH:mm' })
  startTime: string;

  @ApiProperty({ example: '15:00' })
  @Matches(HH_MM, { message: 'endTime must be HH:mm' })
  endTime: string;
}

export class RejectReservationDto {
  @ApiProperty({ example: 'El área está en mantenimiento ese día.' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(300)
  reason: string;
}

export class AdminReservationsQueryDto {
  @ApiPropertyOptional({
    enum: ReservationStatus,
    default: ReservationStatus.PENDING_APPROVAL,
  })
  @IsOptional()
  @IsEnum(ReservationStatus)
  status?: ReservationStatus;

  @ApiPropertyOptional({ example: 'grill' })
  @IsOptional()
  @IsString()
  areaId?: string;

  @ApiPropertyOptional({ example: '2026-11', description: 'yyyy-MM' })
  @IsOptional()
  @Matches(YYYY_MM, { message: 'month must be yyyy-MM' })
  month?: string;
}

export class MonthQueryDto {
  @ApiProperty({ example: '2026-11', description: 'yyyy-MM' })
  @Matches(YYYY_MM, { message: 'month must be yyyy-MM' })
  month: string;
}

export class DateQueryDto {
  @ApiProperty({ example: '2026-11-14' })
  @IsISO8601({ strict: true })
  date: string;
}

export class SuspensionRangeQueryDto {
  @ApiProperty({ example: '2026-11-20' })
  @IsISO8601({ strict: true })
  from: string;

  @ApiProperty({ example: '2026-11-22' })
  @IsISO8601({ strict: true })
  to: string;
}

export class SuspendAreaDto extends SuspensionRangeQueryDto {
  @ApiProperty({ example: 'Mantenimiento programado' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(300)
  reason: string;
}
