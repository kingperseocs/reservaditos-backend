import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, mongo, QueryFilter } from 'mongoose';
import {
  DomainError,
  DomainErrorType,
} from '../../../shared/domain/domain-error';
import { Reservation } from '../domain/reservation';
import { ReservationStatus } from '../domain/reservation-status';
import {
  ReservationRepository,
  ReservationSearch,
} from '../domain/reservation.repository';
import { ReservationMapper } from './reservation.mapper';
import { ReservationRecord } from './reservation.schema';

const DUPLICATE_KEY = 11000;

@Injectable()
export class MongoReservationRepository implements ReservationRepository {
  constructor(
    @InjectModel(ReservationRecord.name)
    private readonly model: Model<ReservationRecord>,
  ) {}

  async save(reservation: Reservation): Promise<void> {
    try {
      await this.model
        .replaceOne(
          { _id: reservation.id },
          ReservationMapper.toRecord(reservation),
          { upsert: true },
        )
        .exec();
    } catch (error) {
      if (
        error instanceof mongo.MongoServerError &&
        error.code === DUPLICATE_KEY
      ) {
        throw new DomainError(
          'SLOT_TAKEN',
          'Ese horario ya está reservado.',
          DomainErrorType.CONFLICT,
        );
      }
      throw error;
    }
  }

  findById(id: string): Promise<Reservation | null> {
    return this.findOne({ _id: id });
  }

  findByPaymentToken(token: string): Promise<Reservation | null> {
    return this.findOne({ paymentToken: token });
  }

  findBySlotKey(slotKey: string): Promise<Reservation[]> {
    return this.findMany({ slotKey });
  }

  findApprovedWithDeadlineBefore(now: Date): Promise<Reservation[]> {
    return this.findMany({
      status: ReservationStatus.APPROVED,
      paymentDeadline: { $lte: now },
    });
  }

  search(criteria: ReservationSearch): Promise<Reservation[]> {
    const filter: QueryFilter<ReservationRecord> = {};
    if (criteria.statuses?.length) filter.status = { $in: criteria.statuses };
    if (criteria.areaId) filter.areaId = criteria.areaId;
    if (criteria.residentId) filter.residentId = criteria.residentId;
    if (criteria.from || criteria.to) {
      filter.date = {
        ...(criteria.from && { $gte: criteria.from.value }),
        ...(criteria.to && { $lte: criteria.to.value }),
      };
    }
    return this.findMany(filter);
  }

  async deleteAll(): Promise<void> {
    await this.model.deleteMany({}).exec();
  }

  private async findOne(
    filter: QueryFilter<ReservationRecord>,
  ): Promise<Reservation | null> {
    const record = await this.model
      .findOne(filter)
      .lean<ReservationRecord>()
      .exec();
    return record ? ReservationMapper.toDomain(record) : null;
  }

  private async findMany(
    filter: QueryFilter<ReservationRecord>,
  ): Promise<Reservation[]> {
    const records = await this.model
      .find(filter)
      .sort({ requestedAt: 1, _id: 1 })
      .lean<ReservationRecord[]>()
      .exec();
    return records.map((r) => ReservationMapper.toDomain(r));
  }
}
