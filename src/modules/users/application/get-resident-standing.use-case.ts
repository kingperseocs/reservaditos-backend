import { Inject, Injectable } from '@nestjs/common';
import { LocalDate } from '../../../shared/domain/local-date';
import {
  BUILDING_SETTINGS,
  type BuildingSettings,
  CLOCK,
  type Clock,
} from '../../../shared/domain/ports';
import { Standing } from '../domain/dues-standing.policy';
import { User } from '../domain/user';

@Injectable()
export class GetResidentStandingUseCase {
  constructor(
    @Inject(CLOCK) private readonly clock: Clock,
    @Inject(BUILDING_SETTINGS) private readonly building: BuildingSettings,
  ) {}

  execute(resident: User): Standing {
    const today = LocalDate.fromInstant(
      this.clock.now(),
      this.building.timezone,
    );
    return resident.standing(today);
  }
}
