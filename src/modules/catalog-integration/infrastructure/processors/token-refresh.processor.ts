import { RefreshExpiredTokensUseCase } from '../../application/use-cases/integration/refresh-expired-tokens.use-case';
import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';

@Processor('refresh-tokens-job')
export class TokenRefreshProcessor extends WorkerHost {
  private readonly logger = new Logger(TokenRefreshProcessor.name);

  constructor(
    private readonly refreshTokensUseCase: RefreshExpiredTokensUseCase,
  ) {
    super();
  }

  async process(job: Job): Promise<any> {
    try {
      console.log('Starting token refresh job...');
      return await this.refreshTokensUseCase.execute();
      console.log('Token refresh job completed.');
    } catch (e) {
      this.logger.error(`Error processing ${job.id}`, e);
      throw e;
    }
  }
}
