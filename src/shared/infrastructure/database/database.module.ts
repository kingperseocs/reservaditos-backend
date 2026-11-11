import { Logger, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { Connection } from 'mongoose';
import { EnvironmentVariables } from '../../../config/env.validation';

@Module({
  imports: [
    MongooseModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService<EnvironmentVariables, true>) => ({
        uri: config.get('MONGODB_URI', { infer: true }),
        serverSelectionTimeoutMS: 5000,
        onConnectionCreate: (connection: Connection) => {
          const logger = new Logger('MongoDB');
          connection.on('connected', () => logger.log('Connected'));
          connection.on('disconnected', () => logger.log('Disconnected'));
          return connection;
        },
      }),
    }),
  ],
})
export class DatabaseModule {}
