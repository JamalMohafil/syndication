import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { BadRequestDomainException } from 'src/shared/domain/exceptions/bad-request-domain.exception';

export interface MetaTokenResponse {
  access_token: string;
  token_type: string;
  expires_in?: number;
}

export interface MetaBusinessAccount {
  id: string;
  name: string;
  access_token?: string;
  category?: string;
  category_list?: { id: string; name: string }[];
  tasks?: string[];
  instagram_business_account?: {
    id: string;
  };
  fan_count?: number;
  picture?: {
    data: {
      height: number;
      is_silhouette: boolean;
      url: string;
      width: number;
    };
  };
  link?: string;
  about?: string;
  created_time?: string;
  location?: {
    city?: string;
    country?: string;
    latitude?: number;
    longitude?: number;
    street?: string;
    zip?: string;
  };
}

@Injectable()
export class MetaOAuthService {
  private readonly baseUrl = 'https://graph.facebook.com';
  private readonly version = 'v20.0';

  constructor(private configService: ConfigService) {}

  generateAuthUrl(scopes: string[], state: string): string {
    const clientId = this.configService.get('META_APP_ID');
    const redirectUri = this.configService.get('META_REDIRECT_URI');
    const scopeString = scopes.join(',');

    const authUrl = `https://www.facebook.com/${this.version}/dialog/oauth?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${scopeString}&response_type=code&state=${state}`;

    return authUrl;
  }

  async getTokensFromCode(code: string): Promise<MetaTokenResponse> {
    const appId = this.configService.get('META_APP_ID');
    const appSecret = this.configService.get('META_APP_SECRET');
    const redirectUri = this.configService.get('META_REDIRECT_URI');

    try {
      const response = await axios.get(
        `${this.baseUrl}/${this.version}/oauth/access_token`,
        {
          params: {
            client_id: appId,
            client_secret: appSecret,
            code,
            redirect_uri: redirectUri,
          },
        },
      );

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
      const response = await axios.get(
        `${this.baseUrl}/${this.version}/oauth/access_token`,
        {
          params: {
            grant_type: 'fb_exchange_token',
            client_id: appId,
            client_secret: appSecret,
            fb_exchange_token: shortLivedToken,
          },
        },
      );

      return response.data;
    } catch (error) {
      throw new Error(
        `Failed to get long-lived token: ${error.response?.data?.error?.message || error.message}`,
      );
    }
  }

  async refreshInstagramToken(accessToken: string): Promise<MetaTokenResponse> {
    try {
      const response = await axios.get(
        `${this.baseUrl}/${this.version}/refresh_access_token`,
        {
          params: {
            grant_type: 'ig_refresh_token',
            access_token: accessToken,
          },
        },
      );

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
      const response = await axios.get(
        `${this.baseUrl}/${this.version}/me/accounts`,
        {
          params: {
            access_token: accessToken,
            fields: [
              'id',
              'name',
              'access_token',
              'category',
              'category_list',
              'tasks',
              'instagram_business_account',
              'fan_count',
              'picture',
              'link',
              'about',
              'created_time',
              'location',
            ].join(','),
          },
        },
      );

      return response.data.data || [];
    } catch (error) {
      throw new Error(
        `Failed to get business accounts: ${error.response?.data?.error?.message || error.message}`,
      );
    }
  }

  async getInstagramBusinessAccounts(
    accessToken: string,
  ): Promise<MetaBusinessAccount[]> {
    try {
      const response = await axios.get(
        `${this.baseUrl}/${this.version}/me/accounts`,
        {
          params: {
            access_token: accessToken,
            fields: 'id,name,instagram_business_account',
          },
        },
      );

      const accounts = response.data.data || [];
      return accounts
        .filter((account) => account.instagram_business_account)
        .map((account) => ({
          id: account.instagram_business_account.id,
          name: account.name,
        }));
    } catch (error) {
      throw new Error(
        `Failed to get Instagram business accounts: ${error.response?.data?.error?.message || error.message}`,
      );
    }
  }

  async getFacebookBusinesses(accessToken: string): Promise<any[]> {
    try {
      const response = await axios.get(
        `${this.baseUrl}/${this.version}/me/businesses`,
        {
          params: {
            access_token: accessToken,
            fields: [
              'id',
              'name',
              'creation_time',
              'created_by',
              'created_time',
              'description',
              'email',
              'is_hidden',
              'is_published',
              'link',
              'phone',
              'picture',
              'primary_page',
              'profile_picture_uri',
              'timezone_id',
              'two_factor_type',
              'updated_time',
              'verification_status',
              'vertical',
              'vertical_id',
              'website',
            ].join(','),
          },
        },
      );
       return response.data.data || [];
    } catch (error) {
      throw new BadRequestDomainException(
        `Failed to get Facebook businesses: ${error.response?.data?.error?.message || error.message}`,
      );
    }
  }

  async validateToken(accessToken: string): Promise<any> {
    try {
      const response = await axios.get(`${this.baseUrl}/${this.version}/me`, {
        params: {
          access_token: accessToken,
          fields: 'id,name',
        },
      });

      return response.data;
    } catch (error) {
      throw new Error(
        `Failed to validate token: ${error.response?.data?.error?.message || error.message}`,
      );
    }
  }
}
