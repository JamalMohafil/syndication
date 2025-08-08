import { Injectable } from '@nestjs/common';
import { CatalogIntegrationRepository } from '../../../domain/repositories/catalog-integration.repository';
import { PlatformType } from '../../../domain/enums/platform-type.enum';
import { NotFoundDomainException } from 'src/shared/domain/exceptions/not-found-domain.exception';
import { BadRequestDomainException } from 'src/shared/domain/exceptions/bad-request-domain.exception';
import { GoogleMerchantService } from 'src/modules/catalog-integration/infrastructure/external-services/google/google-merchant.service';
import { CatalogIntegrationService } from '../../services/catalog-integration.service';
import { GoogleOAuthService } from 'src/modules/catalog-integration/infrastructure/external-services/google/google-oauth.service';
import { MerchantAccount } from 'src/modules/catalog-integration/infrastructure/external-services/google/types/merchant-account.type';

export interface GetMerchantAccountsRequest {
  tenantId: string;
  merchantId?: string;
}

 

@Injectable()
export class GetMerchantAccountsUseCase {
  constructor(
    private readonly integrationRepository: CatalogIntegrationRepository,
    private readonly googleMerchantService: GoogleMerchantService,
    private readonly googleOAuthService: GoogleOAuthService,
  ) {}

  async execute(
    request: GetMerchantAccountsRequest,
  ): Promise<MerchantAccount[]> {
    const { tenantId } = request;

    const integration =
      await this.integrationRepository.findByTenantAndPlatform(
        tenantId,
        PlatformType.GOOGLE,
      );

    if (!integration) {
      throw new NotFoundDomainException('Google integration not found');
    }

    if (!integration.isActive()) {
      throw new BadRequestDomainException('Google integration is not active');
    }

    this.googleOAuthService.setCredentials(
      integration.accessToken,
      integration.refreshToken,
    );

    const res = await this.googleMerchantService.getMerchantCenterAccounts(
      integration.accessToken,
    );

    return res;
  }
}
