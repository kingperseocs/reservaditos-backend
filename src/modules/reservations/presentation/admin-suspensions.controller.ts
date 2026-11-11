import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import {
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { ApiErrorResponses } from '../../../shared/infrastructure/http/api-error-responses.decorator';
import { UserRole } from '../../users/domain/user';
import { Auth } from '../../users/presentation/auth/auth.decorators';
import {
  PreviewAreaSuspensionUseCase,
  SuspendAreaUseCase,
} from '../application/area-suspension.use-cases';
import {
  SuspendAreaDto,
  SuspensionRangeQueryDto,
} from './dto/reservation.request.dto';
import {
  SuspensionImpactDto,
  SuspensionResultDto,
} from './dto/reservation.response.dto';

@ApiTags('Admin · Areas')
@Auth(UserRole.ADMIN)
@Controller('admin/areas/:areaId/suspensions')
export class AdminSuspensionsController {
  constructor(
    private readonly preview: PreviewAreaSuspensionUseCase,
    private readonly suspendArea: SuspendAreaUseCase,
  ) {}

  @Get('preview')
  @ApiOperation({
    summary: 'Bookings affected by a suspension, before confirming it',
  })
  @ApiOkResponse({ type: SuspensionImpactDto })
  @ApiErrorResponses(400, 404)
  impact(
    @Param('areaId') areaId: string,
    @Query() range: SuspensionRangeQueryDto,
  ): Promise<SuspensionImpactDto> {
    return this.preview.execute({ areaId, ...range });
  }

  @Post()
  @ApiOperation({
    summary: 'Suspend an area; paid bookings are refunded 100 %',
  })
  @ApiCreatedResponse({ type: SuspensionResultDto })
  @ApiErrorResponses(400, 404)
  async suspend(
    @Param('areaId') areaId: string,
    @Body() body: SuspendAreaDto,
  ): Promise<SuspensionResultDto> {
    const { suspension, ...impact } = await this.suspendArea.execute({
      areaId,
      ...body,
    });
    return {
      ...impact,
      suspension: {
        id: suspension.id,
        from: suspension.range.from.value,
        to: suspension.range.to.value,
        reason: suspension.reason,
      },
    };
  }
}
