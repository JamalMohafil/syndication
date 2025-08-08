import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Req,
  HttpStatus,
  UseGuards,
  Res,
  Query,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { Response } from 'express';
import { TenantAuthGuard } from '../../infrastructure/guards/tenant-auth.guard';
import { CatalogIntegrationService } from '../../application/services/catalog-integration.service';
import { PlatformType } from '../../domain/enums/platform-type.enum';
import { IntegrationResponseDto } from '../responses/integration.response';
import { IntegrationSummaryDto } from '../dto/integration-summary.dto';
import { PlatformStatusDto } from '../dto/platform-status.dto';
import { NotFoundDomainException } from 'src/shared/domain/exceptions/not-found-domain.exception';
import { GoogleOAuthService } from '../../infrastructure/external-services/google/google-oauth.service';
import { MetaOAuthService } from '../../infrastructure/external-services/meta/meta-oauth.service';
import { AuthUrlResponseDto } from '../responses/auth-url.response';
import { BadRequestDomainException } from 'src/shared/domain/exceptions/bad-request-domain.exception';
import { FastifyReply, FastifyRequest } from 'fastify';
import { ConnectIntegrationDto } from '../dto/connect-integration.dto';

@ApiTags('OAuth Authentication')
@Controller('oauth')
export class OAuthController {
  constructor(
    private readonly catalogIntegrationService: CatalogIntegrationService,
    private readonly googleOAuthService: GoogleOAuthService,
    private readonly metaOAuthService: MetaOAuthService,
  ) {}

  @Get('auth-url/:platform')
  @ApiOperation({
    summary: 'Get OAuth authorization URL',
    description:
      'Generate the OAuth URL to start the integration flow for the specified platform.',
  })
  @ApiParam({
    name: 'platform',
    enum: PlatformType,
    description: 'Platform to integrate with',
    example: PlatformType.GOOGLE,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Authorization URL generated successfully',
    type: AuthUrlResponseDto,
  })
  async getAuthUrl(
    @Param('platform') platform: string,
    @Query('tenantId') tenantId: string,
  ): Promise<AuthUrlResponseDto> {
    const platformType = platform.toUpperCase() as PlatformType;

    let authUrl: string;
    let scopes: string[];

    switch (platformType) {
      case PlatformType.GOOGLE:
        scopes = [
          'https://www.googleapis.com/auth/content',
          'https://www.googleapis.com/auth/userinfo.email',
        ];
        authUrl = this.googleOAuthService.generateAuthUrl(scopes, tenantId);
        break;
      case PlatformType.META:
        scopes = [
          'catalog_management',
          'business_management',
          'ads_management',
        ];
        authUrl = this.metaOAuthService.generateAuthUrl(scopes);
        break;
      default:
        throw new BadRequestDomainException(
          `Unsupported platform: ${platform}`,
        );
    }

    return {
      authUrl,
      platform: platformType,
      scopes,
    };
  }

  @Get('callback/:platform')
  @ApiOperation({
    summary: 'Handle OAuth callback',
    description: 'Handle the OAuth callback and redirect to frontend.',
  })
  @ApiParam({
    name: 'platform',
    enum: PlatformType,
    description: 'Platform callback',
  })
  async handleCallback(
    @Param('platform') platform: string,
    @Query('code') code: string,
    @Query('state') tenantId: string,
    @Query('error') error: string,
    @Res() reply: FastifyReply, // Use @Res() decorator to inject FastifyReply
  ) {
    const platformType = platform.toUpperCase() as PlatformType;
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';

    try {
      if (error) {
        return reply.redirect(
          `${frontendUrl}/integrations/error?message=${encodeURIComponent(error)}`,
        );
      }

      if (!code || !tenantId) {
        return reply.redirect(
          `${frontendUrl}/integrations/error?message=Missing authorization code or tenant ID`,
        );
      }

      let integration;

      switch (platformType) {
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
            `Unsupported platform: ${platformType}`,
          );
      }

      return reply.redirect(
        `${frontendUrl}/integrations/success?platform=${platformType.toLowerCase()}&id=${integration.id}`,
      );
    } catch (error) {
      console.error('OAuth callback error:', error);
      // Redirect to error page
      return reply.redirect(
        `${frontendUrl}/integrations/error?message=${encodeURIComponent(error.message)}`,
      );
    }
  }

  @Post('connect')
  @ApiOperation({
    summary: 'Connect platform integration manually',
    description:
      'Complete the OAuth flow manually by providing authorization code.',
  })
  @ApiBearerAuth()
  @UseGuards(TenantAuthGuard)
  async connectIntegration(
    @Body() connectDto: ConnectIntegrationDto,
    @Req() req: FastifyRequest,
  ): Promise<IntegrationResponseDto> {
    const tenantId = (req as any).tenantId;

    let integration;

    switch (connectDto.platform) {
      case PlatformType.GOOGLE:
        // Get tokens first using your service
        const googleTokens = await this.googleOAuthService.getTokensFromCode(
          connectDto.authCode,
        );
        integration =
          await this.catalogIntegrationService.connectGoogleIntegration(
            tenantId,
            connectDto.authCode,
            // googleTokens,
          );
        break;
      case PlatformType.META:
        integration =
          await this.catalogIntegrationService.connectMetaIntegration(
            tenantId,
            connectDto.authCode,
          );
        break;
      default:
        throw new BadRequestDomainException(
          `Unsupported platform: ${connectDto.platform}`,
        );
    }

    return this.mapToResponseDto(integration);
  }

  @Post('test-connection/:platform')
  @ApiOperation({
    summary: 'Test platform connection',
    description: 'Test the connection to verify credentials are valid.',
  })
  @ApiBearerAuth()
  @UseGuards(TenantAuthGuard)
  async testConnection(
    @Param('platform') platform: string,
    @Req() req: FastifyRequest,
  ) {
    const tenantId = (req as any).tenantId;
    const platformType = platform.toUpperCase() as PlatformType;

    const integrations =
      await this.catalogIntegrationService.getTenantIntegrations(tenantId);
    const integration = integrations.find(
      (int) => int.platform === platformType,
    );

    if (!integration) {
      throw new NotFoundDomainException(
        `Integration not found for platform: ${platform}`,
      );
    }

    try {
      let accountInfo: any = {};

      if (platformType === PlatformType.GOOGLE) {
        // Set credentials and test connection
        this.googleOAuthService.setCredentials(
          integration.accessToken,
          integration.refreshToken,
        );
        const authClient = this.googleOAuthService.getAuthClient();

        // Test by getting user info
        const { google } = require('googleapis');
        const oauth2 = google.oauth2({ version: 'v2', auth: authClient });
        const { data } = await oauth2.userinfo.get();

        accountInfo = {
          id: data.id,
          email: data.email,
          name: data.name,
        };
      } else if (platformType === PlatformType.META) {
        // Test Meta connection
        accountInfo = await this.metaOAuthService.getBusinessAccounts(
          integration.accessToken,
        );
      }

      return {
        success: true,
        message: 'Connection successful',
        accountInfo,
      };
    } catch (error) {
      throw new BadRequestDomainException(
        `Connection test failed: ${error.message}`,
      );
    }
  }

  private mapToResponseDto(integration: any): IntegrationResponseDto {
    return {
      id: integration.id || '',
      tenantId: integration.tenantId,
      platform: integration.platform,
      externalId: integration.externalId,
      status: integration.status,
      tokenExpiresAt: integration.tokenExpiresAt,
      platformConfigs: integration.platformConfigs,
      createdAt: integration.createdAt || new Date(),
      updatedAt: integration.updatedAt || new Date(),
    };
  }
}
