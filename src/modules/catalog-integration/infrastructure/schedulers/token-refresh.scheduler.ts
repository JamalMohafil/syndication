import { InjectQueue } from '@nestjs/bullmq';
import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { Queue } from 'bullmq';

@Injectable()
export class TokenRefreshScheduler {
  constructor(
    @InjectQueue('refresh-tokens-job') private readonly queue: Queue,
  ) {}

  @Cron(CronExpression.EVERY_10_MINUTES)
  async handleCron() {
    await this.queue.add('', {});
  }
}
