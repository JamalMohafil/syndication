import { Injectable } from '@nestjs/common';
import { google } from 'googleapis';
import { ConfigService } from '@nestjs/config';

export interface GoogleTokenResponse {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  token_type: string;
}

export interface MerchantAccount {
  id: string;
  name: string;
  websiteUrl?: string;
  adultContent?: boolean;
  kind?: string;
}

export interface AuthInfo {
  accountIdentifiers: Array<{
    merchantId: string;
    aggregatorId?: string;
  }>;
}

@Injectable()
export class GoogleOAuthService {
  private oauth2Client: any;

  constructor(private configService: ConfigService) {
    this.oauth2Client = new google.auth.OAuth2(
      this.configService.get('GOOGLE_CLIENT_ID'),
      this.configService.get('GOOGLE_CLIENT_SECRET'),
      this.configService.get('GOOGLE_REDIRECT_URI'),
    );
  }

  generateAuthUrl(scopes: string[], state: string): string {
    return this.oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: scopes,
      prompt: 'consent',
      state: state,
    });
  }

  async getTokensFromCode(code: string): Promise<GoogleTokenResponse> {
    const { tokens } = await this.oauth2Client.getToken(code);
    return {
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      expires_in: tokens.expiry_date
        ? Math.floor((tokens.expiry_date - Date.now()) / 1000)
        : 3600,
      token_type: 'Bearer',
    };
  }

  async refreshAccessToken(refreshToken: string): Promise<GoogleTokenResponse> {
    this.oauth2Client.setCredentials({
      refresh_token: refreshToken,
    });

    const { credentials } = await this.oauth2Client.refreshAccessToken();
    return {
      access_token: credentials.access_token,
      refresh_token: credentials.refresh_token || refreshToken,
      expires_in: credentials.expiry_date
        ? Math.floor((credentials.expiry_date - Date.now()) / 1000)
        : 3600,
      token_type: 'Bearer',
    };
  }

  setCredentials(accessToken: string, refreshToken?: string): void {
    this.oauth2Client.setCredentials({
      access_token: accessToken,
      refresh_token: refreshToken,
    });
  }

  getAuthClient() {
    return this.oauth2Client;
  }

  async getUserMerchantAccounts(accessToken: string): Promise<AuthInfo> {
    this.setCredentials(accessToken);
    const content = google.content({
      version: 'v2.1',
      auth: this.oauth2Client,
    });

    try {
      const response = await content.accounts.authinfo();
      return response.data as AuthInfo;
    } catch (error) {
      throw new Error(`Failed to get merchant account info: ${error.message}`);
    }
  }

  async getMerchantAccountDetails(
    accessToken: string,
    merchantId: string,
  ): Promise<MerchantAccount[]> {
    this.setCredentials(accessToken);
    const content = google.content({
      version: 'v2.1',
      auth: this.oauth2Client,
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
        })) || []
      );
    } catch (error) {
      console.error('Failed to fetch merchant account details:', error);
      return [];
    }
  }

  async getSingleMerchantAccount(
    accessToken: string,
    merchantId: string,
  ): Promise<MerchantAccount | null> {
    this.setCredentials(accessToken);
    const content = google.content({
      version: 'v2.1',
      auth: this.oauth2Client,
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
          kind: response.data.kind || '',
        };
      }
      return null;
    } catch (error) {
      console.error('Failed to get merchant account:', error);
      return null;
    }
  }

  async getUserInfo(accessToken: string): Promise<any> {
    this.setCredentials(accessToken);
    const authClient = this.getAuthClient();

    try {
      const oauth2 = google.oauth2({ version: 'v2', auth: authClient });
      const response = await oauth2.userinfo.get();
      return response.data;
    } catch (error) {
      throw new Error(`Failed to get user info: ${error.message}`);
    }
  }
}
