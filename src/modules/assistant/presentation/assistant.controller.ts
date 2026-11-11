import { Body, Controller, HttpCode, Post } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ApiErrorResponses } from '../../../shared/infrastructure/http/api-error-responses.decorator';
import { UserRole } from '../../users/domain/user';
import { Auth } from '../../users/presentation/auth/auth.decorators';
import { InterpretMessageUseCase } from '../application/interpret-message.use-case';
import { InterpretationDto, InterpretMessageDto } from './assistant.dto';

@ApiTags('Assistant')
@Auth(UserRole.RESIDENT, UserRole.ADMIN)
@Controller('assistant')
export class AssistantController {
  constructor(private readonly interpretMessage: InterpretMessageUseCase) {}

  @Post('interpret')
  @HttpCode(200)
  @ApiOperation({
    summary:
      'Extract area, date and slot from free text with AI, or the next question to ask',
  })
  @ApiOkResponse({ type: InterpretationDto })
  @ApiErrorResponses(400, 503)
  async interpret(
    @Body() { message }: InterpretMessageDto,
  ): Promise<InterpretationDto> {
    const { complete, intent, missing, reply } =
      await this.interpretMessage.execute(message);
    return {
      complete,
      intent: {
        areaId: intent.area?.id ?? null,
        areaName: intent.area?.name ?? null,
        date: intent.date?.value ?? null,
        startTime: intent.slot?.start ?? null,
        endTime: intent.slot?.end ?? null,
      },
      missing,
      question: complete ? null : reply,
      reply,
    };
  }
}
