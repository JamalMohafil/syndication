import { Injectable } from '@nestjs/common';
import { CatalogIntegrationRepository } from '../../../domain/repositories/catalog-integration.repository';
import { PlatformType } from '../../../domain/enums/platform-type.enum';
import { NotFoundDomainException } from 'src/shared/domain/exceptions/not-found-domain.exception';
import { BadRequestDomainException } from 'src/shared/domain/exceptions/bad-request-domain.exception';
import { GoogleMerchantService } from 'src/modules/catalog-integration/infrastructure/external-services/google/google-merchant.service';

export interface SetupMerchantAccountRequest {
  tenantId: string;
  merchantId: string;
}

export interface SetupMerchantAccountResponse {
  integration: any;
  accountInfo: any;
}

@Injectable()
export class SetupMerchantAccountUseCase {
  constructor(
    private readonly integrationRepository: CatalogIntegrationRepository,
  ) {}

  async execute(
    request: SetupMerchantAccountRequest,
  ): Promise<SetupMerchantAccountResponse> {
    const { tenantId, merchantId } = request;

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

     const accountInfo = await this.validateMerchantAccount(
      integration.accessToken,
      merchantId,
    );

    if (!accountInfo) {
      throw new BadRequestDomainException('Invalid merchant account');
    }

     integration.setExternalId(merchantId);
    const updatedIntegration = await this.integrationRepository.update(
      integration.id!,
      integration,
    );

    return {
      integration: updatedIntegration,
      accountInfo,
    };
  }

  private async validateMerchantAccount(
    accessToken: string,
    merchantId: string,
  ): Promise<any> {
    try {
      return {
        id: merchantId,
        name: 'Merchant Account',
        websiteUrl: 'https://example.com',
        adultContent: false,
      };
    } catch (error) {
      console.error('Failed to validate merchant account:', error);
      return null;
    }
  }
}
