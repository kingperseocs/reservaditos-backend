import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import {
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { ApiErrorResponses } from '../../../shared/infrastructure/http/api-error-responses.decorator';
import { User, UserRole } from '../../users/domain/user';
import {
  Auth,
  CurrentUser,
} from '../../users/presentation/auth/auth.decorators';
import { RequestReservationUseCase } from '../application/request-reservation.use-case';
import { ReservationDetailsAssembler } from '../application/reservation-details.assembler';
import {
  GetResidentReservationUseCase,
  ListResidentReservationsUseCase,
} from '../application/resident-reservations.use-cases';
import { CreateReservationDto } from './dto/reservation.request.dto';
import { ReservationDto } from './dto/reservation.response.dto';
import { ReservationPresenter } from './reservation.presenter';

@ApiTags('Reservations')
@Auth(UserRole.RESIDENT)
@Controller('reservations')
export class ReservationsController {
  constructor(
    private readonly requestReservation: RequestReservationUseCase,
    private readonly listMine: ListResidentReservationsUseCase,
    private readonly getMine: GetResidentReservationUseCase,
    private readonly assembler: ReservationDetailsAssembler,
    private readonly presenter: ReservationPresenter,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Request an area for a date and slot' })
  @ApiCreatedResponse({ type: ReservationDto })
  @ApiErrorResponses(400, 404, 409)
  async create(
    @CurrentUser() resident: User,
    @Body() body: CreateReservationDto,
  ): Promise<ReservationDto> {
    const reservation = await this.requestReservation.execute({
      resident,
      ...body,
    });
    return this.presenter.reservation(
      await this.assembler.assembleOne(reservation),
    );
  }

  @Get('me')
  @ApiOperation({ summary: 'My reservations, newest first' })
  @ApiOkResponse({ type: [ReservationDto] })
  async mine(@CurrentUser() resident: User): Promise<ReservationDto[]> {
    const details = await this.listMine.execute(resident);
    return details.map((d) => this.presenter.reservation(d));
  }

  @Get(':id')
  @ApiOperation({
    summary: 'One of my reservations with status and payment link',
  })
  @ApiOkResponse({ type: ReservationDto })
  @ApiErrorResponses(404)
  async findOne(
    @CurrentUser() resident: User,
    @Param('id') id: string,
  ): Promise<ReservationDto> {
    return this.presenter.reservation(await this.getMine.execute(resident, id));
  }
}
