import { Injectable } from '@nestjs/common';
import { MetaOAuthService } from 'src/modules/catalog-integration/infrastructure/external-services/meta/meta-oauth.service';
import { CatalogIntegrationService } from '../../services/catalog-integration.service';
import { PlatformType } from 'src/modules/catalog-integration/domain/enums/platform-type.enum';
import { NotFoundDomainException } from 'src/shared/domain/exceptions/not-found-domain.exception';
import { CatalogIntegrationEntity } from 'src/modules/catalog-integration/domain/entities/catalog-integration.entity';
export interface GetMetaIntegrationRequest {
  tenantId: string;
}

@Injectable()
export class GetMetaIntegrationUseCase {
  constructor(
    private readonly catalogIntegrationService: CatalogIntegrationService,
    private readonly metaOAuthService: MetaOAuthService,
  ) {}
  async execute(
    request: GetMetaIntegrationRequest,
  ): Promise<CatalogIntegrationEntity> {
    const integrations =
      await this.catalogIntegrationService.getTenantIntegrations(
        request.tenantId,
      );
    const metaIntegration = integrations.find(
      (int) => int.platform === PlatformType.META,
    );

    if (!metaIntegration) {
      throw new NotFoundDomainException('Meta integration not found');
    }

    return metaIntegration;
  }
}
