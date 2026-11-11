import { INestApplicationContext } from '@nestjs/common';
import { LocalDate } from '../shared/domain/local-date';
import { TimeSlot } from '../shared/domain/time-slot';
import { Area } from '../modules/areas/domain/area';
import {
  AREA_REPOSITORY,
  AreaRepository,
} from '../modules/areas/domain/area.repository';
import { Reservation } from '../modules/reservations/domain/reservation';
import {
  RESERVATION_REPOSITORY,
  ReservationRepository,
} from '../modules/reservations/domain/reservation.repository';
import { User, UserRole } from '../modules/users/domain/user';
import {
  USER_REPOSITORY,
  UserRepository,
} from '../modules/users/domain/user.repository';

const SATURDAY = 6;
const MINUTE = 60 * 1000;
const HOUR = 60 * MINUTE;

const SLOTS = [
  TimeSlot.of('12:00', '15:00'),
  TimeSlot.of('15:00', '18:00'),
  TimeSlot.of('19:00', '22:00'),
];

export const DEMO_USERS = {
  ana: 'ana-perez',
  rosa: 'rosa-medina',
  admin: 'admin',
} as const;

/**
 * Resets the database with the "Edificio Demo" data. Dates are relative to
 * `now`, so the demo always shows the next Saturday and pending requests.
 */
export async function seedDemoData(
  app: INestApplicationContext,
  now: Date,
  timezone: string,
): Promise<void> {
  const users = app.get<UserRepository>(USER_REPOSITORY);
  const areas = app.get<AreaRepository>(AREA_REPOSITORY);
  const reservations = app.get<ReservationRepository>(RESERVATION_REPOSITORY);

  await Promise.all([
    users.deleteAll(),
    areas.deleteAll(),
    reservations.deleteAll(),
  ]);

  const today = LocalDate.fromInstant(now, timezone);
  const nextSaturday = nextWeekday(today, SATURDAY);
  const ago = (ms: number) => new Date(now.getTime() - ms);

  for (const user of buildUsers(today, now)) await users.save(user);
  for (const area of buildAreas()) await areas.save(area);

  const request = (
    id: string,
    residentId: string,
    areaId: string,
    date: LocalDate,
    slot: TimeSlot,
    requestedAt: Date,
  ) =>
    Reservation.request({
      id,
      residentId,
      areaId,
      date,
      slot,
      eventStart: date.atTime(slot.start, timezone),
      fee: 50,
      deposit: 100,
      now: requestedAt,
    });

  // Paid booking: makes 15:00–18:00 of next Saturday "Ocupado" in the app.
  const elena = request(
    'seed-elena',
    'elena-castro',
    'grill',
    nextSaturday,
    SLOTS[1],
    ago(48 * HOUR),
  );
  elena.approve(ago(47 * HOUR), 'seed-token-elena');
  elena.pay(ago(46 * HOUR), 'DEMO-1043');

  const pending = [
    request(
      'seed-maria',
      'maria-torres',
      'pool',
      nextSaturday.plusDays(1),
      SLOTS[0],
      ago(24 * HOUR),
    ),
    request(
      'seed-carlos',
      'carlos-ruiz',
      'multipurpose-room',
      nextSaturday.plusDays(-1),
      SLOTS[2],
      ago(5 * HOUR),
    ),
    // Same slot twice: Jorge asked first, so only Jorge can be approved (rule 4).
    request(
      'seed-jorge',
      'jorge-diaz',
      'grill',
      nextSaturday.plusDays(7),
      SLOTS[1],
      ago(3 * HOUR),
    ),
    request(
      'seed-pedro',
      'pedro-gomez',
      'grill',
      nextSaturday.plusDays(7),
      SLOTS[1],
      ago(40 * MINUTE),
    ),
    request(
      'seed-lucia',
      'lucia-vargas',
      'multipurpose-room',
      nextSaturday,
      SLOTS[1],
      ago(20 * MINUTE),
    ),
  ];

  for (const reservation of [elena, ...pending])
    await reservations.save(reservation);
}

function buildUsers(today: LocalDate, now: Date): User[] {
  const resident = (id: string, name: string, apartment: string) =>
    User.restore({ id, name, role: UserRole.RESIDENT, apartment, dues: [] });

  return [
    User.restore({
      id: DEMO_USERS.ana,
      name: 'Ana Pérez',
      role: UserRole.RESIDENT,
      apartment: '502',
      dues: [
        {
          id: 'ana-1',
          amount: 350,
          dueDate: today.plusDays(-6),
          paidAt: new Date(now.getTime() - 10 * 24 * HOUR),
        },
        { id: 'ana-2', amount: 350, dueDate: today.plusDays(24), paidAt: null },
      ],
    }),
    // Overdue for more than the grace day: sees "Aún no puedes reservar".
    User.restore({
      id: DEMO_USERS.rosa,
      name: 'Rosa Medina',
      role: UserRole.RESIDENT,
      apartment: '403',
      dues: [
        {
          id: 'rosa-1',
          amount: 350,
          dueDate: today.plusDays(-6),
          paidAt: null,
        },
      ],
    }),
    resident('maria-torres', 'María Torres', '801'),
    resident('carlos-ruiz', 'Carlos Ruiz', '204'),
    resident('jorge-diaz', 'Jorge Díaz', '105'),
    resident('pedro-gomez', 'Pedro Gómez', '301'),
    resident('lucia-vargas', 'Lucía Vargas', '607'),
    resident('elena-castro', 'Elena Castro', '702'),
    User.restore({
      id: DEMO_USERS.admin,
      name: 'Administración',
      role: UserRole.ADMIN,
      apartment: null,
      dues: [],
    }),
  ];
}

function buildAreas(): Area[] {
  const area = (
    id: string,
    name: string,
    icon: string,
    openWeekdays: number[],
  ) =>
    Area.restore({
      id,
      name,
      icon,
      fee: 50,
      deposit: 100,
      slots: SLOTS,
      openWeekdays,
      suspensions: [],
    });

  return [
    area('grill', 'Parrilla', 'flame', [1, 2, 3, 4, 5, 6, 7]),
    area(
      'multipurpose-room',
      'Salón de usos múltiples',
      'users',
      [1, 2, 3, 4, 5, 6, 7],
    ),
    area('pool', 'Piscina', 'waves', [5, 6, 7]),
  ];
}

/** First given weekday strictly after `from`. */
function nextWeekday(from: LocalDate, weekday: number): LocalDate {
  const days = (weekday - from.dayOfWeek + 7) % 7 || 7;
  return from.plusDays(days);
}
