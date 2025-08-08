import { Injectable } from '@nestjs/common';
import { CatalogIntegrationRepository } from '../../../domain/repositories/catalog-integration.repository';
import { CatalogIntegrationEntity } from '../../../domain/entities/catalog-integration.entity';
import { PlatformType } from '../../../domain/enums/platform-type.enum';
import { NotFoundDomainException } from 'src/shared/domain/exceptions/not-found-domain.exception';

export interface GetPlatformIntegrationRequest {
  tenantId: string;
  platform: PlatformType;
}

@Injectable()
export class GetPlatformIntegrationUseCase {
  constructor(
    private readonly integrationRepository: CatalogIntegrationRepository,
  ) {}

  async execute(
    request: GetPlatformIntegrationRequest,
  ): Promise<CatalogIntegrationEntity> {
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

    return integration;
  }
}
