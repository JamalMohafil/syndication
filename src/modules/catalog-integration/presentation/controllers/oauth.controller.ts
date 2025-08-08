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
  Inject,
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
import { GoogleMerchantService } from '../../infrastructure/external-services/google/google-merchant.service';
import { GenerateAuthUrlUseCase } from '../../application/use-cases/auth/generate-auth-url.use-case';
import { GetMerchantAccountsUseCase } from '../../application/use-cases/google/get-merchant-accounts.use-case';
import { SetupMerchantAccountUseCase } from '../../application/use-cases/google/setup-merchant-account.use-case';
import { HandleOAuthCallbackUseCase } from '../../application/use-cases/auth/handle-oauth-callback.use-case';
import { ConnectPlatformUseCase } from '../../application/use-cases/auth/connect-platform.use-case';
import { TestConnectionUseCase } from '../../application/use-cases/auth/test-connection.use-case';
import appConfig from 'src/shared/infrastructure/config/app.config';
import { ConfigType } from '@nestjs/config';
import { repl } from '@nestjs/core';

@ApiTags('OAuth Authentication')
@Controller('oauth')
export class OAuthController {
  constructor(
    private readonly getAuthUrlUseCase: GenerateAuthUrlUseCase,
    private readonly getGoogleMerchantAccountsUseCase: GetMerchantAccountsUseCase,
    private readonly setupMerchantAccountUseCase: SetupMerchantAccountUseCase,
    private readonly handleOAuthCallbackUseCase: HandleOAuthCallbackUseCase,
    private readonly connectPlatformUseCase: ConnectPlatformUseCase,
    private readonly testConnectionUseCase: TestConnectionUseCase,
    @Inject(appConfig.KEY)
    private readonly config: ConfigType<typeof appConfig>,
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
    const response = await this.getAuthUrlUseCase.execute({
      platform: platform.toUpperCase() as PlatformType,
      tenantId,
    });

    return {
      authUrl: response.authUrl,
      platform: response.platform,
      scopes: response.scopes,
    };
  }

  @Get('google/merchant-accounts')
  @ApiOperation({
    summary: 'Get available merchant accounts',
    description: 'Get all merchant accounts the user has access to',
  })
  @ApiBearerAuth()
  @UseGuards(TenantAuthGuard)
  async getGoogleMerchantAccounts(@Req() req: FastifyRequest) {
    const tenantId = (req as any).tenantId;

    const response = await this.getGoogleMerchantAccountsUseCase.execute({
      tenantId,
    });
    return {
      merchantAccounts: response,
      hasAccess: response.length > 0,
    };
  }

  @Post('google/setup-merchant')
  @ApiOperation({
    summary: 'Setup Google Merchant Center account',
    description: 'Configure the merchant center account to use for shopping',
  })
  async setupGoogleMerchant(
    @Body() body: { merchantId: string },
    @Req() req: FastifyRequest,
  ) {
    const tenantId = (req as any).tenantId;

    const result = await this.setupMerchantAccountUseCase.execute({
      tenantId,
      merchantId: body.merchantId,
    });

    return {
      success: true,
      integration: this.mapToResponseDto(result.integration),
      accountInfo: result.accountInfo,
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
    @Res() reply: FastifyReply,
  ) {
    const platformType = platform.toUpperCase() as PlatformType;
    const frontendUrl = this.config.frontendUrl || 'http://localhost:3000';
    const result = await this.handleOAuthCallbackUseCase.execute({
      platform: platformType,
      code,
      tenantId,
      error,
    });
    console.log(result, 'result');
    if (!result.success) {
      return reply.redirect(
        `${frontendUrl}/integrations/error?message=${encodeURIComponent(
          result.errorMessage || 'Unknown error',
        )}`,
        401,
      );
    }

    return reply.redirect(
      `${frontendUrl}/integrations/success?platform=${platform.toLowerCase()}&id=${result.integrationId}`,
    );
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

    const integration = await this.connectPlatformUseCase.execute({
      tenantId,
      platform: connectDto.platform,
      authCode: connectDto.authCode,
    });

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

    const result = await this.testConnectionUseCase.execute({
      tenantId,
      platform: platformType,
    });

    return {
      success: result.isConnected,
      message: result.message,
      accountInfo: result.details,
    };
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
