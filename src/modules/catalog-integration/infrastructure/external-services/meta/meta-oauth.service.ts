import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

export interface MetaTokenResponse {
  access_token: string;
  token_type: string;
  expires_in?: number;
}

export interface MetaBusinessAccount {
  id: string;
  name: string;
}

@Injectable()
export class MetaOAuthService {
  private readonly baseUrl = 'https://graph.facebook.com';

  constructor(private configService: ConfigService) {}

  generateAuthUrl(scopes: string[], state: string): string {
    const clientId = this.configService.get('META_APP_ID');
    const redirectUri = this.configService.get('META_REDIRECT_URI');
    const scopeString = scopes.join(',');
    const authUrl = `https://www.facebook.com/v23.0/dialog/oauth?client_id=${clientId}&redirect_uri=${redirectUri}&scope=${scopeString}&response_type=code&state=${state}`;

    return authUrl; 
  }

  async getTokensFromCode(code: string): Promise<MetaTokenResponse> {
    const appId = this.configService.get('META_APP_ID');
    const appSecret = this.configService.get('META_APP_SECRET');
    const redirectUri = this.configService.get('META_REDIRECT_URI');

    try {
      const response = await axios.get(`${this.baseUrl}/oauth/access_token`, {
        params: {
          client_id: appId,
          client_secret: appSecret,
          code,
          redirect_uri: redirectUri,
        },
      });

      return response.data;
    } catch (error) {
      throw new Error(
        `Failed to get Meta access token: ${error.response?.data?.error?.message || error.message}`,
      );
    }
  }

  async getLongLivedToken(shortLivedToken: string): Promise<MetaTokenResponse> {
    const appId = this.configService.get('META_APP_ID');
    const appSecret = this.configService.get('META_APP_SECRET');

    try {
      const response = await axios.get(`${this.baseUrl}/oauth/access_token`, {
        params: {
          grant_type: 'fb_exchange_token',
          client_id: appId,
          client_secret: appSecret,
          fb_exchange_token: shortLivedToken,
        },
      });

      return response.data;
    } catch (error) {
      throw new Error(
        `Failed to get long-lived token: ${error.response?.data?.error?.message || error.message}`,
      );
    }
  }

  async refreshInstagramToken(accessToken: string): Promise<MetaTokenResponse> {
    try {
      const response = await axios.get(`${this.baseUrl}/refresh_access_token`, {
        params: {
          grant_type: 'ig_refresh_token',
          access_token: accessToken,
        },
      });

      return response.data;
    } catch (error) {
      throw new Error(
        `Failed to refresh Instagram token: ${error.response?.data?.error?.message || error.message}`,
      );
    }
  }

  async getBusinessAccounts(
    accessToken: string,
  ): Promise<MetaBusinessAccount[]> {
    try {
      const response = await axios.get(`${this.baseUrl}/me/businesses`, {
        params: {
          access_token: accessToken,
          fields: 'id,name',
        },
      });

      return response.data.data || [];
    } catch (error) {
      throw new Error(
        `Failed to get business accounts: ${error.response?.data?.error?.message || error.message}`,
      );
    }
  }
}
