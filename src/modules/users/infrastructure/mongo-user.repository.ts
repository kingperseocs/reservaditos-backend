import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { LocalDate } from '../../../shared/domain/local-date';
import { User } from '../domain/user';
import { UserRepository } from '../domain/user.repository';
import { UserRecord } from './user.schema';

@Injectable()
export class MongoUserRepository implements UserRepository {
  constructor(
    @InjectModel(UserRecord.name) private readonly model: Model<UserRecord>,
  ) {}

  async findById(id: string): Promise<User | null> {
    const record = await this.model.findById(id).lean<UserRecord>().exec();
    return record ? toDomain(record) : null;
  }

  async findByIds(ids: string[]): Promise<User[]> {
    const records = await this.model
      .find({ _id: { $in: ids } })
      .lean<UserRecord[]>()
      .exec();
    return records.map(toDomain);
  }

  async save(user: User): Promise<void> {
    await this.model
      .replaceOne({ _id: user.id }, toRecord(user), { upsert: true })
      .exec();
  }

  async deleteAll(): Promise<void> {
    await this.model.deleteMany({}).exec();
  }
}

function toDomain(record: UserRecord): User {
  return User.restore({
    id: record._id,
    name: record.name,
    role: record.role,
    apartment: record.apartment,
    dues: record.dues.map((due) => ({
      id: due.id,
      amount: due.amount,
      dueDate: LocalDate.of(due.dueDate),
      paidAt: due.paidAt,
    })),
  });
}

function toRecord(user: User): UserRecord {
  return {
    _id: user.id,
    name: user.name,
    role: user.role,
    apartment: user.apartment,
    dues: user.dues.map((due) => ({
      id: due.id,
      amount: due.amount,
      dueDate: due.dueDate.value,
      paidAt: due.paidAt,
    })),
  };
}
