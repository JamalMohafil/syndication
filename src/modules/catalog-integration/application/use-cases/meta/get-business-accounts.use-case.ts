import { Injectable } from '@nestjs/common';
import { CatalogIntegrationRepository } from '../../../domain/repositories/catalog-integration.repository';
import { PlatformType } from '../../../domain/enums/platform-type.enum';
import { NotFoundDomainException } from 'src/shared/domain/exceptions/not-found-domain.exception';
import { BadRequestDomainException } from 'src/shared/domain/exceptions/bad-request-domain.exception';
import { MetaOAuthService } from 'src/modules/catalog-integration/infrastructure/external-services/meta/meta-oauth.service';

export interface GetBusinessAccountsRequest {
  tenantId: string;
}

export interface MetaBusinessAccount {
  id: string;
  name: string;
}

@Injectable()
export class GetBusinessAccountsUseCase {
  constructor(
    private readonly integrationRepository: CatalogIntegrationRepository,
    private readonly metaOAuthAdapter: MetaOAuthService,
  ) {}

  async execute(
    request: GetBusinessAccountsRequest,
  ): Promise<MetaBusinessAccount[]> {
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

    return await this.metaOAuthAdapter.getBusinessAccounts(
      integration.accessToken,
    );
  }
}
