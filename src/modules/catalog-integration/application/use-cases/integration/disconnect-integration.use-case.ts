import { Injectable } from '@nestjs/common';
import { CatalogIntegrationRepository } from '../../../domain/repositories/catalog-integration.repository';
import { PlatformType } from '../../../domain/enums/platform-type.enum';
import { NotFoundDomainException } from 'src/shared/domain/exceptions/not-found-domain.exception';
import { EventBusService } from 'src/shared/infrastructure/events/event-bus.service';
import { CreateAuditLogEvent } from 'src/modules/logs/domain/events/create-audit-log.event';

export interface DisconnectIntegrationRequest {
  tenantId: string;
  platform: PlatformType;
}

@Injectable()
export class DisconnectIntegrationUseCase {
  constructor(
    private readonly integrationRepository: CatalogIntegrationRepository,
    private readonly eventBus: EventBusService,
  ) {}

  async execute(request: DisconnectIntegrationRequest): Promise<void> {
    const { tenantId, platform } = request;

    const integration =
      await this.integrationRepository.findByTenantAndPlatform(
        tenantId,
        platform,
      );

    if (!integration) {
      throw new NotFoundDomainException(
        `Integration not found for platform: ${platform}`,
      );
    }

    integration.disconnect();

    await this.integrationRepository.update(integration.id, integration);

    this.eventBus.publishEvent(
      new CreateAuditLogEvent(
        'DELETE',
        'TENANTS',
        new Date(),
        integration.id,
        integration.tenantId,
        {
          platform: integration.platform,
          externalId: integration.externalId,
          description: `Disconnected integration for platform: ${integration.platform}`,
        },
      ),
      'create-audit-log',
    );
  }
}
