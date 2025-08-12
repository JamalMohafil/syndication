import { InjectQueue } from '@nestjs/bullmq';
import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { Queue } from 'bullmq';

@Injectable()
export class FeedStatsScheduler {
  constructor(@InjectQueue('feed-stats') private readonly queue: Queue) {}

  @Cron(CronExpression.EVERY_HOUR)
  async handleCron() {
    console.log('Starting feed sync job...');
    await this.queue.add('feed-stats', {});
  }
}
