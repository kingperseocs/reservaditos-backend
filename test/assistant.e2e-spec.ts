import { seedDemoData } from '../src/database/demo-data';
import { aiUnavailable } from '../src/modules/assistant/infrastructure/intent-prompt';
import { InterpretationDto } from '../src/modules/assistant/presentation/assistant.dto';
import { ErrorResponseDto } from '../src/shared/infrastructure/http/error-response.dto';
import { NOW, TZ } from './builders/reservation.builder';
import {
  as,
  closeTestApp,
  createTestApp,
  TestContext,
} from './utils/create-test-app';

const MESSAGE = 'quiero la parrilla el sábado de 7 a 10 pm';

describe('POST /v1/assistant/interpret (e2e, fake AI)', () => {
  let ctx: TestContext;

  const interpret = async (status = 200) =>
    (
      await as(ctx, 'ana-perez')
        .post('/v1/assistant/interpret')
        .send({ message: MESSAGE })
        .expect(status)
    ).body as InterpretationDto;

  beforeAll(async () => {
    ctx = await createTestApp();
  });

  beforeEach(async () => {
    ctx.clock.set(NOW);
    await seedDemoData(ctx.app, NOW, TZ);
  });

  afterAll(async () => {
    await closeTestApp(ctx);
  });

  it('returns a complete intent when area, date and a free slot are known', async () => {
    ctx.ai.willReturn({
      areaId: 'grill',
      date: '2026-11-14',
      startTime: '19:00',
      endTime: '22:00',
    });

    const result = await interpret();

    expect(result).toMatchObject({
      complete: true,
      missing: null,
      question: null,
      intent: {
        areaId: 'grill',
        areaName: 'Parrilla',
        date: '2026-11-14',
        startTime: '19:00',
        endTime: '22:00',
      },
    });
    expect(result.reply).toBe(
      'Listo: Parrilla el sábado 14/11 de 19:00 a 22:00. Total S/ 150. ¿Confirmas la reserva?',
    );
    expect(ctx.ai.lastContext).toMatchObject({
      message: MESSAGE,
      today: '2026-11-11',
    });
  });

  it('returns the question to ask when the date is missing', async () => {
    ctx.ai.willReturn({
      areaId: 'grill',
      date: null,
      startTime: '19:00',
      endTime: '22:00',
    });

    const result = await interpret();

    expect(result).toMatchObject({
      complete: false,
      missing: 'date',
      question: '¿Para qué día quieres la Parrilla?',
    });
  });

  it('offers the free slots when the requested one is taken', async () => {
    ctx.ai.willReturn({
      areaId: 'grill',
      date: '2026-11-14',
      startTime: '15:00',
      endTime: '18:00',
    });

    const result = await interpret();

    expect(result).toMatchObject({ complete: false, missing: 'slot' });
    expect(result.question).toBe(
      'La Parrilla no está disponible el sábado 14/11 de 15:00–18:00. Quedan libres: 12:00–15:00, 19:00–22:00. ¿Te sirve alguno?',
    );
  });

  it('answers 503 when the AI provider fails', async () => {
    ctx.ai.willFail(aiUnavailable());

    const error = (await interpret(503)) as unknown as ErrorResponseDto;

    expect(error.code).toBe('AI_UNAVAILABLE');
  });
});
