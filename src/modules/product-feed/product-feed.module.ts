import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ProductFeedController } from './presentation/controllers/product-feed.controller';
import { FeedUrlController } from './presentation/controllers/feed-url.controller';
import { ProductFeedService } from './application/services/product-feed.service';
import { FeedBuilderService } from './application/services/feed-builder.service';
import { ProductFeedMongoRepository } from './infrastructure/repositories/product-feed-mongo.repository';
import {
  ProductFeedDocument,
  ProductFeedName,
  ProductFeedSchema,
} from './infrastructure/schemas/product-feed.schema';
import { ProductFeedRepository } from './domain/repositories/product-feed.repository';
import { FeedSyncProcessor } from './infrastructure/processors/feed-sync.procesoor';
import { BullModule } from '@nestjs/bullmq';
import { FeedSyncScheduler } from './infrastructure/schedulers/feed-sync.scheduler';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: ProductFeedName, schema: ProductFeedSchema },
    ]),
    BullModule.registerQueue({
      name: 'feed-sync',
    }),
  ],
  controllers: [ProductFeedController, FeedUrlController],
  providers: [
    ProductFeedService,
    FeedBuilderService,
    FeedSyncScheduler,
    FeedSyncProcessor,
    {
      provide: ProductFeedRepository,
      useClass: ProductFeedMongoRepository,
    },
  ],
  exports: [
    ProductFeedService,
    FeedSyncProcessor,
    FeedSyncScheduler,
    FeedBuilderService,
    ProductFeedRepository,
  ],
})
export class ProductFeedModule {}
