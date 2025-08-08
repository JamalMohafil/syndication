import { Injectable } from '@nestjs/common';
import { CatalogIntegrationRepository } from '../../../domain/repositories/catalog-integration.repository';
import { PlatformType } from '../../../domain/enums/platform-type.enum';

import { NotFoundDomainException } from 'src/shared/domain/exceptions/not-found-domain.exception';
import { GoogleMerchantService } from 'src/modules/catalog-integration/infrastructure/external-services/google/google-merchant.service';
import { MetaOAuthService } from 'src/modules/catalog-integration/infrastructure/external-services/meta/meta-oauth.service';

export interface TestConnectionRequest {
  tenantId: string;
  platform: PlatformType;
}

export interface TestConnectionResponse {
  isConnected: boolean;
  platform: PlatformType;
  message: string;
  details?: any;
}

@Injectable()
export class TestConnectionUseCase {
  constructor(
    private readonly integrationRepository: CatalogIntegrationRepository,
    private readonly googleMerchantAdapter: GoogleMerchantService,
    private readonly metaOAuthAdapter: MetaOAuthService,
  ) {}

  async execute(
    request: TestConnectionRequest,
  ): Promise<TestConnectionResponse> {
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

    if (!integration.isActive()) {
      return {
        isConnected: false,
        platform,
        message: 'Integration is not in active status',
      };
    }

    try {
      const testResult = await this.testPlatformConnection(
        platform,
        integration.accessToken,
      );

      return {
        isConnected: true,
        platform,
        message: 'Connection successful',
        details: testResult,
      };
    } catch (error) {
      return {
        isConnected: false,
        platform,
        message: `Connection failed: ${error.message}`,
      };
    }
  }

  private async testPlatformConnection(
    platform: PlatformType,
    accessToken: string,
  ) {
    switch (platform) {
      case PlatformType.GOOGLE:
        return await this.googleMerchantAdapter.getUserMerchantAccounts(
          accessToken,
        );
      case PlatformType.META:
        return await this.metaOAuthAdapter.getBusinessAccounts(accessToken);
      default:
        throw new Error(`Unsupported platform: ${platform}`);
    }
  }
}
