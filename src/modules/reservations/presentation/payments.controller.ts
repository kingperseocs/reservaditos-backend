import { Controller, Get, HttpCode, Param, Post } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ApiErrorResponses } from '../../../shared/infrastructure/http/api-error-responses.decorator';
import { PayReservationUseCase } from '../application/pay-reservation.use-case';
import { ReservationDetailsAssembler } from '../application/reservation-details.assembler';
import { GetPaymentUseCase } from '../application/resident-reservations.use-cases';
import { PaymentDto } from './dto/reservation.response.dto';
import { ReservationPresenter } from './reservation.presenter';

/** Simulated payment link. The token in the URL is the credential, like a real checkout link. */
@ApiTags('Payments')
@Controller('payments')
export class PaymentsController {
  constructor(
    private readonly getPayment: GetPaymentUseCase,
    private readonly payReservation: PayReservationUseCase,
    private readonly assembler: ReservationDetailsAssembler,
    private readonly presenter: ReservationPresenter,
  ) {}

  @Get(':token')
  @ApiOperation({ summary: 'Payment link details (amount and deadline)' })
  @ApiOkResponse({ type: PaymentDto })
  @ApiErrorResponses(404)
  async find(@Param('token') token: string): Promise<PaymentDto> {
    return this.presenter.payment(await this.getPayment.execute(token));
  }

  @Post(':token')
  @HttpCode(200)
  @ApiOperation({
    summary: 'Pay fee + deposit (simulated) and confirm the booking',
  })
  @ApiOkResponse({ type: PaymentDto })
  @ApiErrorResponses(404, 409)
  async pay(@Param('token') token: string): Promise<PaymentDto> {
    const reservation = await this.payReservation.execute(token);
    return this.presenter.payment(
      await this.assembler.assembleOne(reservation),
    );
  }
}
