import { Controller, Get, Inject } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import {
  BUILDING_SETTINGS,
  type BuildingSettings,
} from '../../../shared/domain/ports';
import { GetResidentStandingUseCase } from '../application/get-resident-standing.use-case';
import { DuesStandingPolicy } from '../domain/dues-standing.policy';
import { User, UserRole } from '../domain/user';
import { Auth, CurrentUser } from './auth/auth.decorators';
import { ResidentProfileDto, StandingDto } from './resident.dto';

@ApiTags('Residents')
@Controller('residents/me')
export class ResidentsController {
  constructor(
    private readonly getStanding: GetResidentStandingUseCase,
    @Inject(BUILDING_SETTINGS) private readonly building: BuildingSettings,
  ) {}

  @Get()
  @Auth(UserRole.RESIDENT, UserRole.ADMIN)
  @ApiOperation({ summary: 'Current user profile' })
  @ApiOkResponse({ type: ResidentProfileDto })
  profile(@CurrentUser() user: User): ResidentProfileDto {
    return {
      id: user.id,
      name: user.name,
      role: user.role,
      apartment: user.apartment,
      buildingName: this.building.name,
    };
  }

  @Get('standing')
  @Auth(UserRole.RESIDENT)
  @ApiOperation({ summary: 'Whether the resident is up to date with dues' })
  @ApiOkResponse({ type: StandingDto })
  standing(@CurrentUser() user: User): StandingDto {
    const standing = this.getStanding.execute(user);
    return {
      upToDate: standing.upToDate,
      overdueAmount: standing.overdueAmount,
      oldestOverdueDate: standing.oldestOverdueDate?.value ?? null,
      graceDays: DuesStandingPolicy.GRACE_DAYS,
    };
  }
}
