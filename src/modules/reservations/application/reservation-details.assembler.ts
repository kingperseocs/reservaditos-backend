import { Inject, Injectable } from '@nestjs/common';
import { Area } from '../../areas/domain/area';
import {
  AREA_REPOSITORY,
  type AreaRepository,
} from '../../areas/domain/area.repository';
import { User } from '../../users/domain/user';
import {
  USER_REPOSITORY,
  type UserRepository,
} from '../../users/domain/user.repository';
import { Reservation } from '../domain/reservation';

export interface ReservationDetails {
  reservation: Reservation;
  area: Area;
  resident: User | null;
}

/** Read model: joins each reservation with its area and resident in two queries. */
@Injectable()
export class ReservationDetailsAssembler {
  constructor(
    @Inject(AREA_REPOSITORY) private readonly areas: AreaRepository,
    @Inject(USER_REPOSITORY) private readonly users: UserRepository,
  ) {}

  async assemble(reservations: Reservation[]): Promise<ReservationDetails[]> {
    const [areas, residents] = await Promise.all([
      this.areas.findAll(),
      this.users.findByIds([...new Set(reservations.map((r) => r.residentId))]),
    ]);
    const areaById = new Map(areas.map((a) => [a.id, a]));
    const residentById = new Map(residents.map((u) => [u.id, u]));

    return reservations.flatMap((reservation) => {
      const area = areaById.get(reservation.areaId);
      if (!area) return [];
      return [
        {
          reservation,
          area,
          resident: residentById.get(reservation.residentId) ?? null,
        },
      ];
    });
  }

  async assembleOne(reservation: Reservation): Promise<ReservationDetails> {
    const [details] = await this.assemble([reservation]);
    return details;
  }
}
