import { Injectable } from '@nestjs/common';
import { PlatformType } from '../../../domain/enums/platform-type.enum';
 import { BadRequestDomainException } from 'src/shared/domain/exceptions/bad-request-domain.exception';
import { CatalogIntegrationService } from '../../services/catalog-integration.service';

export interface HandleOAuthCallbackRequest {
  platform: PlatformType;
  code: string;
  tenantId: string;
  error?: string;
}

export interface HandleOAuthCallbackResponse {
  success: boolean;
  integrationId?: string;
  errorMessage?: string;
}

@Injectable()
export class HandleOAuthCallbackUseCase {
  constructor(
    private readonly catalogIntegrationService: CatalogIntegrationService,
  ) {}

  async execute(
    request: HandleOAuthCallbackRequest,
  ): Promise<HandleOAuthCallbackResponse> {
    const { platform, code, tenantId, error } = request;

    if (error) {
      return {
        success: false,
        errorMessage: error,
      };
    }

    if (!code || !tenantId) {
      return {
        success: false,
        errorMessage: 'Missing authorization code or tenant ID',
      };
    }

    try {
      let integration;

      switch (platform) {
        case PlatformType.GOOGLE:
          integration =
            await this.catalogIntegrationService.connectGoogleIntegration(
              tenantId,
              code,
            );
          break;
        case PlatformType.META:
          integration =
            await this.catalogIntegrationService.connectMetaIntegration(
              tenantId,
              code,
            );
          break;
        default:
          throw new BadRequestDomainException(
            `Unsupported platform: ${platform}`,
          );
      }

      return {
        success: true,
        integrationId: integration.id,
      };
    } catch (err) {
      return {
        success: false,
        errorMessage: err.message,
      };
    }
  }
}
