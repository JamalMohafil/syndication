import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { ProductFeedRepository } from '../../domain/repositories/product-feed.repository';
import { ProductFeedEntity } from '../../domain/entities/product-feed.entity';
import { FeedBuilderService } from './feed-builder.service';
import { FileType } from '../../domain/enums/file-type.enum';
import { FeedStatus } from '../../domain/enums/feed-status.enum';
import * as fs from 'fs';
import * as path from 'path';
import appConfig from 'src/shared/infrastructure/config/app.config';
import { ConfigType } from '@nestjs/config';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';

@Injectable()
export class ProductFeedService implements OnModuleInit {
  constructor(
    private readonly productFeedRepository: ProductFeedRepository,
    private readonly feedBuilderService: FeedBuilderService,
    @Inject(appConfig.KEY)
    private readonly config: ConfigType<typeof appConfig>,
    @InjectQueue('feed-sync') private readonly queue: Queue,
  ) {}

  async onModuleInit() {
    await this.queue.add(
      '',
      {},
      {
        attempts: 1,
        removeOnComplete: true,
      },
    );
  }

  async generateDemoFeed(
    tenantId: string,
    fileType: FileType,
    createdBy: string = 'system',
  ): Promise<ProductFeedEntity> {
    try {
      const products = this.feedBuilderService.generateDemoProducts(tenantId);

      let feedContent: string;
      let fileName: string;

      if (fileType === FileType.XML) {
        feedContent = this.feedBuilderService.generateGoogleFeedXML(products);
        fileName = `google-feed-${tenantId}-${Date.now()}.xml`;
      } else {
        feedContent = this.feedBuilderService.generateMetaFeedCSV(products);
        fileName = `meta-feed-${tenantId}-${Date.now()}.csv`;
      }

      const feedDir = path.join(process.cwd(), 'uploads', 'feeds');
      if (!fs.existsSync(feedDir)) {
        fs.mkdirSync(feedDir, { recursive: true });
      }

      const filePath = path.join(feedDir, fileName);
      fs.writeFileSync(filePath, feedContent, 'utf8');

      const feedEntity = new ProductFeedEntity({
        tenantId,
        fileUrl: `${this.config.baseUrl}/api/v1/feeds/${fileName}`,
        fileName,
        fileType,
        fileSize: Buffer.byteLength(feedContent, 'utf8'),
        totalProducts: products.length,
        status: FeedStatus.COMPLETED,
        createdBy,
      });

      return await this.productFeedRepository.create(feedEntity);
    } catch (error) {
      throw new Error(`Failed to generate demo feed: ${error.message}`);
    }
  }

  async getTenantFeeds(tenantId: string): Promise<ProductFeedEntity[]> {
    return await this.productFeedRepository.findByTenantId(tenantId);
  }

  async getFeedById(id: string): Promise<ProductFeedEntity | null> {
    return await this.productFeedRepository.findById(id);
  }

  async deleteFeed(id: string): Promise<boolean> {
    const feed = await this.productFeedRepository.findById(id);
    if (!feed) {
      throw new Error('Feed not found');
    }

    try {
      const filePath = path.join(
        process.cwd(),
        'uploads',
        'feeds',
        feed.fileName,
      );
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    } catch (error) {
      console.warn(`Failed to delete feed file: ${error.message}`);
    }

    return await this.productFeedRepository.delete(id);
  }
}
