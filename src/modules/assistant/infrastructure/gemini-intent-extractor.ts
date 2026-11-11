import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ApiError, GoogleGenAI } from '@google/genai';
import { setTimeout as sleep } from 'node:timers/promises';
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

const OVERLOADED = [500, 503];
const RETRY_DELAY_MS = 400;

/**
 * Google Gemini with structured JSON output (free tier).
 * The free tier sometimes answers 503 (high demand) or 429 (per-minute quota).
 * 503 is retried once on the same model; any other failure (429, 404, bad
 * output) moves on to the fallback model, which has its own quota.
 */
@Injectable()
export class GeminiIntentExtractor implements IntentExtractor {
  private readonly logger = new Logger(GeminiIntentExtractor.name);
  private client?: GoogleGenAI;

  constructor(
    private readonly config: ConfigService<EnvironmentVariables, true>,
  ) {}

  async extract(context: ExtractionContext): Promise<ExtractedIntent> {
    const apiKey = this.config.get('GEMINI_API_KEY', { infer: true });
    if (!apiKey) throw aiNotConfigured('GEMINI_API_KEY');
    this.client ??= new GoogleGenAI({ apiKey });

    const main = this.config.get('GEMINI_MODEL', { infer: true });
    const fallback = this.config.get('GEMINI_FALLBACK_MODEL', { infer: true });
    const models = [main, ...(fallback && fallback !== main ? [fallback] : [])];

    for (const model of models) {
      for (let attempt = 1; attempt <= 2; attempt++) {
        try {
          return await this.generate(this.client, model, context);
        } catch (error) {
          const status = error instanceof ApiError ? error.status : undefined;
          this.logger.warn(
            `Gemini ${model} failed (${status ?? 'error'}): ${(error as Error).message.slice(0, 120)}`,
          );
          const retrySameModel =
            attempt === 1 &&
            status !== undefined &&
            OVERLOADED.includes(status);
          if (!retrySameModel) break; // 429, 404, bad output… → next model
          await sleep(RETRY_DELAY_MS);
        }
      }
    }
    throw aiUnavailable();
  }

  private async generate(
    client: GoogleGenAI,
    model: string,
    context: ExtractionContext,
  ): Promise<ExtractedIntent> {
    const response = await client.models.generateContent({
      model,
      contents: context.message,
      config: {
        systemInstruction: buildSystemPrompt(context),
        responseMimeType: 'application/json',
        responseJsonSchema: INTENT_JSON_SCHEMA,
        temperature: 0,
      },
    });
    return parseExtractedIntent(JSON.parse(response.text ?? '{}'));
  }
}
