import { Injectable } from '@nestjs/common';
import { CatalogIntegrationRepository } from '../../../domain/repositories/catalog-integration.repository';
import { CatalogIntegrationEntity } from '../../../domain/entities/catalog-integration.entity';
import { PlatformType } from '../../../domain/enums/platform-type.enum';
import { NotFoundDomainException } from 'src/shared/domain/exceptions/not-found-domain.exception';

export interface GetPlatformIntegrationRequest {
  tenantId: string;
 }

@Injectable()
export class GetIntergrationsUseCase {
  constructor(
    private readonly integrationRepository: CatalogIntegrationRepository,
  ) {}

  async execute(
    request: GetPlatformIntegrationRequest,
  ): Promise<CatalogIntegrationEntity[]> {
    const { tenantId } = request;

    const integration =
      await this.integrationRepository.findByTenantId(tenantId);

    if (!integration) {
      throw new NotFoundDomainException(
        `Integrations not found`,
      );
    }
 
    return integration;
  }
}
