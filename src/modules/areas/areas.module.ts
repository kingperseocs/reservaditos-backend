import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ListAreasForAdminUseCase } from './application/list-areas-for-admin.use-case';
import { AREA_REPOSITORY } from './domain/area.repository';
import { AreaRecord, AreaSchema } from './infrastructure/area.schema';
import { MongoAreaRepository } from './infrastructure/mongo-area.repository';
import { AdminAreasController } from './presentation/admin-areas.controller';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: AreaRecord.name, schema: AreaSchema }]),
  ],
  controllers: [AdminAreasController],
  providers: [
    { provide: AREA_REPOSITORY, useClass: MongoAreaRepository },
    ListAreasForAdminUseCase,
  ],
  exports: [AREA_REPOSITORY],
})
export class AreasModule {}
