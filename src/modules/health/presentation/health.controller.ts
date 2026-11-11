import { Controller, Get } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Connection, ConnectionStates } from 'mongoose';
import { HealthResponseDto } from './health.response.dto';

@ApiTags('Health')
@Controller('health')
export class HealthController {
  constructor(@InjectConnection() private readonly connection: Connection) {}

  @Get()
  @ApiOperation({ summary: 'Service and database status' })
  @ApiOkResponse({ type: HealthResponseDto })
  check(): HealthResponseDto {
    const isDatabaseUp =
      this.connection.readyState === ConnectionStates.connected;

    return {
      status: isDatabaseUp ? 'ok' : 'degraded',
      database: isDatabaseUp ? 'up' : 'down',
      timestamp: new Date().toISOString(),
    };
  }
}
