import { Injectable } from '@nestjs/common';
import { PlatformType } from '../../../domain/enums/platform-type.enum';
import { IntegrationStatus } from '../../../domain/enums/integration-status.enum';
import { CatalogIntegrationRepository } from '../../../domain/repositories/catalog-integration.repository';
import { CatalogIntegrationEntity } from '../../../domain/entities/catalog-integration.entity';

import { BadRequestDomainException } from 'src/shared/domain/exceptions/bad-request-domain.exception';
import { GoogleOAuthService } from 'src/modules/catalog-integration/infrastructure/external-services/google/google-oauth.service';
import {
  MetaOAuthService,
  MetaTokenResponse,
} from 'src/modules/catalog-integration/infrastructure/external-services/meta/meta-oauth.service';
import { GoogleTokenResponse } from 'src/modules/catalog-integration/infrastructure/external-services/google/types/google-token-response.type';

export interface ConnectPlatformRequest {
  tenantId: string;
  platform: PlatformType;
  authCode: string;
}

@Injectable()
export class ConnectPlatformUseCase {
  constructor(
    private readonly integrationRepository: CatalogIntegrationRepository,
    private readonly googleOAuthService: GoogleOAuthService,
    private readonly metaOAuthService: MetaOAuthService,
  ) {}

  async execute(
    request: ConnectPlatformRequest,
  ): Promise<CatalogIntegrationEntity> {
    const { tenantId, platform, authCode } = request;

    const tokenResponse: GoogleTokenResponse | any =
      await this.getTokensFromCode(platform, authCode);

    const token = {
      accessToken: tokenResponse.access_token,
      refreshToken: tokenResponse.refresh_token ?? '',
      expiresAt: tokenResponse.expires_in
        ? new Date(Date.now() + tokenResponse.expires_in * 1000)
        : undefined,
    };

    const existingIntegration =
      await this.integrationRepository.findByTenantAndPlatform(
        tenantId,
        platform,
      );

    if (existingIntegration) {
      existingIntegration.updateTokens(
        token.accessToken,
        token.refreshToken,
        token.expiresAt,
      );
      existingIntegration.updateStatus(IntegrationStatus.CONNECTED);
      const updatedIntegration = await this.integrationRepository.update(
        existingIntegration.id!,
        existingIntegration,
      );
      if (!updatedIntegration)
        throw new BadRequestDomainException('Could not update integration');
      return updatedIntegration;
    }

    const newIntegration = new CatalogIntegrationEntity({
      tenantId,
      platform,
      accessToken: token.accessToken,
      externalId: tokenResponse.user_id,
      status: IntegrationStatus.CONNECTED,
    });

    return await this.integrationRepository.create(newIntegration);
  }

  private async getTokensFromCode(platform: PlatformType, authCode: string) {
    switch (platform) {
      case PlatformType.GOOGLE:
        return await this.googleOAuthService.getTokensFromCode(authCode);
      case PlatformType.META:
        return await this.metaOAuthService.getTokensFromCode(authCode);
      default:
        throw new BadRequestDomainException(
          `Unsupported platform: ${platform}`,
        );
    }
  }
}
