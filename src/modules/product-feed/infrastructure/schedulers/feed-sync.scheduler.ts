import { InjectQueue } from '@nestjs/bullmq';
import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
 import { Queue } from 'bullmq';

@Injectable()
export class FeedSyncScheduler {
  constructor(@InjectQueue('feed-sync') private readonly queue: Queue) {}

  @Cron(CronExpression.EVERY_SECOND)
  async handleCron() {
    console.log('Starting feed sync job...');
    await this.queue.add('', {
        tenantId: '1',
    });
  }
}
