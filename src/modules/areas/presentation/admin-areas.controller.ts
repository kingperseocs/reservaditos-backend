import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { UserRole } from '../../users/domain/user';
import { Auth } from '../../users/presentation/auth/auth.decorators';
import { ListAreasForAdminUseCase } from '../application/list-areas-for-admin.use-case';
import { AdminAreaDto } from './area.dto';

@ApiTags('Admin · Areas')
@Auth(UserRole.ADMIN)
@Controller('admin/areas')
export class AdminAreasController {
  constructor(private readonly listAreas: ListAreasForAdminUseCase) {}

  @Get()
  @ApiOperation({ summary: 'Areas with today status and suspensions' })
  @ApiOkResponse({ type: [AdminAreaDto] })
  async list(): Promise<AdminAreaDto[]> {
    const views = await this.listAreas.execute();
    return views.map(({ area, suspendedToday, upcomingSuspensions }) => ({
      id: area.id,
      name: area.name,
      icon: area.icon,
      fee: area.fee,
      deposit: area.deposit,
      status: suspendedToday ? 'SUSPENDED' : 'ACTIVE',
      suspensions: upcomingSuspensions.map((s) => ({
        id: s.id,
        from: s.range.from.value,
        to: s.range.to.value,
        reason: s.reason,
      })),
    }));
  }
}
