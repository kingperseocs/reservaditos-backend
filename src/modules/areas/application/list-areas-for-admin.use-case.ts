import { Inject, Injectable } from '@nestjs/common';
import { LocalDate } from '../../../shared/domain/local-date';
import {
  BUILDING_SETTINGS,
  type BuildingSettings,
  CLOCK,
  type Clock,
} from '../../../shared/domain/ports';
import { Area, Suspension } from '../domain/area';
import {
  AREA_REPOSITORY,
  type AreaRepository,
} from '../domain/area.repository';

export interface AdminAreaView {
  area: Area;
  suspendedToday: boolean;
  /** Current and future suspensions. */
  upcomingSuspensions: Suspension[];
}

@Injectable()
export class ListAreasForAdminUseCase {
  constructor(
    @Inject(AREA_REPOSITORY) private readonly areas: AreaRepository,
    @Inject(CLOCK) private readonly clock: Clock,
    @Inject(BUILDING_SETTINGS) private readonly building: BuildingSettings,
  ) {}

  async execute(): Promise<AdminAreaView[]> {
    const today = LocalDate.fromInstant(
      this.clock.now(),
      this.building.timezone,
    );
    const areas = await this.areas.findAll();
    return areas.map((area) => ({
      area,
      suspendedToday: Boolean(area.suspensionOn(today)),
      upcomingSuspensions: area.suspensions.filter(
        (s) => !s.range.to.isBefore(today),
      ),
    }));
  }
}
