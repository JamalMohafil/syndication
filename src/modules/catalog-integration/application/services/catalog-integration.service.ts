import { Injectable } from '@nestjs/common';
import { CatalogIntegrationRepository } from '../../domain/repositories/catalog-integration.repository';
import { CatalogIntegrationEntity } from '../../domain/entities/catalog-integration.entity';
import { PlatformType } from '../../domain/enums/platform-type.enum';
import { IntegrationStatus } from '../../domain/enums/integration-status.enum';
import { GoogleOAuthService } from '../../infrastructure/external-services/google/google-oauth.service';
import { MetaOAuthService } from '../../infrastructure/external-services/meta/meta-oauth.service';
import { GoogleMerchantService } from '../../infrastructure/external-services/google/google-merchant.service';
import { BadRequestDomainException } from 'src/shared/domain/exceptions/bad-request-domain.exception';

@Injectable()
export class CatalogIntegrationService {
  constructor(
    private readonly catalogIntegrationRepository: CatalogIntegrationRepository,
    private readonly googleOAuthService: GoogleOAuthService,
    private readonly metaOAuthService: MetaOAuthService,
    private readonly googleMerchantService: GoogleMerchantService,
  ) {}

  async connectGoogleIntegration(
    tenantId: string,
    authCode: string,
  ): Promise<CatalogIntegrationEntity> {
    try {
     
      const tokenResponse =
        await this.googleOAuthService.getTokensFromCode(authCode);

      const merchantAccounts =
        await this.googleMerchantService.getMerchantCenterAccounts(
          tokenResponse.access_token,
        );
      const primaryAccount = merchantAccounts[0];  

       let existingIntegration =
        await this.catalogIntegrationRepository.findByTenantAndPlatform(
          tenantId,
          PlatformType.GOOGLE,
        );

      if (existingIntegration) {
        existingIntegration.updateTokens(
          tokenResponse.access_token,
          tokenResponse.refresh_token,
          new Date(Date.now() + tokenResponse.expires_in * 1000),
        );
        existingIntegration.setExternalId(primaryAccount?.id || '');
        existingIntegration.updateStatus(IntegrationStatus.CONNECTED);
        const updatedIntegration =
          await this.catalogIntegrationRepository.update(
            existingIntegration.id,
            existingIntegration,
          );
        if (!updatedIntegration) {
          throw new BadRequestDomainException('Failed to update integration');
        }
        return updatedIntegration;
      } else {
        const newIntegration = new CatalogIntegrationEntity({
          tenantId,
          platform: PlatformType.GOOGLE,
          accessToken: tokenResponse.access_token,
          refreshToken: tokenResponse.refresh_token,
          tokenExpiresAt: new Date(
            Date.now() + tokenResponse.expires_in * 1000,
          ),
          externalId: primaryAccount?.id || '',
          status: IntegrationStatus.CONNECTED,
        });

        return await this.catalogIntegrationRepository.create(newIntegration);
      }
    } catch (error) {
      throw new BadRequestDomainException(
        `Failed to connect Google integration: ${error.message}`,
      );
    }
  }

  async connectMetaIntegration(
    tenantId: string,
    authCode: string,
  ): Promise<CatalogIntegrationEntity> {
    try {
      // Get short-lived token from Meta
      const shortLivedToken =
        await this.metaOAuthService.getTokensFromCode(authCode);

      // Exchange for long-lived token
      const longLivedToken = await this.metaOAuthService.getLongLivedToken(
        shortLivedToken.access_token,
      );

      // Get business accounts
      const businessAccounts = await this.metaOAuthService.getBusinessAccounts(
        longLivedToken.access_token,
      );
      const primaryAccount = businessAccounts[0]; // Take first account for now

      // Create or update integration
      let existingIntegration =
        await this.catalogIntegrationRepository.findByTenantAndPlatform(
          tenantId,
          PlatformType.META,
        );

      if (existingIntegration) {
        existingIntegration.updateTokens(
          longLivedToken.access_token,
          undefined, // Meta handles token refresh automatically
          longLivedToken.expires_in
            ? new Date(Date.now() + longLivedToken.expires_in * 1000)
            : undefined,
        );
        existingIntegration.setExternalId(primaryAccount?.id || '');
        existingIntegration.updateStatus(IntegrationStatus.CONNECTED);

        const updatedIntegration =
          await this.catalogIntegrationRepository.update(
            existingIntegration.id,
            existingIntegration,
          );
        if (!updatedIntegration)
          throw new BadRequestDomainException('Failed to update integration');
        return updatedIntegration; // or throw an error
      } else {
        const newIntegration = new CatalogIntegrationEntity({
          tenantId,
          platform: PlatformType.META,
          accessToken: longLivedToken.access_token,
          tokenExpiresAt: longLivedToken.expires_in
            ? new Date(Date.now() + longLivedToken.expires_in * 1000)
            : undefined,
          externalId: primaryAccount?.id || '',
          status: IntegrationStatus.CONNECTED,
        });

        return await this.catalogIntegrationRepository.create(newIntegration);
      }
    } catch (error) {
      throw new BadRequestDomainException(
        `Failed to connect Meta integration: ${error.message}`,
      );
    }
  }

  async getTenantIntegrations(
    tenantId: string,
  ): Promise<CatalogIntegrationEntity[]> {
    return await this.catalogIntegrationRepository.findByTenantId(tenantId);
  }

  async disconnectIntegration(
    tenantId: string,
    platform: PlatformType,
  ): Promise<void> {
    const integration =
      await this.catalogIntegrationRepository.findByTenantAndPlatform(
        tenantId,
        platform,
      );
    if (!integration) {
      throw new BadRequestDomainException('Integration not found');
    }

    integration.updateStatus(IntegrationStatus.DISCONNECTED);
    await this.catalogIntegrationRepository.update(integration.id, integration);
  }

  async refreshExpiredTokens(): Promise<void> {
    const expiredIntegrations =
      await this.catalogIntegrationRepository.findExpiredTokens();

    for (const integration of expiredIntegrations) {
      try {
        if (
          integration.platform === PlatformType.GOOGLE &&
          integration.refreshToken
        ) {
          const newTokens = await this.googleOAuthService.refreshAccessToken(
            integration.refreshToken,
          );
          integration.updateTokens(
            newTokens.access_token,
            newTokens.refresh_token,
            new Date(Date.now() + newTokens.expires_in * 1000),
          );
          integration.updateStatus(IntegrationStatus.CONNECTED);

          await this.catalogIntegrationRepository.update(
            integration.id,
            integration,
          );
        }
      } catch (error) {
        integration.updateStatus(IntegrationStatus.ERROR);
        await this.catalogIntegrationRepository.update(
          integration.id,
          integration,
        );
      }
    }
  }
}
