import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ExpireOverdueReservationsUseCase } from '../application/expire-overdue-reservations.use-case';

/** Releases unpaid slots even when nobody reads them (rule 2). */
@Injectable()
export class ReservationExpiryScheduler {
  private readonly logger = new Logger(ReservationExpiryScheduler.name);

  constructor(
    private readonly expireOverdue: ExpireOverdueReservationsUseCase,
  ) {}

  @Cron(CronExpression.EVERY_MINUTE)
  async run(): Promise<void> {
    const expired = await this.expireOverdue.execute();
    if (expired > 0)
      this.logger.log(`Expired ${expired} unpaid reservation(s)`);
  }
}
