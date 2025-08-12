import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { ProductFeedService } from '../../application/services/product-feed.service';
import { Logger } from '@nestjs/common';
import { FileType } from '../../domain/enums/file-type.enum';

@Processor('feed-stats')
export class FeedStatsProcessor extends WorkerHost {
  private readonly logger = new Logger(FeedStatsProcessor.name);
  constructor(private readonly productFeedService: ProductFeedService) {
    super();
  }
  async process(job: Job): Promise<any> {
    try {
      if (job.name === 'sync-products') {
        console.log('Syncing products for tenant', job.data.tenantId);
        const feed = await this.productFeedService.generateDemoFeed(
          '6895b7665ef3504be0ef5b8f',
          FileType.CSV,
        );
        // هون بس منخليه يستدعي منتجات العملاء ومنعملهم مزامنة
        if (!feed) {
          this.logger.log('No products to sync');
          return;
        }
        console.log(feed);
        console.log(`Feed sync job completed`);
      }
    } catch (e) {
      throw e;
    }
  }
}
