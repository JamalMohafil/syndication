import { Injectable } from '@nestjs/common';
import { CatalogIntegrationService } from '../../services/catalog-integration.service';
import { EventBusService } from 'src/shared/infrastructure/events/event-bus.service';
import { CreateAuditLogEvent } from 'src/modules/logs/domain/events/create-audit-log.event';

@Injectable()
export class RefreshExpiredTokensUseCase {
  constructor(
    private readonly catalogIntegrationService: CatalogIntegrationService,
    private readonly eventBus: EventBusService,
  ) {}
  async execute() {
    await this.catalogIntegrationService.refreshExpiredTokens();
    this.eventBus.publishEvent(
      new CreateAuditLogEvent('UPDATE', 'INTEGRATIONS', new Date(), '', '', {
        description: `Token refresh completed`,
      }),
      'create-audit-log',
    );
    return { message: 'Token refresh completed', status: 200, success: true };
  }
}
