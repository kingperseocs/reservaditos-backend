import { DateRange } from '../../../shared/domain/date-range';
import { DomainError } from '../../../shared/domain/domain-error';
import { LocalDate } from '../../../shared/domain/local-date';
import { TimeSlot } from '../../../shared/domain/time-slot';

export interface Suspension {
  id: string;
  range: DateRange;
  reason: string;
  createdAt: Date;
}

export interface AreaProps {
  id: string;
  name: string;
  /** Icon key for the clients (flame, users, waves). */
  icon: string;
  fee: number;
  deposit: number;
  slots: TimeSlot[];
  /** ISO weekdays the area opens: 1 = Monday … 7 = Sunday. */
  openWeekdays: number[];
  suspensions: Suspension[];
}

export class Area {
  private constructor(private readonly props: AreaProps) {}

  static restore(props: AreaProps): Area {
    if (props.fee < 0 || props.deposit < 0) {
      throw new DomainError(
        'INVALID_AREA',
        'Tarifa y garantía no pueden ser negativas.',
      );
    }
    if (props.slots.length === 0) {
      throw new DomainError(
        'INVALID_AREA',
        'El área necesita al menos un horario.',
      );
    }
    return new Area({ ...props, suspensions: [...props.suspensions] });
  }

  get id(): string {
    return this.props.id;
  }
  get name(): string {
    return this.props.name;
  }
  get icon(): string {
    return this.props.icon;
  }
  get fee(): number {
    return this.props.fee;
  }
  get deposit(): number {
    return this.props.deposit;
  }
  get total(): number {
    return this.props.fee + this.props.deposit;
  }
  get slots(): readonly TimeSlot[] {
    return this.props.slots;
  }
  get openWeekdays(): readonly number[] {
    return this.props.openWeekdays;
  }
  get suspensions(): readonly Suspension[] {
    return this.props.suspensions;
  }

  findSlot(start: string, end: string): TimeSlot | undefined {
    return this.props.slots.find(
      (slot) => slot.start === start && slot.end === end,
    );
  }

  opensOn(date: LocalDate): boolean {
    return this.props.openWeekdays.includes(date.dayOfWeek);
  }

  suspensionOn(date: LocalDate): Suspension | undefined {
    return this.props.suspensions.find((s) => s.range.includes(date));
  }

  isBookableOn(date: LocalDate): boolean {
    return this.opensOn(date) && !this.suspensionOn(date);
  }

  /** Rule 6 (area side): records the suspension; bookings are handled by the caller. */
  suspend(id: string, range: DateRange, reason: string, now: Date): Suspension {
    const trimmed = reason.trim();
    if (!trimmed) {
      throw new DomainError(
        'SUSPENSION_REASON_REQUIRED',
        'Indica el motivo de la suspensión.',
      );
    }
    const suspension: Suspension = {
      id,
      range,
      reason: trimmed,
      createdAt: now,
    };
    this.props.suspensions.push(suspension);
    return suspension;
  }
}
