import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { BullModule } from '@nestjs/bull';
import { ScheduleModule } from '@nestjs/schedule';

import { TenantModule } from './modules/tenant/tenant.module';
import { ProductFeedModule } from './modules/product-feed/product-feed.module';
import { SharedModule } from './shared/shared.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    MongooseModule.forRoot(
      process.env.MONGODB_URI ||
        'mongodb://localhost:27017/products-integration',
    ),
    BullModule.forRoot({
      redis: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT as string) || 6379,
      },
    }),
    ScheduleModule.forRoot(),
    SharedModule,
    TenantModule,
    // CatalogIntegrationModule,
    ProductFeedModule,
    // FeedSyncJobModule,
  ],
})
export class AppModule {}
