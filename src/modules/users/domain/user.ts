import {
  DomainError,
  DomainErrorType,
} from '../../../shared/domain/domain-error';
import { LocalDate } from '../../../shared/domain/local-date';
import { Due, DuesStandingPolicy, Standing } from './dues-standing.policy';

export enum UserRole {
  RESIDENT = 'RESIDENT',
  ADMIN = 'ADMIN',
}

export interface UserProps {
  id: string;
  name: string;
  role: UserRole;
  /** Apartment number; null for administration users. */
  apartment: string | null;
  dues: Due[];
}

export class User {
  private constructor(private readonly props: UserProps) {}

  static restore(props: UserProps): User {
    return new User({ ...props, dues: [...props.dues] });
  }

  get id(): string {
    return this.props.id;
  }
  get name(): string {
    return this.props.name;
  }
  get role(): UserRole {
    return this.props.role;
  }
  get apartment(): string | null {
    return this.props.apartment;
  }
  get dues(): readonly Due[] {
    return this.props.dues;
  }

  standing(today: LocalDate): Standing {
    return DuesStandingPolicy.evaluate(this.props.dues, today);
  }

  /** Rule 5 guard used before creating a reservation. */
  assertCanBook(today: LocalDate): void {
    const standing = this.standing(today);
    if (!standing.upToDate) {
      throw new DomainError(
        'RESIDENT_NOT_UP_TO_DATE',
        `Tienes una cuota pendiente de S/ ${standing.overdueAmount}. Ponte al día para reservar.`,
        DomainErrorType.FORBIDDEN,
        {
          overdueAmount: standing.overdueAmount,
          oldestOverdueDate: standing.oldestOverdueDate?.value ?? null,
        },
      );
    }
  }
}
