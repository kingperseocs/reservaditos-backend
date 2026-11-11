import { Global, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EnvironmentVariables } from '../../config/env.validation';
import {
  BUILDING_SETTINGS,
  BuildingSettings,
  CLOCK,
  RANDOM_GENERATOR,
} from '../domain/ports';
import { CryptoRandomGenerator } from './providers/crypto-random.generator';
import { SystemClock } from './providers/system-clock';

@Global()
@Module({
  providers: [
    { provide: CLOCK, useClass: SystemClock },
    { provide: RANDOM_GENERATOR, useClass: CryptoRandomGenerator },
    {
      provide: BUILDING_SETTINGS,
      inject: [ConfigService],
      useFactory: (
        config: ConfigService<EnvironmentVariables, true>,
      ): BuildingSettings => ({
        name: config.get('BUILDING_NAME', { infer: true }),
        code: config.get('BUILDING_CODE', { infer: true }),
        timezone: config.get('APP_TIMEZONE', { infer: true }),
        publicBaseUrl: config.get('PUBLIC_BASE_URL', { infer: true }),
      }),
    },
  ],
  exports: [CLOCK, RANDOM_GENERATOR, BUILDING_SETTINGS],
})
export class SharedModule {}
