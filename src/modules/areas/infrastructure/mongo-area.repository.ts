import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { DateRange } from '../../../shared/domain/date-range';
import { LocalDate } from '../../../shared/domain/local-date';
import { TimeSlot } from '../../../shared/domain/time-slot';
import { Area } from '../domain/area';
import { AreaRepository } from '../domain/area.repository';
import { AreaRecord } from './area.schema';

@Injectable()
export class MongoAreaRepository implements AreaRepository {
  constructor(
    @InjectModel(AreaRecord.name) private readonly model: Model<AreaRecord>,
  ) {}

  async findAll(): Promise<Area[]> {
    const records = await this.model
      .find()
      .sort({ createdAt: 1 })
      .lean<AreaRecord[]>()
      .exec();
    return records.map(toDomain);
  }

  async findById(id: string): Promise<Area | null> {
    const record = await this.model.findById(id).lean<AreaRecord>().exec();
    return record ? toDomain(record) : null;
  }

  /** $set keeps createdAt (used to order the areas); replaceOne would reset it. */
  async save(area: Area): Promise<void> {
    const { _id, ...fields } = toRecord(area);
    await this.model
      .updateOne({ _id }, { $set: fields }, { upsert: true })
      .exec();
  }

  async deleteAll(): Promise<void> {
    await this.model.deleteMany({}).exec();
  }
}

function toDomain(record: AreaRecord): Area {
  return Area.restore({
    id: record._id,
    name: record.name,
    icon: record.icon,
    fee: record.fee,
    deposit: record.deposit,
    slots: record.slots.map((s) => TimeSlot.of(s.start, s.end)),
    openWeekdays: record.openWeekdays,
    suspensions: record.suspensions.map((s) => ({
      id: s.id,
      range: DateRange.of(LocalDate.of(s.from), LocalDate.of(s.to)),
      reason: s.reason,
      createdAt: s.createdAt,
    })),
  });
}

function toRecord(area: Area): AreaRecord {
  return {
    _id: area.id,
    name: area.name,
    icon: area.icon,
    fee: area.fee,
    deposit: area.deposit,
    slots: area.slots.map((s) => ({ start: s.start, end: s.end })),
    openWeekdays: [...area.openWeekdays],
    suspensions: area.suspensions.map((s) => ({
      id: s.id,
      from: s.range.from.value,
      to: s.range.to.value,
      reason: s.reason,
      createdAt: s.createdAt,
    })),
  };
}
