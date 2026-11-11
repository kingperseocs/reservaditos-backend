import { seedDemoData } from '../src/database/demo-data';
import {
  AdminReservationDto,
  DaySlotsDto,
  PaymentDto,
  ReservationDto,
  ResidentAreaDto,
  SuspensionImpactDto,
} from '../src/modules/reservations/presentation/dto/reservation.response.dto';
import { StandingDto } from '../src/modules/users/presentation/resident.dto';
import { ErrorResponseDto } from '../src/shared/infrastructure/http/error-response.dto';
import { NOW, TZ } from './builders/reservation.builder';
import {
  as,
  closeTestApp,
  createTestApp,
  TestContext,
} from './utils/create-test-app';

const ANA = 'ana-perez';
const ROSA = 'rosa-medina';
const ADMIN = 'admin';
/** NOW is Wednesday 11/11/2026 09:00 Lima, so the seeded "next Saturday" is 14/11. */
const SATURDAY = '2026-11-14';

describe('Reservations (e2e)', () => {
  let ctx: TestContext;

  const requestGrill = async (
    date = SATURDAY,
    startTime = '12:00',
    endTime = '15:00',
  ) => {
    const res = await as(ctx, ANA)
      .post('/v1/reservations')
      .send({ areaId: 'grill', date, startTime, endTime })
      .expect(201);
    return res.body as ReservationDto;
  };
  const approve = async (id: string) =>
    (
      await as(ctx, ADMIN)
        .patch(`/v1/admin/reservations/${id}/approve`)
        .expect(200)
    ).body as ReservationDto;
  const tokenOf = (reservation: ReservationDto) =>
    reservation.paymentUrl!.split('/').pop()!;
  const slotsOn = async (date: string) =>
    (
      (await as(ctx, ANA).get(`/v1/areas/grill/slots?date=${date}`).expect(200))
        .body as DaySlotsDto
    ).slots.map((s) => `${s.label} ${s.status}`);
  const pending = async (status = 'PENDING_APPROVAL') =>
    (
      await as(ctx, ADMIN)
        .get(`/v1/admin/reservations?status=${status}`)
        .expect(200)
    ).body as AdminReservationDto[];

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

  it('resident requests, administration approves and resident pays', async () => {
    const areas = (await as(ctx, ANA).get('/v1/areas').expect(200))
      .body as ResidentAreaDto[];
    expect(areas.map((a) => `${a.name} ${a.availableToday}`)).toEqual([
      'Parrilla true',
      'Salón de usos múltiples true',
      'Piscina false',
    ]);
    expect(await slotsOn(SATURDAY)).toEqual([
      '12:00–15:00 FREE',
      '15:00–18:00 TAKEN',
      '19:00–22:00 FREE',
    ]);

    const requested = await requestGrill();
    expect(requested).toMatchObject({
      status: 'PENDING_APPROVAL',
      total: 150,
      paymentUrl: null,
    });
    expect((await pending()).map((r) => r.id)).toContain(requested.id);

    const approved = await approve(requested.id);
    expect(approved.status).toBe('APPROVED');
    expect(approved.paymentDeadline).toBe('2026-11-12T14:00:00.000Z');
    expect(approved.paymentUrl).toMatch(
      /^http:\/\/localhost:8000\/v1\/payments\//,
    );

    const link = (
      await as(ctx)
        .get(`/v1/payments/${tokenOf(approved)}`)
        .expect(200)
    ).body as PaymentDto;
    expect(link).toMatchObject({ amount: 150, areaName: 'Parrilla' });

    ctx.clock.advanceHours(9);
    const paid = (
      await as(ctx)
        .post(`/v1/payments/${tokenOf(approved)}`)
        .expect(200)
    ).body as PaymentDto;
    expect(paid.status).toBe('CONFIRMED');
    expect(paid.code).toMatch(/^DEMO-\d{4}$/);

    const mine = (
      await as(ctx, ANA).get(`/v1/reservations/${requested.id}`).expect(200)
    ).body as ReservationDto;
    expect(mine).toMatchObject({
      status: 'CONFIRMED',
      code: paid.code,
      paymentUrl: null,
    });
    expect(await slotsOn(SATURDAY)).toContain('12:00–15:00 TAKEN');
  });

  it('rule 2: an unpaid booking expires after 24 h and frees the slot', async () => {
    const approved = await approve((await requestGrill()).id);
    ctx.clock.advanceHours(24);

    const error = (
      await as(ctx)
        .post(`/v1/payments/${tokenOf(approved)}`)
        .expect(409)
    ).body as ErrorResponseDto;
    expect(error.code).toBe('PAYMENT_DEADLINE_PASSED');

    const mine = (
      await as(ctx, ANA).get(`/v1/reservations/${approved.id}`).expect(200)
    ).body as ReservationDto;
    expect(mine.status).toBe('EXPIRED');
    expect(await slotsOn(SATURDAY)).toContain('12:00–15:00 FREE');
  });

  it('rule 3: an event in less than 24 h must be paid 3 h before it starts', async () => {
    const tonight = await requestGrill('2026-11-11', '19:00', '22:00');

    const approved = await approve(tonight.id);

    expect(approved.paymentDeadline).toBe('2026-11-11T21:00:00.000Z'); // 16:00 Lima
  });

  it('rule 4: the first request wins the slot', async () => {
    const queue = await pending();
    const jorge = queue.find((r) => r.resident.name === 'Jorge Díaz')!;
    const pedro = queue.find((r) => r.resident.name === 'Pedro Gómez')!;
    expect(jorge.firstInLine).toBe(true);
    expect(pedro.firstInLine).toBe(false);

    const blocked = (
      await as(ctx, ADMIN)
        .patch(`/v1/admin/reservations/${pedro.id}/approve`)
        .expect(409)
    ).body as ErrorResponseDto;
    expect(blocked.code).toBe('NOT_FIRST_IN_LINE');

    await as(ctx)
      .post(`/v1/payments/${tokenOf(await approve(jorge.id))}`)
      .expect(200);

    const rejected = await pending('REJECTED');
    expect(rejected.map((r) => r.id)).toContain(pedro.id);
  });

  it('rule 4: a slot already taken cannot be requested', async () => {
    const res = await as(ctx, ANA)
      .post('/v1/reservations')
      .send({
        areaId: 'grill',
        date: SATURDAY,
        startTime: '15:00',
        endTime: '18:00',
      })
      .expect(409);

    expect((res.body as ErrorResponseDto).code).toBe('SLOT_TAKEN');
  });

  it('rule 5: a resident who is not up to date cannot book', async () => {
    const standing = (
      await as(ctx, ROSA).get('/v1/residents/me/standing').expect(200)
    ).body as StandingDto;
    expect(standing).toEqual({
      upToDate: false,
      overdueAmount: 350,
      oldestOverdueDate: '2026-11-05',
      graceDays: 1,
    });

    const res = await as(ctx, ROSA)
      .post('/v1/reservations')
      .send({
        areaId: 'grill',
        date: SATURDAY,
        startTime: '12:00',
        endTime: '15:00',
      })
      .expect(403);
    expect(res.body).toMatchObject({
      code: 'RESIDENT_NOT_UP_TO_DATE',
      details: { overdueAmount: 350, oldestOverdueDate: '2026-11-05' },
    });
  });

  it('rule 6: suspending an area refunds every paid booking', async () => {
    const approved = await approve((await requestGrill()).id);
    await as(ctx)
      .post(`/v1/payments/${tokenOf(approved)}`)
      .expect(200);
    const range = { from: SATURDAY, to: SATURDAY };

    const preview = (
      await as(ctx, ADMIN)
        .get(
          `/v1/admin/areas/grill/suspensions/preview?from=${SATURDAY}&to=${SATURDAY}`,
        )
        .expect(200)
    ).body as SuspensionImpactDto;
    expect(preview).toEqual({
      paidCount: 2,
      refundAmount: 300,
      unpaidCount: 0,
    });

    await as(ctx, ADMIN)
      .post('/v1/admin/areas/grill/suspensions')
      .send({ ...range, reason: 'Mantenimiento programado' })
      .expect(201);

    const mine = (
      await as(ctx, ANA).get(`/v1/reservations/${approved.id}`).expect(200)
    ).body as ReservationDto;
    expect(mine).toMatchObject({ status: 'REFUNDED', refundAmount: 150 });
    expect(await slotsOn(SATURDAY)).toEqual([
      '12:00–15:00 UNAVAILABLE',
      '15:00–18:00 UNAVAILABLE',
      '19:00–22:00 UNAVAILABLE',
    ]);
  });

  it('requires the x-user-id header and the right role', async () => {
    await as(ctx).get('/v1/areas').expect(401);
    await as(ctx, ANA).get('/v1/admin/reservations').expect(403);
  });

  it('validates the request body', async () => {
    const res = await as(ctx, ANA)
      .post('/v1/reservations')
      .send({ areaId: 'grill', date: '14/11/2026', startTime: '7pm' })
      .expect(400);

    expect((res.body as ErrorResponseDto).code).toBe('VALIDATION_ERROR');
  });
});
