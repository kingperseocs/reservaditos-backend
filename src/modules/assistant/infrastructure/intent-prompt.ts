import { DateTime } from 'luxon';
import {
  DomainError,
  DomainErrorType,
} from '../../../shared/domain/domain-error';
import { ExtractedIntent, ExtractionContext } from '../domain/intent-extractor';

/** Same JSON Schema for every provider: Gemini structured output and Claude tool input. */
export const INTENT_JSON_SCHEMA = {
  type: 'object',
  properties: {
    areaId: {
      type: ['string', 'null'],
      description: 'Id of the requested area, or null if not mentioned',
    },
    date: {
      type: ['string', 'null'],
      description: 'Booking date as yyyy-MM-dd, or null if not mentioned',
    },
    startTime: {
      type: ['string', 'null'],
      description: 'Start time as 24 h HH:mm, or null if not mentioned',
    },
    endTime: {
      type: ['string', 'null'],
      description: 'End time as 24 h HH:mm, or null if not mentioned',
    },
  },
  required: ['areaId', 'date', 'startTime', 'endTime'],
  additionalProperties: false,
} as const;

export function buildSystemPrompt(context: ExtractionContext): string {
  const today = DateTime.fromISO(context.today, { locale: 'es' });
  const areas = context.areas
    .map((a) => `- ${a.id}: ${a.name} (slots: ${a.slots.join(', ')})`)
    .join('\n');

  return [
    'You extract booking data from a resident message for a residential building.',
    `Today is ${today.toFormat('cccc')} ${context.today} (time zone ${context.timezone}).`,
    '',
    'Areas (answer with the id):',
    areas,
    '',
    'Rules:',
    '- areaId: the area the resident mentions. Accept synonyms (BBQ/asador → grill, salón/SUM/salón de eventos → multipurpose-room, pileta/alberca → pool). null if none.',
    '- date: yyyy-MM-dd. Resolve relative dates (hoy, mañana, pasado mañana, el sábado, el próximo viernes, el 20) from today. A weekday alone means its next occurrence on or after today. null if not stated.',
    '- startTime / endTime: 24 h HH:mm. "de 7 a 10 pm" → 19:00 and 22:00; "al mediodía" → 12:00. null if not stated.',
    '- Never invent a value the message does not give.',
  ].join('\n');
}

const DATE = /^\d{4}-\d{2}-\d{2}$/;
const TIME = /^([01]\d|2[0-3]):[0-5]\d$/;

/** Validates the model output: anything malformed becomes null instead of leaking through. */
export function parseExtractedIntent(raw: unknown): ExtractedIntent {
  const value = (typeof raw === 'object' && raw !== null ? raw : {}) as Record<
    string,
    unknown
  >;
  const pick = (key: string, pattern?: RegExp): string | null => {
    const v = value[key];
    if (typeof v !== 'string' || !v.trim()) return null;
    const trimmed = v.trim();
    return !pattern || pattern.test(trimmed) ? trimmed : null;
  };
  return {
    areaId: pick('areaId'),
    date: pick('date', DATE),
    startTime: pick('startTime', TIME),
    endTime: pick('endTime', TIME),
  };
}

export const aiNotConfigured = (variable: string): DomainError =>
  new DomainError(
    'AI_NOT_CONFIGURED',
    `El asistente no está configurado: falta ${variable}.`,
    DomainErrorType.UNAVAILABLE,
  );

export const aiUnavailable = (): DomainError =>
  new DomainError(
    'AI_UNAVAILABLE',
    'El asistente no está disponible en este momento. Intenta de nuevo o reserva desde el calendario.',
    DomainErrorType.UNAVAILABLE,
  );
