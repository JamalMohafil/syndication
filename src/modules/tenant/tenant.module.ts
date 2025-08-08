import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { TenantService } from './application/services/tenant.service';
import {
  TenantDocument,
  TenantSchema,
} from './infrastructure/schemas/tenant.schema';
import { MongoTenantRepository } from './infrastructure/repositories/mongo-tenant.repository';
import { TenantController } from './presentation/rest/controllers/tenant.controller';
import { TenantRepository } from './domain/repositories/tenant.repository';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: TenantDocument.name, schema: TenantSchema },
    ]),
  ],
  controllers: [TenantController],
  providers: [
    TenantService,
    {
      provide: TenantRepository,
      useClass: MongoTenantRepository,
    },
  ],
  exports: [TenantService, TenantRepository],
})
export class TenantModule {}
