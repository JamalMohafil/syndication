import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { ProductFeedService } from '../../application/services/product-feed.service';
import { Logger } from '@nestjs/common';

@Processor('feed-sync')
export class FeedSyncProcessor extends WorkerHost {
  private readonly logger = new Logger(FeedSyncProcessor.name);
  constructor(private readonly productFeedService: ProductFeedService) {
    super();
  }
  async process(job: Job): Promise<any> {
    try {
      // const res = await this.productFeedService.generateDemoFeed(
      //   job.data.tenantId,
      //   job.data.fileType,
      // );
      // console.log(res);
      console.log(`Feed sync job completed`);
    } catch (e) {
      throw e;
    }
  }
}
