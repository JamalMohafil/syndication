import { Injectable } from '@nestjs/common';
import { CatalogIntegrationRepository } from '../../../domain/repositories/catalog-integration.repository';
import { PlatformType } from '../../../domain/enums/platform-type.enum';

import { NotFoundDomainException } from 'src/shared/domain/exceptions/not-found-domain.exception';
import { BadRequestDomainException } from 'src/shared/domain/exceptions/bad-request-domain.exception';
import { MetaOAuthService } from 'src/modules/catalog-integration/infrastructure/external-services/meta/meta-oauth.service';
import { GoogleOAuthService } from 'src/modules/catalog-integration/infrastructure/external-services/google/google-oauth.service';

export interface RefreshTokensRequest {
  tenantId: string;
  platform: PlatformType;
}

@Injectable()
export class RefreshTokensUseCase {
  constructor(
    private readonly integrationRepository: CatalogIntegrationRepository,
    private readonly googleOAuthProvider: GoogleOAuthService,
    private readonly metaOAuthProvider: MetaOAuthService,
  ) {}

  async execute(request: RefreshTokensRequest): Promise<void> {
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

    if (!integration.refreshToken) {
      throw new BadRequestDomainException('Refresh token not available');
    }

    const tokenResponse: any = await this.getRefreshedTokens(
      platform,
      integration.refreshToken,
    );

    const newToken = {
      accessToken: tokenResponse.access_token,
      refreshToken: tokenResponse?.refresh_token
        ? tokenResponse.refresh_token
        : '',
      expiresAt: tokenResponse.expires_in
        ? new Date(Date.now() + tokenResponse.expires_in * 1000)
        : undefined,
    };

    integration.updateTokens(
      newToken.accessToken,
      newToken.refreshToken,
      newToken.expiresAt,
    );
    await this.integrationRepository.update(integration.id!, integration);
  }

  private async getRefreshedTokens(
    platform: PlatformType,
    refreshToken: string,
  ) {
    switch (platform) {
      case PlatformType.GOOGLE:
        return await this.googleOAuthProvider.refreshAccessToken(refreshToken);
      case PlatformType.META:
        return await this.metaOAuthProvider.refreshInstagramToken(refreshToken);
      default:
        throw new BadRequestDomainException(
          `Unsupported platform: ${platform}`,
        );
    }
  }
}
