import { User } from './user';

export const USER_REPOSITORY = Symbol('USER_REPOSITORY');

export interface UserRepository {
  findById(id: string): Promise<User | null>;
  findByIds(ids: string[]): Promise<User[]>;
  save(user: User): Promise<void>;
  deleteAll(): Promise<void>;
}
