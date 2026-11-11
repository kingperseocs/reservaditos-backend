import { LocalDate } from '../../../shared/domain/local-date';
import { Reservation } from './reservation';
import { ReservationStatus } from './reservation-status';

export const RESERVATION_REPOSITORY = Symbol('RESERVATION_REPOSITORY');

export interface ReservationSearch {
  statuses?: ReservationStatus[];
  areaId?: string;
  residentId?: string;
  from?: LocalDate;
  to?: LocalDate;
}

export interface ReservationRepository {
  /** Insert or replace. Throws SLOT_TAKEN if another booking already holds the slot. */
  save(reservation: Reservation): Promise<void>;
  findById(id: string): Promise<Reservation | null>;
  findByPaymentToken(token: string): Promise<Reservation | null>;
  findBySlotKey(slotKey: string): Promise<Reservation[]>;
  findApprovedWithDeadlineBefore(now: Date): Promise<Reservation[]>;
  search(criteria: ReservationSearch): Promise<Reservation[]>;
  deleteAll(): Promise<void>;
}
