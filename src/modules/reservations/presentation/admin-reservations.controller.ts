import { Body, Controller, Get, Param, Patch, Query } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ApiErrorResponses } from '../../../shared/infrastructure/http/api-error-responses.decorator';
import { UserRole } from '../../users/domain/user';
import { Auth } from '../../users/presentation/auth/auth.decorators';
import { ApproveReservationUseCase } from '../application/approve-reservation.use-case';
import { ListAdminReservationsUseCase } from '../application/list-admin-reservations.use-case';
import { RejectReservationUseCase } from '../application/reject-reservation.use-case';
import { ReservationDetailsAssembler } from '../application/reservation-details.assembler';
import { Reservation } from '../domain/reservation';
import {
  AdminReservationsQueryDto,
  RejectReservationDto,
} from './dto/reservation.request.dto';
import {
  AdminReservationDto,
  ReservationDto,
} from './dto/reservation.response.dto';
import { ReservationPresenter } from './reservation.presenter';

@ApiTags('Admin · Reservations')
@Auth(UserRole.ADMIN)
@Controller('admin/reservations')
export class AdminReservationsController {
  constructor(
    private readonly listReservations: ListAdminReservationsUseCase,
    private readonly approveReservation: ApproveReservationUseCase,
    private readonly rejectReservation: RejectReservationUseCase,
    private readonly assembler: ReservationDetailsAssembler,
    private readonly presenter: ReservationPresenter,
  ) {}

  @Get()
  @ApiOperation({
    summary: 'Requests by status (default: waiting for approval)',
  })
  @ApiOkResponse({ type: [AdminReservationDto] })
  @ApiErrorResponses(400)
  async list(
    @Query() query: AdminReservationsQueryDto,
  ): Promise<AdminReservationDto[]> {
    const views = await this.listReservations.execute(query);
    return views.map((v) => this.presenter.admin(v));
  }

  @Patch(':id/approve')
  @ApiOperation({
    summary: 'Approve the first request of a free slot; opens the payment link',
  })
  @ApiOkResponse({ type: ReservationDto })
  @ApiErrorResponses(404, 409)
  async approve(@Param('id') id: string): Promise<ReservationDto> {
    return this.present(await this.approveReservation.execute(id));
  }

  @Patch(':id/reject')
  @ApiOperation({ summary: 'Reject a request with a reason' })
  @ApiOkResponse({ type: ReservationDto })
  @ApiErrorResponses(400, 404, 409)
  async reject(
    @Param('id') id: string,
    @Body() { reason }: RejectReservationDto,
  ): Promise<ReservationDto> {
    return this.present(await this.rejectReservation.execute(id, reason));
  }

  private async present(reservation: Reservation): Promise<ReservationDto> {
    return this.presenter.reservation(
      await this.assembler.assembleOne(reservation),
    );
  }
}
