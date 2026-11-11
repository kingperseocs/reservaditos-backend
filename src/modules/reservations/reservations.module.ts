import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AreasModule } from '../areas/areas.module';
import { ApproveReservationUseCase } from './application/approve-reservation.use-case';
import {
  PreviewAreaSuspensionUseCase,
  SuspendAreaUseCase,
  SuspensionImpactCalculator,
} from './application/area-suspension.use-cases';
import {
  AvailabilityReader,
  GetDaySlotsUseCase,
  GetMonthAvailabilityUseCase,
  ListAreasForResidentUseCase,
} from './application/availability.use-cases';
import { BookingContext } from './application/booking-context';
import { ExpireOverdueReservationsUseCase } from './application/expire-overdue-reservations.use-case';
import { ListAdminReservationsUseCase } from './application/list-admin-reservations.use-case';
import { PayReservationUseCase } from './application/pay-reservation.use-case';
import { RejectReservationUseCase } from './application/reject-reservation.use-case';
import { RequestReservationUseCase } from './application/request-reservation.use-case';
import { ReservationDetailsAssembler } from './application/reservation-details.assembler';
import {
  GetPaymentUseCase,
  GetResidentReservationUseCase,
  ListResidentReservationsUseCase,
} from './application/resident-reservations.use-cases';
import { RESERVATION_REPOSITORY } from './domain/reservation.repository';
import { MongoReservationRepository } from './infrastructure/mongo-reservation.repository';
import { ReservationExpiryScheduler } from './infrastructure/reservation-expiry.scheduler';
import {
  ReservationRecord,
  ReservationSchema,
} from './infrastructure/reservation.schema';
import { AdminReservationsController } from './presentation/admin-reservations.controller';
import { AdminSuspensionsController } from './presentation/admin-suspensions.controller';
import { AreasController } from './presentation/areas.controller';
import { PaymentsController } from './presentation/payments.controller';
import { ReservationPresenter } from './presentation/reservation.presenter';
import { ReservationsController } from './presentation/reservations.controller';

@Module({
  imports: [
    AreasModule,
    MongooseModule.forFeature([
      { name: ReservationRecord.name, schema: ReservationSchema },
    ]),
  ],
  controllers: [
    AreasController,
    ReservationsController,
    PaymentsController,
    AdminReservationsController,
    AdminSuspensionsController,
  ],
  providers: [
    { provide: RESERVATION_REPOSITORY, useClass: MongoReservationRepository },
    BookingContext,
    ReservationDetailsAssembler,
    ReservationPresenter,
    ExpireOverdueReservationsUseCase,
    RequestReservationUseCase,
    ApproveReservationUseCase,
    RejectReservationUseCase,
    PayReservationUseCase,
    GetPaymentUseCase,
    GetResidentReservationUseCase,
    ListResidentReservationsUseCase,
    ListAdminReservationsUseCase,
    AvailabilityReader,
    ListAreasForResidentUseCase,
    GetMonthAvailabilityUseCase,
    GetDaySlotsUseCase,
    SuspensionImpactCalculator,
    PreviewAreaSuspensionUseCase,
    SuspendAreaUseCase,
    ReservationExpiryScheduler,
  ],
  exports: [RESERVATION_REPOSITORY],
})
export class ReservationsModule {}
