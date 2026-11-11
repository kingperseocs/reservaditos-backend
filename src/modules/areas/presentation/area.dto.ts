import { ApiProperty } from '@nestjs/swagger';

export class SlotDto {
  @ApiProperty({ example: '12:00' })
  start: string;

  @ApiProperty({ example: '15:00' })
  end: string;

  @ApiProperty({ example: '12:00–15:00' })
  label: string;
}

export class AreaSummaryDto {
  @ApiProperty({ example: 'grill' })
  id: string;

  @ApiProperty({ example: 'Parrilla' })
  name: string;

  @ApiProperty({
    example: 'flame',
    description: 'Icon key: flame | users | waves',
  })
  icon: string;
}

export class SuspensionDto {
  @ApiProperty({ example: '7c1f…' })
  id: string;

  @ApiProperty({ example: '2026-11-20' })
  from: string;

  @ApiProperty({ example: '2026-11-22' })
  to: string;

  @ApiProperty({ example: 'Mantenimiento programado' })
  reason: string;
}

export class AdminAreaDto extends AreaSummaryDto {
  @ApiProperty({ example: 50 })
  fee: number;

  @ApiProperty({ example: 100 })
  deposit: number;

  @ApiProperty({ enum: ['ACTIVE', 'SUSPENDED'], example: 'ACTIVE' })
  status: 'ACTIVE' | 'SUSPENDED';

  @ApiProperty({
    type: [SuspensionDto],
    description: 'Current and future suspensions',
  })
  suspensions: SuspensionDto[];
}
