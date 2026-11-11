import { Inject, Injectable } from '@nestjs/common';
import { DateRange } from '../../../shared/domain/date-range';
import {
  AREA_REPOSITORY,
  type AreaRepository,
} from '../../areas/domain/area.repository';
import { AvailabilityReader } from '../../reservations/application/availability.use-cases';
import { BookingContext } from '../../reservations/application/booking-context';
import { SlotStatus } from '../../reservations/domain/slot-availability';
import {
  BookingIntent,
  BookingIntentResolver,
  capitalize,
  formatDate,
  MissingField,
  withArticle,
} from '../domain/booking-intent';
import {
  INTENT_EXTRACTOR,
  type IntentExtractor,
} from '../domain/intent-extractor';

export interface Interpretation {
  /** True when area, date and a free slot are known: the app can book right away. */
  complete: boolean;
  intent: BookingIntent;
  missing: MissingField | null;
  /** What the assistant asks next, or a confirmation when complete. */
  reply: string;
}

/** AI reads the message; the domain decides what is missing and whether the slot is free. */
@Injectable()
export class InterpretMessageUseCase {
  constructor(
    @Inject(INTENT_EXTRACTOR) private readonly extractor: IntentExtractor,
    @Inject(AREA_REPOSITORY) private readonly areas: AreaRepository,
    private readonly context: BookingContext,
    private readonly availability: AvailabilityReader,
  ) {}

  async execute(message: string): Promise<Interpretation> {
    const now = this.context.now();
    const today = this.context.today(now);
    const areas = await this.areas.findAll();

    const extracted = await this.extractor.extract({
      message,
      today: today.value,
      timezone: this.context.timezone,
      areas: areas.map((a) => ({
        id: a.id,
        name: a.name,
        slots: a.slots.map((s) => s.label),
      })),
    });

    const { intent, missing, question } = BookingIntentResolver.resolve(
      extracted,
      areas,
      today,
    );
    if (missing || !intent.area || !intent.date || !intent.slot) {
      return { complete: false, intent, missing, reply: question ?? '' };
    }

    const { area, date, slot } = intent;
    const holders = await this.availability.holders(
      DateRange.of(date, date),
      area.id,
    );
    const slots = this.availability.slotsOf(area, date, holders, now);
    const requested = slots.find((s) => s.slot.equals(slot));
    const day = formatDate(date);

    if (requested?.status === SlotStatus.FREE) {
      return {
        complete: true,
        intent,
        missing: null,
        reply: `Listo: ${area.name} el ${day} de ${slot.start} a ${slot.end}. Total S/ ${area.total}. ¿Confirmas la reserva?`,
      };
    }

    const free = slots.filter((s) => s.status === SlotStatus.FREE);
    return {
      complete: false,
      intent: { ...intent, slot: null },
      missing: 'slot',
      reply: free.length
        ? `${capitalize(withArticle(area))} no está disponible el ${day} de ${slot.label}. Quedan libres: ${free.map((s) => s.slot.label).join(', ')}. ¿Te sirve alguno?`
        : `${capitalize(withArticle(area))} no tiene horarios libres el ${day}. ¿Quieres otro día?`,
    };
  }
}
