import { ApiProperty } from '@nestjs/swagger';
import { UserRole } from '../domain/user';

export class ResidentProfileDto {
  @ApiProperty({ example: 'ana-perez' })
  id: string;

  @ApiProperty({ example: 'Ana Pérez' })
  name: string;

  @ApiProperty({ enum: UserRole, example: UserRole.RESIDENT })
  role: UserRole;

  @ApiProperty({ example: '502', nullable: true, type: String })
  apartment: string | null;

  @ApiProperty({ example: 'Edificio Demo' })
  buildingName: string;
}

export class StandingDto {
  @ApiProperty({ example: false, description: 'Can book (rule 5)' })
  upToDate: boolean;

  @ApiProperty({ example: 350 })
  overdueAmount: number;

  @ApiProperty({ example: '2026-11-05', nullable: true, type: String })
  oldestOverdueDate: string | null;

  @ApiProperty({ example: 1 })
  graceDays: number;
}
