import { Injectable } from '@nestjs/common';
import { GoogleMerchantService } from 'src/modules/catalog-integration/infrastructure/external-services/google/google-merchant.service';
import { CatalogIntegrationService } from '../../services/catalog-integration.service';
import { CatalogIntegrationRepository } from 'src/modules/catalog-integration/domain/repositories/catalog-integration.repository';
import { PlatformType } from 'src/modules/catalog-integration/domain/enums/platform-type.enum';
import { NotFoundDomainException } from 'src/shared/domain/exceptions/not-found-domain.exception';
import { BadRequestDomainException } from 'src/shared/domain/exceptions/bad-request-domain.exception';

@Injectable()
export class CheckDataFeedStatusUseCase {
  constructor(
    private readonly merchantService: GoogleMerchantService,
    private readonly integrationRepository: CatalogIntegrationRepository,
  ) {}
  async execute(tenantId: string) {
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

    return await this.merchantService.checkDataFeedStatus(
      integration.accessToken,
      integration.refreshToken!,
      finalMerchantId,
    );
  }
}
