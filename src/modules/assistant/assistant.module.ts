import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EnvironmentVariables } from '../../config/env.validation';
import { AreasModule } from '../areas/areas.module';
import { ReservationsModule } from '../reservations/reservations.module';
import { InterpretMessageUseCase } from './application/interpret-message.use-case';
import { INTENT_EXTRACTOR, IntentExtractor } from './domain/intent-extractor';
import { AnthropicIntentExtractor } from './infrastructure/anthropic-intent-extractor';
import { GeminiIntentExtractor } from './infrastructure/gemini-intent-extractor';
import { AssistantController } from './presentation/assistant.controller';

@Module({
  imports: [AreasModule, ReservationsModule],
  controllers: [AssistantController],
  providers: [
    GeminiIntentExtractor,
    AnthropicIntentExtractor,
    {
      // AI_PROVIDER picks the adapter; the rest of the app only sees the port.
      provide: INTENT_EXTRACTOR,
      inject: [ConfigService, GeminiIntentExtractor, AnthropicIntentExtractor],
      useFactory: (
        config: ConfigService<EnvironmentVariables, true>,
        gemini: GeminiIntentExtractor,
        anthropic: AnthropicIntentExtractor,
      ): IntentExtractor =>
        config.get('AI_PROVIDER', { infer: true }) === 'anthropic'
          ? anthropic
          : gemini,
    },
    InterpretMessageUseCase,
  ],
})
export class AssistantModule {}
