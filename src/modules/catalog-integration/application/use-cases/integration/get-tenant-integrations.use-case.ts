import { Injectable } from '@nestjs/common';
import { CatalogIntegrationRepository } from '../../../domain/repositories/catalog-integration.repository';
import { CatalogIntegrationEntity } from '../../../domain/entities/catalog-integration.entity';

export interface GetTenantIntegrationsRequest {
  tenantId: string;
}

@Injectable()
export class GetTenantIntegrationsUseCase {
  constructor(
    private readonly integrationRepository: CatalogIntegrationRepository,
  ) {}

  async execute(
    request: GetTenantIntegrationsRequest,
  ): Promise<CatalogIntegrationEntity[]> {
    const { tenantId } = request;
    return await this.integrationRepository.findByTenantId(tenantId);
  }
}
