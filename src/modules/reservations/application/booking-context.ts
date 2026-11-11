import { Inject, Injectable } from '@nestjs/common';
import { LocalDate } from '../../../shared/domain/local-date';
import {
  BUILDING_SETTINGS,
  type BuildingSettings,
  CLOCK,
  type Clock,
} from '../../../shared/domain/ports';
import { Area } from '../../areas/domain/area';
import {
  AREA_REPOSITORY,
  type AreaRepository,
} from '../../areas/domain/area.repository';
import { notFound } from '../../../shared/domain/errors';

/** Time, building settings and area lookup shared by the booking use cases. */
@Injectable()
export class BookingContext {
  constructor(
    @Inject(CLOCK) private readonly clock: Clock,
    @Inject(BUILDING_SETTINGS) readonly building: BuildingSettings,
    @Inject(AREA_REPOSITORY) private readonly areas: AreaRepository,
  ) {}

  now(): Date {
    return this.clock.now();
  }

  today(now: Date = this.now()): LocalDate {
    return LocalDate.fromInstant(now, this.building.timezone);
  }

  get timezone(): string {
    return this.building.timezone;
  }

  async getArea(id: string): Promise<Area> {
    const area = await this.areas.findById(id);
    if (!area) throw notFound('area', id);
    return area;
  }
}
