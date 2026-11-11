import * as Joi from 'joi';

export const AI_PROVIDERS = ['gemini', 'anthropic'] as const;
export type AiProvider = (typeof AI_PROVIDERS)[number];

export interface EnvironmentVariables {
  NODE_ENV: 'development' | 'test' | 'production';
  PORT: number;
  MONGODB_URI: string;
  PUBLIC_BASE_URL: string;
  APP_TIMEZONE: string;
  BUILDING_NAME: string;
  BUILDING_CODE: string;
  AI_PROVIDER: AiProvider;
  GEMINI_API_KEY?: string;
  GEMINI_MODEL: string;
  GEMINI_FALLBACK_MODEL: string;
  ANTHROPIC_API_KEY?: string;
  ANTHROPIC_MODEL: string;
}

export const envValidationSchema = Joi.object<EnvironmentVariables>({
  NODE_ENV: Joi.string()
    .valid('development', 'test', 'production')
    .default('development'),
  PORT: Joi.number().port().default(8000),
  MONGODB_URI: Joi.string()
    .uri({ scheme: ['mongodb', 'mongodb+srv'] })
    .required(),
  PUBLIC_BASE_URL: Joi.string().uri().default('http://localhost:8000'),
  APP_TIMEZONE: Joi.string().default('America/Lima'),
  BUILDING_NAME: Joi.string().default('Edificio Demo'),
  BUILDING_CODE: Joi.string().uppercase().default('DEMO'),
  AI_PROVIDER: Joi.string()
    .valid(...AI_PROVIDERS)
    .default('gemini'),
  GEMINI_API_KEY: Joi.string().allow('').optional(),
  GEMINI_MODEL: Joi.string().default('gemini-3.5-flash'),
  GEMINI_FALLBACK_MODEL: Joi.string()
    .allow('')
    .default('gemini-3.5-flash-lite'),
  ANTHROPIC_API_KEY: Joi.string().allow('').optional(),
  ANTHROPIC_MODEL: Joi.string().default('claude-haiku-5-5'),
});
