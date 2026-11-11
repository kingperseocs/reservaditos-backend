import { Global, Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { GetResidentStandingUseCase } from './application/get-resident-standing.use-case';
import { USER_REPOSITORY } from './domain/user.repository';
import { MongoUserRepository } from './infrastructure/mongo-user.repository';
import { UserRecord, UserSchema } from './infrastructure/user.schema';
import { UserAuthGuard } from './presentation/auth/user-auth.guard';
import { ResidentsController } from './presentation/residents.controller';

/** Global so every module can use the x-user-id guard. */
@Global()
@Module({
  imports: [
    MongooseModule.forFeature([{ name: UserRecord.name, schema: UserSchema }]),
  ],
  controllers: [ResidentsController],
  providers: [
    { provide: USER_REPOSITORY, useClass: MongoUserRepository },
    GetResidentStandingUseCase,
    UserAuthGuard,
  ],
  exports: [USER_REPOSITORY, UserAuthGuard],
})
export class UsersModule {}
