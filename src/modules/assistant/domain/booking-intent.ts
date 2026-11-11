import { DateTime } from 'luxon';
import { Area } from '../../areas/domain/area';
import { LocalDate } from '../../../shared/domain/local-date';
import { TimeSlot } from '../../../shared/domain/time-slot';
import { ExtractedIntent } from './intent-extractor';

export type MissingField = 'area' | 'date' | 'slot';

export interface BookingIntent {
  area: Area | null;
  date: LocalDate | null;
  slot: TimeSlot | null;
}

export interface IntentResolution {
  intent: BookingIntent;
  /** First problem to solve; null when area, date and slot are valid. */
  missing: MissingField | null;
  question: string | null;
}

const slotList = (area: Area) => area.slots.map((s) => s.label).join(', ');

/** "la Parrilla", "el Salón de usos múltiples" (Spanish article from the first word). */
export const withArticle = (area: Area): string =>
  `${/a$/i.test(area.name.split(' ')[0]) ? 'la' : 'el'} ${area.name}`;

export const capitalize = (text: string): string =>
  text.charAt(0).toUpperCase() + text.slice(1);

export const formatDate = (date: LocalDate): string =>
  DateTime.fromISO(date.value, { locale: 'es' }).toFormat('cccc dd/MM');

/**
 * Turns what the AI extracted into a valid booking intent, or into the
 * question the assistant asks next. The model only reads; the rules live here.
 */
export class BookingIntentResolver {
  static resolve(
    extracted: ExtractedIntent,
    areas: readonly Area[],
    today: LocalDate,
  ): IntentResolution {
    const area = areas.find((a) => a.id === extracted.areaId) ?? null;
    const date = this.parseDate(extracted.date);
    const intent: BookingIntent = { area, date, slot: null };

    if (!area) {
      return this.ask(
        intent,
        'area',
        `¿Qué área quieres reservar? Tenemos ${areas.map((a) => a.name).join(', ')}.`,
      );
    }
    if (!date) {
      return this.ask(
        intent,
        'date',
        `¿Para qué día quieres ${withArticle(area)}?`,
      );
    }
    if (date.isBefore(today)) {
      return this.ask(
        intent,
        'date',
        `El ${formatDate(date)} ya pasó. ¿Para qué otro día quieres ${withArticle(area)}?`,
      );
    }
    if (!extracted.startTime) {
      return this.ask(
        intent,
        'slot',
        `¿En qué horario? ${capitalize(withArticle(area))} tiene ${slotList(area)}.`,
      );
    }

    const slot = this.matchSlot(area, extracted.startTime, extracted.endTime);
    if (!slot) {
      const asked = extracted.endTime
        ? `${extracted.startTime}–${extracted.endTime}`
        : `a las ${extracted.startTime}`;
      return this.ask(
        intent,
        'slot',
        `${capitalize(withArticle(area))} no tiene horario ${asked}. Los horarios son ${slotList(area)}. ¿Cuál prefieres?`,
      );
    }

    return { intent: { ...intent, slot }, missing: null, question: null };
  }

  /** Exact slot, or the slot that starts at the given time when no end was said. */
  private static matchSlot(
    area: Area,
    start: string,
    end: string | null,
  ): TimeSlot | null {
    if (end) return area.findSlot(start, end) ?? null;
    return area.slots.find((s) => s.start === start) ?? null;
  }

  private static parseDate(value: string | null): LocalDate | null {
    if (!value) return null;
    try {
      return LocalDate.of(value);
    } catch {
      return null;
    }
  }

  private static ask(
    intent: BookingIntent,
    missing: MissingField,
    question: string,
  ): IntentResolution {
    return { intent, missing, question };
  }
}
