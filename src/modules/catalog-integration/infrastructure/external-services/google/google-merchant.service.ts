import { Injectable } from '@nestjs/common';
import { google } from 'googleapis';
import { GoogleOAuthService } from './google-oauth.service';

export interface MerchantCenterAccount {
  id: string;
  name: string;
  websiteUrl: string;
  adultContent: boolean;
}

@Injectable()
export class GoogleMerchantService {
  constructor(private readonly googleOAuthService: GoogleOAuthService) {}

  async getMerchantCenterAccounts(
    accessToken: string,
  ): Promise<MerchantCenterAccount[]> {
    this.googleOAuthService.setCredentials(accessToken);
    const content = google.content({
      version: 'v2.1',
      auth: this.googleOAuthService.getAuthClient(),
    });

    try {
      const response = await content.accounts.list();
      return (
        response.data.resources?.map((account) => ({
          id: account.id ?? '',
          name: account.name ?? '',
          websiteUrl: account.websiteUrl ?? '',
          adultContent: account.adultContent || false,
        })) || []
      );
    } catch (error) {
      throw new Error(
        `Failed to fetch Merchant Center accounts: ${error.message}`,
      );
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
        auth: this.googleOAuthService.getAuthClient(),
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
      throw new Error(`Failed to create data feed: ${error.message}`);
    }
  }
}
