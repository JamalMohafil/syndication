import { Injectable } from '@nestjs/common';
import { CatalogIntegrationRepository } from '../../../domain/repositories/catalog-integration.repository';
import { PlatformType } from '../../../domain/enums/platform-type.enum';
import { NotFoundDomainException } from 'src/shared/domain/exceptions/not-found-domain.exception';
import { BadRequestDomainException } from 'src/shared/domain/exceptions/bad-request-domain.exception';

export interface GetMetaCatalogsRequest {
  tenantId: string;
}

@Injectable()
export class GetMetaCatalogsUseCase {
  constructor(
    private readonly integrationRepository: CatalogIntegrationRepository,
  ) {}

  async execute(request: GetMetaCatalogsRequest): Promise<any> {
    const { tenantId } = request;

    const integration =
      await this.integrationRepository.findByTenantAndPlatform(
        tenantId,
        PlatformType.META,
      );

    if (!integration) {
      throw new NotFoundDomainException('Meta integration not found');
    }

    if (!integration.isActive()) {
      throw new BadRequestDomainException('Meta integration is not active');
    }

    // TODO: Implement Meta catalog service
    return { message: 'Meta catalogs endpoint - implement MetaCatalogService' };
  }
}
