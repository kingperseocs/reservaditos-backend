import { Area } from './area';

export const AREA_REPOSITORY = Symbol('AREA_REPOSITORY');

export interface AreaRepository {
  findAll(): Promise<Area[]>;
  findById(id: string): Promise<Area | null>;
  save(area: Area): Promise<void>;
  deleteAll(): Promise<void>;
}
