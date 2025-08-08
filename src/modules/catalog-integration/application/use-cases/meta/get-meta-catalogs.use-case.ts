import { Injectable } from '@nestjs/common';
import { CatalogIntegrationRepository } from '../../../domain/repositories/catalog-integration.repository';
import { PlatformType } from '../../../domain/enums/platform-type.enum';
import { NotFoundDomainException } from 'src/shared/domain/exceptions/not-found-domain.exception';
import { BadRequestDomainException } from 'src/shared/domain/exceptions/bad-request-domain.exception';
import {
  MetaCatalogService,
  MetaCatalog,
} from 'src/modules/catalog-integration/infrastructure/external-services/meta/meta-catalog.service';

export interface GetMetaCatalogsRequest {
  tenantId: string;
  businessId?: string;
}

@Injectable()
export class GetMetaCatalogsUseCase {
  constructor(
    private readonly integrationRepository: CatalogIntegrationRepository,
    private readonly metaCatalogService: MetaCatalogService,
  ) {}

  async execute(request: GetMetaCatalogsRequest): Promise<MetaCatalog[]> {
    const { tenantId, businessId } = request;

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

    return await this.metaCatalogService.getCatalogs(
      integration.accessToken,
      businessId,
    );
  }
}
