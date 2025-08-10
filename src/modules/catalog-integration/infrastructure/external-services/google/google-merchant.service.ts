import { Injectable, Logger } from '@nestjs/common';
import { google } from 'googleapis';
import { GoogleOAuthService } from './google-oauth.service';
import { GoogleUserInfo } from './types/google-user-info.type';
import { BadRequestDomainException } from 'src/shared/domain/exceptions/bad-request-domain.exception';
import { MerchantAccount } from './types/merchant-account.type';

@Injectable()
export class GoogleMerchantService {
  private readonly logger = new Logger(GoogleMerchantService.name);
  constructor(private readonly googleOAuthService: GoogleOAuthService) {}

  async getUserMerchantAccounts(
    accessToken: string,
    refreshToken?: string,
  ): Promise<MerchantAccount[]> {
    try {
      this.googleOAuthService.setCredentials(accessToken, refreshToken);

      // استخدام Merchant API v1beta - الطريقة الجديدة
      const merchantApi = google.merchantapi({
        version: 'accounts_v1beta',
        auth: this.googleOAuthService.getAuthClient(),
      });

      this.logger.log(
        'Attempting to fetch merchant accounts using Merchant API v1beta',
      );

    const response = await merchantApi.accounts.list();

      if (response.data.accounts && response.data.accounts.length > 0) {
        return response.data.accounts.map((account: any) => ({
          id: account.accountId ?? account.name?.split('/')[1] ?? '',
          name: account.accountName ?? account.displayName ?? '',
          websiteUrl:
            account.businessInfo?.website ?? account.homepageUri ?? '',
          adultContent: account.adultContent || false,
          kind: 'merchant#account',
        }));
      }

      this.logger.warn('No merchant accounts found');
      return [];
    } catch (error) {
      this.logger.error(
        'Failed to fetch merchant accounts with v1beta API:',
        error,
      );

      if (error.code === 401) {
        throw new BadRequestDomainException(
          'Authentication failed. Please re-authenticate your Google account.',
        );
      }

      if (error.code === 403) {
        throw new BadRequestDomainException(
          'Access denied. You may not have Merchant Center access or required permissions.',
        );
      }

      if (error.code === 404) {
        this.logger.warn('Merchant API v1beta not available for this account');
        return [];
      }

      throw new BadRequestDomainException(
        `Failed to fetch merchant accounts: ${error.message}`,
      );
    }
  }

  async getMerchantCenterAccounts(
    accessToken: string,
    merchantId: string,
    refreshToken: string,
  ): Promise<MerchantAccount[]> {
    if (!merchantId) {
      console.warn('No merchantId provided - cannot fetch merchant accounts');
      return [];
    }

    this.googleOAuthService.setCredentials(accessToken, refreshToken);
    const content = google.content({
      version: 'v2.1',
      auth: this.googleOAuthService.getAuthClient(),
    });

    try {
      const response = await content.accounts.list({
        merchantId: merchantId,
      });
      return (
        response.data.resources?.map((account) => ({
          id: account.id ?? '',
          name: account.name ?? '',
          websiteUrl: account.websiteUrl ?? '',
          adultContent: account.adultContent || false,
          kind: account.kind || '',
          users: account.users,
          sellerId: account.sellerId || '',
        })) || []
      );
    } catch (error) {
      if (error.message?.includes('is not a multi-client account')) {
        const account = await content.accounts.get({
          merchantId,
          accountId: merchantId,
        });
        return [
          {
            id: account.data.id ?? '',
            name: account.data.name ?? '',
            websiteUrl: account.data.websiteUrl ?? '',
            adultContent: account.data.adultContent || false,
            kind: account.data.kind || '',
            users: account.data.users,
            sellerId: account.data.sellerId || '',
          },
        ];
      }
      console.error('Failed to fetch Merchant Center accounts:', error);
      return [];
    }
  }

  async validateMerchantAccount(
    accessToken: string,
    merchantId: string,
  ): Promise<MerchantAccount | null> {
    this.googleOAuthService.setCredentials(accessToken);
    const content = google.content({
      version: 'v2.1',
      auth: this.googleOAuthService.getAuthClient(),
    });

    try {
      const response = await content.accounts.get({
        merchantId: merchantId,
        accountId: merchantId,
      });

      if (response.data) {
        return {
          id: response.data.id ?? '',
          name: response.data.name ?? '',
          kind: response.data.kind ?? '',
          websiteUrl: response.data.websiteUrl ?? '',
          adultContent: response.data.adultContent || false,
          users: response.data.users,
          sellerId: response.data.sellerId || '',
        };
      }
      return null;
    } catch (error) {
      console.error('Failed to validate merchant account:', error);
      return null;
    }
  }

  async getProducts(accessToken: string, merchantId: string): Promise<any[]> {
    this.googleOAuthService.setCredentials(accessToken);
    const content = google.content({
      version: 'v2.1',
      auth: this.googleOAuthService.getAuthClient(),
    });

    try {
      const response = await content.products.list({ merchantId });
      return response.data.resources || [];
    } catch (error) {
      throw new Error(`Failed to fetch products: ${error.message}`);
    }
  }
  async uploadProductFeed(
    accessToken: string,
    merchantId: string,
    feedData: any,
  ): Promise<void> {
    this.googleOAuthService.setCredentials(accessToken);
    const content = google.content({
      version: 'v2.1',
      auth: this.googleOAuthService.getAuthClient(),
    });

    try {
      await content.products.insert({
        merchantId,
        requestBody: feedData,
      });
    } catch (error) {
      throw new Error(`Failed to upload product feed: ${error.message}`);
    }
  }

  async createDataFeed(
    accessToken: string,
    merchantId: string,
    feedName: string,
    feedUrl: string,
  ): Promise<any> {
    this.googleOAuthService.setCredentials(accessToken);
    const content = google.content({
      version: 'v2.1',
      auth: this.googleOAuthService.getAuthClient(),
    });

    try {
      const response = await content.datafeeds.insert({
        merchantId,
        requestBody: {
          name: feedName,
          contentType: 'products',
          format: {
            fileEncoding: 'utf-8',
            columnDelimiter: ',',
            quotingMode: 'value_quoting',
          },
          fetchSchedule: {
            weekday: 'MONDAY',
            hour: 6,
            timeZone: 'UTC',
          },
          fileName: feedUrl,
        },
      });
      return response.data;
    } catch (error) {
      throw new BadRequestDomainException(
        `Failed to create data feed: ${error.message}`,
      );
    }
  }
}
