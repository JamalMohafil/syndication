import { Injectable } from '@nestjs/common';
import { google } from 'googleapis';
import { GoogleOAuthService } from './google-oauth.service';
import { MerchantCenterAccount } from './types/merchant-center-account.type';
import { GoogleUserInfo } from './types/google-user-info.type';
import { BadRequestDomainException } from 'src/shared/domain/exceptions/bad-request-domain.exception';

@Injectable()
export class GoogleMerchantService {
  constructor(private readonly googleOAuthService: GoogleOAuthService) {}

  async getUserMerchantAccounts(
    accessToken: string,
  ): Promise<MerchantCenterAccount[]> {
    this.googleOAuthService.setCredentials(accessToken);

    try {
      const merchantApi = google.merchantapi({
        version: 'accounts_v1beta',
        auth: this.googleOAuthService.getAuthClient(),
      });
      try {
        const response = await merchantApi.accounts.list();
        if (response.data.accounts && response.data.accounts.length > 0) {
          return response.data.accounts.map((account: any) => ({
            id: account.name?.split('/')[1] ?? '',
            name: account.accountName ?? '',
            websiteUrl: account.homepageUri ?? '',
            adultContent: account.adultContent || false,
          }));
        }
      } catch (merchantApiError) {
        console.log(
          'Merchant API not available, user needs to manually provide merchant ID',
        );
      }

      console.log(
        'Cannot retrieve merchant accounts without merchant ID - user must provide manually',
      );
      return [];
    } catch (error) {
      console.error('Failed to fetch user merchant accounts:', error);
      if (
        error.code === 403 ||
        error.code === 400 ||
        error.message?.includes('Missing required parameters')
      ) {
        console.log(
          'User does not have merchant center access or no accounts available',
        );
        return [];
      }
      return [];
    }
  }

  async getMerchantCenterAccounts(
    accessToken: string,
    merchantId?: string,
  ): Promise<MerchantCenterAccount[]> {
    if (!merchantId) {
      console.warn('No merchantId provided - cannot fetch merchant accounts');
      return [];
    }

    this.googleOAuthService.setCredentials(accessToken);
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
        })) || []
      );
    } catch (error) {
      console.error('Failed to fetch Merchant Center accounts:', error);
      return [];
    }
  }

  async validateMerchantAccount(
    accessToken: string,
    merchantId: string,
  ): Promise<MerchantCenterAccount | null> {
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
          websiteUrl: response.data.websiteUrl ?? '',
          adultContent: response.data.adultContent || false,
        };
      }
      return null;
    } catch (error) {
      console.error('Failed to validate merchant account:', error);
      return null;
    }
  }

  async getUserInfo(accessToken: string): Promise<GoogleUserInfo> {
    this.googleOAuthService.setCredentials(accessToken);
    const authClient = this.googleOAuthService.getAuthClient();

    try {
      const oauth2 = google.oauth2({ version: 'v2', auth: authClient });
      const response = await oauth2.userinfo.get();
      return {
        id: response.data.id ?? '',
        email: response.data.email ?? '',
        name: response.data.name ?? '',
        picture: response.data.picture ?? '',
      };
    } catch (error) {
      throw new Error(`Failed to get user info: ${error.message}`);
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
