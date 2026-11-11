import { Area, AreaProps } from '../../src/modules/areas/domain/area';
import { TimeSlot } from '../../src/shared/domain/time-slot';

export const DEFAULT_SLOTS = [
  TimeSlot.of('12:00', '15:00'),
  TimeSlot.of('15:00', '18:00'),
  TimeSlot.of('19:00', '22:00'),
];

export function anArea(overrides: Partial<AreaProps> = {}): Area {
  return Area.restore({
    id: 'grill',
    name: 'Parrilla',
    icon: 'flame',
    fee: 50,
    deposit: 100,
    slots: DEFAULT_SLOTS,
    openWeekdays: [1, 2, 3, 4, 5, 6, 7],
    suspensions: [],
    ...overrides,
  });
}
