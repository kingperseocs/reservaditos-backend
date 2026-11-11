import {
  after,
  hours,
  NOW,
} from '../../../../test/builders/reservation.builder';
import { PaymentDeadlinePolicy } from './payment-deadline.policy';

describe('PaymentDeadlinePolicy (rules 2 and 3)', () => {
  it('gives 24 h to pay when the event is far away', () => {
    const eventStart = after(NOW, hours(72));

    expect(PaymentDeadlinePolicy.deadlineFor(NOW, eventStart)).toEqual(
      after(NOW, hours(24)),
    );
  });

  it('limits the deadline to 3 h before the event when it starts in less than 24 h', () => {
    const eventStart = after(NOW, hours(10));

    expect(PaymentDeadlinePolicy.deadlineFor(NOW, eventStart)).toEqual(
      after(NOW, hours(7)),
    );
  });

  it('takes the earliest moment when 24 h would end less than 3 h before the event', () => {
    const eventStart = after(NOW, hours(26));

    expect(PaymentDeadlinePolicy.deadlineFor(NOW, eventStart)).toEqual(
      after(NOW, hours(23)),
    );
  });
});
