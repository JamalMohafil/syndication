import { Injectable, Logger } from '@nestjs/common';
import { google } from 'googleapis';
import { ConfigService } from '@nestjs/config';
import { MerchantAccount } from './types/merchant-account.type';
import { AuthInfo } from './types/auth-info.type';
import { GoogleTokenResponse } from './types/google-token-response.type';

@Injectable()
export class GoogleOAuthService {
  private oauth2Client: any;
  private readonly logger = new Logger(GoogleOAuthService.name);

  constructor(private configService: ConfigService) {
    try {
      // التأكد من وجود البيانات المطلوبة
      const clientId = this.configService.get('GOOGLE_CLIENT_ID');
      const clientSecret = this.configService.get('GOOGLE_CLIENT_SECRET');
      const redirectUri = this.configService.get('GOOGLE_REDIRECT_URI');

      if (!clientId || !clientSecret || !redirectUri) {
        throw new Error(
          'Missing Google OAuth configuration. Please check GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, and GOOGLE_REDIRECT_URI',
        );
      }

      this.oauth2Client = new google.auth.OAuth2(
        clientId,
        clientSecret,
        redirectUri,
      );

      // إضافة event listener بعد إنشاء oauth2Client
      this.oauth2Client.on('tokens', (tokens) => {
        this.logger.log('New tokens received from Google');
        if (tokens.refresh_token) {
          this.logger.log('New refresh token received');
        }
      });

      this.logger.log('Google OAuth2 client initialized successfully');
    } catch (error) {
      this.logger.error('Failed to initialize Google OAuth2 client:', error);
      throw error;
    }
  }

  generateAuthUrl(scopes: string[], state: string): string {
    if (!this.oauth2Client) {
      throw new Error('OAuth2 client not initialized');
    }

    return this.oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: scopes,
      prompt: 'consent',
      state: state,
    });
  }

  async getTokensFromCode(code: string): Promise<GoogleTokenResponse> {
    if (!this.oauth2Client) {
      throw new Error('OAuth2 client not initialized');
    }

    try {
      const { tokens } = await this.oauth2Client.getToken(code);

      return {
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        expires_in: tokens.expiry_date
          ? Math.max(Math.floor((tokens.expiry_date - Date.now()) / 1000), 0)
          : 3600,
        token_type: 'Bearer',
      };
    } catch (error) {
      this.logger.error('Failed to get tokens from code:', error);
      throw new Error(`Failed to exchange code for tokens: ${error.message}`);
    }
  }

  async refreshAccessToken(refreshToken: string): Promise<GoogleTokenResponse> {
    if (!this.oauth2Client) {
      throw new Error('OAuth2 client not initialized');
    }

    try {
      if (!refreshToken) {
        throw new Error('Refresh token is required');
      }

      this.oauth2Client.setCredentials({
        refresh_token: refreshToken,
      });

      this.logger.log('Attempting to refresh access token...');

      const { credentials } = await this.oauth2Client.refreshAccessToken();

      if (!credentials.access_token) {
        throw new Error(
          'Failed to refresh access token - no access token received',
        );
      }

      const expiresIn = credentials.expiry_date
        ? Math.max(Math.floor((credentials.expiry_date - Date.now()) / 1000), 0)
        : 3600;

      const tokenResponse: GoogleTokenResponse = {
        access_token: credentials.access_token,
        refresh_token: credentials.refresh_token || refreshToken,
        expires_in: expiresIn,
        token_type: 'Bearer',
      };

      this.logger.log('Access token refreshed successfully');
      return tokenResponse;
    } catch (error) {
      this.logger.error('Failed to refresh access token', error);

      if (error.message?.includes('invalid_grant')) {
        throw new Error(
          'Refresh token is invalid or expired. Re-authentication required.',
        );
      }

      if (error.message?.includes('invalid_request')) {
        throw new Error('Invalid refresh token format');
      }

      if (error.message?.includes('invalid_client')) {
        throw new Error('Invalid client credentials');
      }

      throw new Error(`Token refresh failed: ${error.message}`);
    }
  }

  async validateToken(accessToken: string): Promise<boolean> {
    if (!this.oauth2Client) {
      this.logger.warn('OAuth2 client not initialized for token validation');
      return false;
    }

    try {
      this.oauth2Client.setCredentials({ access_token: accessToken });
      const tokenInfo = await this.oauth2Client.getTokenInfo(accessToken);
      return tokenInfo && tokenInfo.expiry_date > Date.now();
    } catch (error) {
      this.logger.warn('Token validation failed', error);
      return false;
    }
  }

  setCredentials(accessToken: string, refreshToken?: string): void {
    if (!this.oauth2Client) {
      throw new Error('OAuth2 client not initialized');
    }

    this.oauth2Client.setCredentials({
      access_token: accessToken,
      refresh_token: refreshToken,
    });
  }

  getAuthClient() {
    if (!this.oauth2Client) {
      throw new Error('OAuth2 client not initialized');
    }
    return this.oauth2Client;
  }

  async getUserMerchantAccounts(accessToken: string): Promise<AuthInfo> {
    if (!this.oauth2Client) {
      throw new Error('OAuth2 client not initialized');
    }

    this.setCredentials(accessToken);
    const content = google.content({
      version: 'v2.1',
      auth: this.oauth2Client,
    });

    try {
      const response = await content.accounts.authinfo();
      return response.data as AuthInfo;
    } catch (error) {
      this.logger.error('Failed to get merchant account info:', error);
      throw new Error(`Failed to get merchant account info: ${error.message}`);
    }
  }

  async getMerchantAccountDetails(
    accessToken: string,
    merchantId: string,
  ): Promise<MerchantAccount[]> {
    if (!this.oauth2Client) {
      throw new Error('OAuth2 client not initialized');
    }

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
      this.logger.error('Failed to fetch merchant account details:', error);
      return [];
    }
  }

  async getSingleMerchantAccount(
    accessToken: string,
    merchantId: string,
  ): Promise<MerchantAccount | null> {
    if (!this.oauth2Client) {
      throw new Error('OAuth2 client not initialized');
    }

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
      this.logger.error('Failed to get merchant account:', error);
      return null;
    }
  }

  async getUserInfo(accessToken: string): Promise<any> {
    if (!this.oauth2Client) {
      throw new Error('OAuth2 client not initialized');
    }

    this.setCredentials(accessToken);
    const authClient = this.getAuthClient();

    try {
      const oauth2 = google.oauth2({ version: 'v2', auth: authClient });
      const response = await oauth2.userinfo.get();
      return response.data;
    } catch (error) {
      this.logger.error('Failed to get user info:', error);
      throw new Error(`Failed to get user info: ${error.message}`);
    }
  }

  // إضافة method للتحقق من حالة التهيئة
  isInitialized(): boolean {
    return !!this.oauth2Client;
  }

  // إضافة method لإعادة التهيئة في حالة الحاجة
  reinitialize(): void {
    const clientId = this.configService.get('GOOGLE_CLIENT_ID');
    const clientSecret = this.configService.get('GOOGLE_CLIENT_SECRET');
    const redirectUri = this.configService.get('GOOGLE_REDIRECT_URI');

    if (!clientId || !clientSecret || !redirectUri) {
      throw new Error(
        'Missing Google OAuth configuration for reinitialization',
      );
    }

    this.oauth2Client = new google.auth.OAuth2(
      clientId,
      clientSecret,
      redirectUri,
    );

    this.oauth2Client.on('tokens', (tokens) => {
      this.logger.log('New tokens received from Google (reinit)');
      if (tokens.refresh_token) {
        this.logger.log('New refresh token received (reinit)');
      }
    });

    this.logger.log('Google OAuth2 client reinitialized successfully');
  }
}
