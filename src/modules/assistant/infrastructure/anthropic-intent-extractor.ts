import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Anthropic from '@anthropic-ai/sdk';
import { EnvironmentVariables } from '../../../config/env.validation';
import {
  ExtractedIntent,
  ExtractionContext,
  IntentExtractor,
} from '../domain/intent-extractor';
import {
  aiNotConfigured,
  aiUnavailable,
  buildSystemPrompt,
  INTENT_JSON_SCHEMA,
  parseExtractedIntent,
} from './intent-prompt';

const TOOL_NAME = 'save_booking_intent';

/** Anthropic Claude, forced to answer through a tool whose input is the intent schema. */
@Injectable()
export class AnthropicIntentExtractor implements IntentExtractor {
  private readonly logger = new Logger(AnthropicIntentExtractor.name);
  private client?: Anthropic;

  constructor(
    private readonly config: ConfigService<EnvironmentVariables, true>,
  ) {}

  async extract(context: ExtractionContext): Promise<ExtractedIntent> {
    const apiKey = this.config.get('ANTHROPIC_API_KEY', { infer: true });
    if (!apiKey) throw aiNotConfigured('ANTHROPIC_API_KEY');
    this.client ??= new Anthropic({ apiKey });

    try {
      const response = await this.client.messages.create({
        model: this.config.get('ANTHROPIC_MODEL', { infer: true }),
        max_tokens: 300,
        system: buildSystemPrompt(context),
        messages: [{ role: 'user', content: context.message }],
        tools: [
          {
            name: TOOL_NAME,
            description: 'Stores the booking data found in the message.',
            input_schema:
              INTENT_JSON_SCHEMA as unknown as Anthropic.Tool.InputSchema,
          },
        ],
        tool_choice: { type: 'tool', name: TOOL_NAME },
      });
      const toolUse = response.content.find(
        (block) => block.type === 'tool_use',
      );
      return parseExtractedIntent(toolUse?.input);
    } catch (error) {
      this.logger.warn(`Anthropic request failed: ${(error as Error).message}`);
      throw aiUnavailable();
    }
  }
}
