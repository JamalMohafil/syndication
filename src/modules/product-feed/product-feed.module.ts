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

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: ProductFeedName, schema: ProductFeedSchema },
    ]),
  ],
  controllers: [ProductFeedController, FeedUrlController],
  providers: [
    ProductFeedService,
    FeedBuilderService,
    {
      provide: ProductFeedRepository,
      useClass: ProductFeedMongoRepository,
    },
  ],
  exports: [ProductFeedService, FeedBuilderService, ProductFeedRepository],
})
export class ProductFeedModule {}
