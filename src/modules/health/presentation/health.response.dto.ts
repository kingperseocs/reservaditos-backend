import { ApiProperty } from '@nestjs/swagger';

export class HealthResponseDto {
  @ApiProperty({ enum: ['ok', 'degraded'], example: 'ok' })
  status: 'ok' | 'degraded';

  @ApiProperty({ enum: ['up', 'down'], example: 'up' })
  database: 'up' | 'down';

  @ApiProperty({ example: '2026-11-11T14:00:00.000Z' })
  timestamp: string;
}
