import { Injectable } from '@nestjs/common';
import { PlatformType } from '../../../domain/enums/platform-type.enum';
import { BadRequestDomainException } from 'src/shared/domain/exceptions/bad-request-domain.exception';
import { GoogleOAuthService } from 'src/modules/catalog-integration/infrastructure/external-services/google/google-oauth.service';
import { MetaOAuthService } from 'src/modules/catalog-integration/infrastructure/external-services/meta/meta-oauth.service';

export interface GenerateAuthUrlRequest {
  platform: PlatformType;
  tenantId: string;
}

export interface GenerateAuthUrlResponse {
  authUrl: string;
  platform: PlatformType;
  scopes: string[];
}

@Injectable()
export class GenerateAuthUrlUseCase {
  constructor(
    private readonly googleOAuthProvider: GoogleOAuthService,
    private readonly metaOAuthProvider: MetaOAuthService,
  ) {}

  async execute(
    request: GenerateAuthUrlRequest,
  ): Promise<GenerateAuthUrlResponse> {
    const { platform, tenantId } = request;

    switch (platform) {
      case PlatformType.GOOGLE:
        return this.generateGoogleAuthUrl(tenantId);
      case PlatformType.META:
        return this.generateMetaAuthUrl(tenantId);
      default:
        throw new BadRequestDomainException(
          `Unsupported platform: ${platform}`,
        );
    }
  }

  private generateGoogleAuthUrl(tenantId: string): GenerateAuthUrlResponse {
    const scopes = [
      'https://www.googleapis.com/auth/content',
      'https://www.googleapis.com/auth/userinfo.email',
    ];

    const authUrl = this.googleOAuthProvider.generateAuthUrl(scopes, tenantId);

    return {
      authUrl,
      platform: PlatformType.GOOGLE,
      scopes,
    };
  }

  private generateMetaAuthUrl(tenantId: string): GenerateAuthUrlResponse {
    const scopes = [
      'catalog_management',
      'business_management',
      'ads_management',
    ];

    const authUrl = this.metaOAuthProvider.generateAuthUrl(scopes, tenantId);

    return {
      authUrl,
      platform: PlatformType.META,
      scopes,
    };
  }
}
