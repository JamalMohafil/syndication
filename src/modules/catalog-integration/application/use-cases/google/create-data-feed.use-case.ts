import { Injectable } from '@nestjs/common';
import { CatalogIntegrationRepository } from '../../../domain/repositories/catalog-integration.repository';
import { PlatformType } from '../../../domain/enums/platform-type.enum';
import { NotFoundDomainException } from 'src/shared/domain/exceptions/not-found-domain.exception';
import { BadRequestDomainException } from 'src/shared/domain/exceptions/bad-request-domain.exception';
import { GoogleMerchantService } from 'src/modules/catalog-integration/infrastructure/external-services/google/google-merchant.service';
import { GoogleOAuthService } from 'src/modules/catalog-integration/infrastructure/external-services/google/google-oauth.service';

export interface CreateDataFeedRequest {
  tenantId: string;
  feedName: string;
  feedUrl: string;
}

@Injectable()
export class CreateDataFeedUseCase {
  constructor(
    private readonly integrationRepository: CatalogIntegrationRepository,
    private readonly googleMerchantAdapter: GoogleMerchantService,
    private readonly googleOAuthService: GoogleOAuthService,
  ) {}

  async execute(request: CreateDataFeedRequest): Promise<any> {
    const { tenantId, feedName, feedUrl } = request;

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

    const finalMerchantId = integration.externalId;
    if (!finalMerchantId) {
      throw new BadRequestDomainException('Merchant ID is required');
    }

    return await this.googleMerchantAdapter.createDataFeed(
      integration.accessToken,
      integration.refreshToken!,
      finalMerchantId,
      feedName,
      feedUrl,
    );
  }
}
