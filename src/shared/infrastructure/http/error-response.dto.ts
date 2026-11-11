import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ErrorResponseDto {
  @ApiProperty({ example: 409 })
  statusCode: number;

  @ApiProperty({ example: 'SLOT_TAKEN', description: 'Stable error code' })
  code: string;

  @ApiProperty({ example: 'Ese horario ya está reservado.' })
  message: string;

  @ApiPropertyOptional({
    example: { overdueAmount: 350, oldestOverdueDate: '2026-11-05' },
  })
  details?: Record<string, unknown>;
}
