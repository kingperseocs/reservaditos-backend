import {
  after,
  aReservation,
  hours,
  NOW,
} from '../../../../test/builders/reservation.builder';
import { SlotAllocationPolicy } from './slot-allocation.policy';

describe('SlotAllocationPolicy (rule 4: first one wins)', () => {
  const ana = () => aReservation({ id: 'ana', residentId: 'ana', now: NOW });
  const pedro = () =>
    aReservation({
      id: 'pedro',
      residentId: 'pedro',
      now: after(NOW, hours(1)),
    });

  it('picks the earliest pending request', () => {
    expect(SlotAllocationPolicy.firstInLine([pedro(), ana()])?.id).toBe('ana');
  });

  it('allows approving the first request', () => {
    const first = ana();

    expect(() =>
      SlotAllocationPolicy.assertCanApprove(first, [first, pedro()]),
    ).not.toThrow();
  });

  it('blocks approving a later request while the first one is pending', () => {
    const second = pedro();

    expect(() =>
      SlotAllocationPolicy.assertCanApprove(second, [ana(), second]),
    ).toThrow(expect.objectContaining({ code: 'NOT_FIRST_IN_LINE' }) as Error);
  });

  it('blocks approving when the slot is already held', () => {
    const holder = ana();
    holder.approve(NOW, 't');
    const second = pedro();

    expect(() =>
      SlotAllocationPolicy.assertCanApprove(second, [holder, second]),
    ).toThrow(expect.objectContaining({ code: 'SLOT_TAKEN' }) as Error);
  });

  it('lets the next request in line be approved once the first one is rejected', () => {
    const first = ana();
    first.reject('Sin cupo', NOW);
    const second = pedro();

    expect(() =>
      SlotAllocationPolicy.assertCanApprove(second, [first, second]),
    ).not.toThrow();
  });

  it('lists the pending requests that lose the slot', () => {
    const winner = ana();
    const loser = pedro();

    expect(SlotAllocationPolicy.losers(winner, [winner, loser])).toEqual([
      loser,
    ]);
  });
});
