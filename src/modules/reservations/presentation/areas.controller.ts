import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ApiErrorResponses } from '../../../shared/infrastructure/http/api-error-responses.decorator';
import { UserRole } from '../../users/domain/user';
import { Auth } from '../../users/presentation/auth/auth.decorators';
import {
  GetDaySlotsUseCase,
  GetMonthAvailabilityUseCase,
  ListAreasForResidentUseCase,
} from '../application/availability.use-cases';
import { DateQueryDto, MonthQueryDto } from './dto/reservation.request.dto';
import {
  DaySlotsDto,
  MonthAvailabilityDto,
  ResidentAreaDto,
} from './dto/reservation.response.dto';
import { ReservationPresenter } from './reservation.presenter';

@ApiTags('Areas')
@Auth(UserRole.RESIDENT, UserRole.ADMIN)
@Controller('areas')
export class AreasController {
  constructor(
    private readonly listAreas: ListAreasForResidentUseCase,
    private readonly monthAvailability: GetMonthAvailabilityUseCase,
    private readonly daySlots: GetDaySlotsUseCase,
  ) {}

  @Get()
  @ApiOperation({
    summary: 'Building areas with fee, deposit and today availability',
  })
  @ApiOkResponse({ type: [ResidentAreaDto] })
  async list(): Promise<ResidentAreaDto[]> {
    const views = await this.listAreas.execute();
    return views.map(({ area, availableToday }) => ({
      ...ReservationPresenter.area(area),
      fee: area.fee,
      deposit: area.deposit,
      total: area.total,
      availableToday,
    }));
  }

  @Get(':areaId/availability')
  @ApiOperation({ summary: 'Days of a month with at least one free slot' })
  @ApiOkResponse({ type: MonthAvailabilityDto })
  @ApiErrorResponses(400, 404)
  async availability(
    @Param('areaId') areaId: string,
    @Query() { month }: MonthQueryDto,
  ): Promise<MonthAvailabilityDto> {
    const days = await this.monthAvailability.execute(areaId, month);
    return {
      areaId,
      month,
      days: days.map((d) => ({ date: d.date.value, available: d.available })),
    };
  }

  @Get(':areaId/slots')
  @ApiOperation({ summary: 'Slots of a day: FREE, TAKEN or UNAVAILABLE' })
  @ApiOkResponse({ type: DaySlotsDto })
  @ApiErrorResponses(400, 404)
  async slots(
    @Param('areaId') areaId: string,
    @Query() { date }: DateQueryDto,
  ): Promise<DaySlotsDto> {
    const { area, slots } = await this.daySlots.execute(areaId, date);
    return {
      areaId: area.id,
      date,
      slots: slots.map((v) => ({
        ...ReservationPresenter.slot(v.slot),
        status: v.status,
      })),
    };
  }
}
