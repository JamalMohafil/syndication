import { Injectable, Logger } from '@nestjs/common';
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
  private readonly logger = new Logger(CatalogIntegrationService.name);
  constructor(
    private readonly catalogIntegrationRepository: CatalogIntegrationRepository,
    private readonly googleOAuthService: GoogleOAuthService,
    private readonly metaOAuthService: MetaOAuthService,
    private readonly googleMerchantService: GoogleMerchantService,
  ) {}

  async connectGoogleIntegration(
    tenantId: string,
    authCode: string,
  ): Promise<any> {
    try {
      const tokenResponse =
        await this.googleOAuthService.getTokensFromCode(authCode);

      let merchantAccounts: any[] = [];
      try {
        merchantAccounts =
          await this.googleMerchantService.getUserMerchantAccounts(
            tokenResponse.access_token,
          );
      } catch (error) {
        console.warn('Could not fetch merchant accounts:', error.message);
      }

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
          externalId: merchantAccounts[0].id,
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

  async setupGoogleMerchantAccount(
    tenantId: string,
    merchantId: string,
  ): Promise<{ integration: CatalogIntegrationEntity; accountInfo?: any }> {
    try {
      const integration =
        await this.catalogIntegrationRepository.findByTenantAndPlatform(
          tenantId,
          PlatformType.GOOGLE,
        );

      if (!integration) {
        throw new BadRequestDomainException('Google integration not found');
      }

      const accountInfo =
        await this.googleMerchantService.validateMerchantAccount(
          integration.accessToken,
          merchantId,
        );

      if (!accountInfo) {
        throw new BadRequestDomainException(
          'Invalid merchant ID or no access to this merchant account',
        );
      }

      integration.setExternalId(merchantId);

      const currentConfigs = integration.platformConfigs || {};
      integration.setPlatformConfigs({
        ...currentConfigs,
        selectedMerchantId: merchantId,
        selectedMerchantAccount: accountInfo,
      });

      const updatedIntegration = await this.catalogIntegrationRepository.update(
        integration.id,
        integration,
      );

      if (!updatedIntegration) {
        throw new BadRequestDomainException('Failed to update integration');
      }

      return {
        integration: updatedIntegration,
        accountInfo,
      };
    } catch (error) {
      throw new BadRequestDomainException(
        `Failed to setup merchant account: ${error.message}`,
      );
    }
  }

  async connectMetaIntegration(
    tenantId: string,
    authCode: string,
  ): Promise<CatalogIntegrationEntity> {
    try {
      const shortLivedToken =
        await this.metaOAuthService.getTokensFromCode(authCode);
      const longLivedToken = await this.metaOAuthService.getLongLivedToken(
        shortLivedToken.access_token,
      );
      const businessAccounts = await this.metaOAuthService.getBusinessAccounts(
        longLivedToken.access_token,
      );
      const primaryAccount = businessAccounts[0];

      let existingIntegration =
        await this.catalogIntegrationRepository.findByTenantAndPlatform(
          tenantId,
          PlatformType.META,
        );

      if (existingIntegration) {
        existingIntegration.updateTokens(
          longLivedToken.access_token,
          undefined,
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
        return updatedIntegration;
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
    this.logger.log('Starting token refresh process...');

    try {
      const expiredIntegrations =
        await this.catalogIntegrationRepository.findExpiredTokens();

      if (!expiredIntegrations || expiredIntegrations.length === 0) {
        this.logger.log('No expired tokens found');
        return;
      }

      this.logger.log(
        `Found ${expiredIntegrations.length} expired integrations`,
      );

      const results = {
        success: 0,
        failed: 0,
        errors: [] as string[],
      };

      // معالجة التوكنز بشكل متتالي لتجنب rate limiting
      for (const integration of expiredIntegrations) {
        try {
          if (integration.platform !== PlatformType.GOOGLE) {
            this.logger.warn(
              `Skipping non-Google integration: ${integration.id}`,
            );
            continue;
          }

          if (!integration.refreshToken) {
            this.logger.error(
              `No refresh token found for integration: ${integration.id}`,
            );
            integration.updateStatus(IntegrationStatus.ERROR);
            await this.catalogIntegrationRepository.update(
              integration.id,
              integration,
            );
            results.failed++;
            results.errors.push(
              `Integration ${integration.id}: No refresh token`,
            );
            continue;
          }

          this.logger.log(
            `Refreshing tokens for integration: ${integration.id}`,
          );

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

          results.success++;
          this.logger.log(
            `Successfully refreshed tokens for integration: ${integration.id}`,
          );

          await new Promise((resolve) => setTimeout(resolve, 100));
        } catch (error) {
          this.logger.error(
            `Failed to refresh tokens for integration ${integration.id}:`,
            error,
          );

          const isRefreshTokenExpired =
            error.message?.includes('invalid_grant') ||
            error.message?.includes('Refresh token is invalid or expired');

          integration.updateStatus(
            isRefreshTokenExpired
              ? IntegrationStatus.ERROR
              : IntegrationStatus.ERROR,
          );

          await this.catalogIntegrationRepository.update(
            integration.id,
            integration,
          );

          results.failed++;
          results.errors.push(
            `Integration ${integration.id}: ${error.message}`,
          );
        }
      }

      this.logger.log(
        `Token refresh completed. Success: ${results.success}, Failed: ${results.failed}`,
      );

      if (results.errors.length > 0) {
        this.logger.warn('Refresh errors:', results.errors);
      }
    } catch (error) {
      this.logger.error('Critical error during token refresh process:', error);
      throw error;
    }
  }
}
