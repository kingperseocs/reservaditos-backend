import { anArea } from '../../../../test/builders/area.builder';
import { LocalDate } from '../../../shared/domain/local-date';
import { BookingIntentResolver } from './booking-intent';
import { ExtractedIntent } from './intent-extractor';

const TODAY = LocalDate.of('2026-11-11');
const AREAS = [
  anArea(),
  anArea({ id: 'pool', name: 'Piscina', icon: 'waves' }),
];
const extracted = (
  overrides: Partial<ExtractedIntent> = {},
): ExtractedIntent => ({
  areaId: 'grill',
  date: '2026-11-14',
  startTime: '19:00',
  endTime: '22:00',
  ...overrides,
});

describe('BookingIntentResolver', () => {
  it('resolves a complete request to an offered slot', () => {
    const result = BookingIntentResolver.resolve(extracted(), AREAS, TODAY);

    expect(result.missing).toBeNull();
    expect(result.question).toBeNull();
    expect(result.intent.area?.name).toBe('Parrilla');
    expect(result.intent.slot?.label).toBe('19:00–22:00');
  });

  it('asks for the area when it is missing or unknown', () => {
    const result = BookingIntentResolver.resolve(
      extracted({ areaId: 'gym' }),
      AREAS,
      TODAY,
    );

    expect(result.missing).toBe('area');
    expect(result.question).toBe(
      '¿Qué área quieres reservar? Tenemos Parrilla, Piscina.',
    );
  });

  it('asks for the date when it is missing', () => {
    const result = BookingIntentResolver.resolve(
      extracted({ date: null }),
      AREAS,
      TODAY,
    );

    expect(result.missing).toBe('date');
    expect(result.question).toBe('¿Para qué día quieres la Parrilla?');
  });

  it('asks for another date when it already passed', () => {
    const result = BookingIntentResolver.resolve(
      extracted({ date: '2026-11-10' }),
      AREAS,
      TODAY,
    );

    expect(result.missing).toBe('date');
    expect(result.question).toContain('ya pasó');
  });

  it('asks for the slot listing the options when the time is missing', () => {
    const result = BookingIntentResolver.resolve(
      extracted({ startTime: null, endTime: null }),
      AREAS,
      TODAY,
    );

    expect(result.missing).toBe('slot');
    expect(result.question).toBe(
      '¿En qué horario? La Parrilla tiene 12:00–15:00, 15:00–18:00, 19:00–22:00.',
    );
  });

  it('completes the slot from its start time alone', () => {
    const result = BookingIntentResolver.resolve(
      extracted({ endTime: null }),
      AREAS,
      TODAY,
    );

    expect(result.intent.slot?.label).toBe('19:00–22:00');
  });

  it('rejects a time range the area does not offer', () => {
    const result = BookingIntentResolver.resolve(
      extracted({ startTime: '18:00', endTime: '20:00' }),
      AREAS,
      TODAY,
    );

    expect(result.missing).toBe('slot');
    expect(result.question).toContain('no tiene horario 18:00–20:00');
  });

  it('uses the right Spanish article for each area', () => {
    const salon = anArea({
      id: 'multipurpose-room',
      name: 'Salón de usos múltiples',
    });

    const result = BookingIntentResolver.resolve(
      extracted({ areaId: salon.id, date: null }),
      [salon],
      TODAY,
    );

    expect(result.question).toBe(
      '¿Para qué día quieres el Salón de usos múltiples?',
    );
  });
});
