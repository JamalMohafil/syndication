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
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { FastifyRequest } from 'fastify';
import { TenantAuthGuard } from '../../infrastructure/guards/tenant-auth.guard';
import { CatalogIntegrationService } from '../../application/services/catalog-integration.service';
import { PlatformType } from '../../domain/enums/platform-type.enum';
import { IntegrationResponseDto } from '../responses/integration.response';
import { IntegrationSummaryDto } from '../dto/integration-summary.dto';
import { PlatformStatusDto } from '../dto/platform-status.dto';
import { NotFoundDomainException } from 'src/shared/domain/exceptions/not-found-domain.exception';

@ApiTags('Integration Management')
@Controller('integrations')
@ApiBearerAuth()
@UseGuards(TenantAuthGuard)
export class IntegrationController {
  constructor(
    private readonly catalogIntegrationService: CatalogIntegrationService,
  ) {}

  @Get()
  @ApiOperation({
    summary: 'Get all tenant integrations',
    description:
      'Retrieve all platform integrations for the authenticated tenant.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Integrations retrieved successfully',
    type: [IntegrationResponseDto],
  })
  async getTenantIntegrations(
    @Req() req: FastifyRequest,
  ): Promise<IntegrationResponseDto[]> {
    const tenantId = (req as any).tenantId;
    const integrations =
      await this.catalogIntegrationService.getTenantIntegrations(tenantId);

    return integrations.map((integration) =>
      this.mapToResponseDto(integration),
    );
  }

  @Get(':platform')
  @ApiOperation({
    summary: 'Get specific platform integration',
    description: 'Retrieve integration details for a specific platform.',
  })
  @ApiParam({
    name: 'platform',
    enum: PlatformType,
    description: 'Platform type',
    example: PlatformType.GOOGLE,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Integration retrieved successfully',
    type: IntegrationResponseDto,
  })
  async getPlatformIntegration(
    @Param('platform') platform: string,
    @Req() req: FastifyRequest,
  ): Promise<IntegrationResponseDto> {
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

    return this.mapToResponseDto(integration);
  }

  @Delete(':platform')
  @ApiOperation({
    summary: 'Disconnect platform integration',
    description:
      'Disconnect and deactivate the specified platform integration.',
  })
  @ApiParam({
    name: 'platform',
    enum: PlatformType,
    description: 'Platform to disconnect',
    example: PlatformType.GOOGLE,
  })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: 'Integration disconnected successfully',
  })
  async disconnectIntegration(
    @Param('platform') platform: string,
    @Req() req: FastifyRequest,
  ): Promise<void> {
    const tenantId = (req as any).tenantId;
    const platformType = platform.toUpperCase() as PlatformType;

    await this.catalogIntegrationService.disconnectIntegration(
      tenantId,
      platformType,
    );
  }

  @Get('status/summary')
  @ApiOperation({
    summary: 'Get integration status summary',
    description:
      'Get a summary of all platform integration statuses for the tenant.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Integration status retrieved successfully',
    type: IntegrationSummaryDto,
  })
  async getIntegrationStatus(
    @Req() req: FastifyRequest,
  ): Promise<IntegrationSummaryDto> {
    const tenantId = (req as any).tenantId;
    const integrations =
      await this.catalogIntegrationService.getTenantIntegrations(tenantId);

    const platforms: PlatformStatusDto[] = Object.values(PlatformType).map(
      (platform) => {
        const integration = integrations.find(
          (int) => int.platform === platform,
        );
        return {
          platform: platform as PlatformType,
          connected: !!integration,
          status: integration?.status || 'NOT_CONNECTED',
          tokenExpired: integration?.isTokenExpired() || false,
          lastSync: integration?.updatedAt,
        };
      },
    );

    const nextTokenRefresh = integrations
      .filter((int) => int.tokenExpiresAt)
      .sort(
        (a, b) =>
          (a.tokenExpiresAt?.getTime() || 0) -
          (b.tokenExpiresAt?.getTime() || 0),
      )[0]?.tokenExpiresAt;

    return {
      totalIntegrations: integrations.length,
      activeIntegrations: integrations.filter(
        (int) => int.status === 'CONNECTED',
      ).length,
      platforms,
      nextTokenRefresh,
    };
  }

  @Post('refresh-tokens')
  @ApiOperation({
    summary: 'Refresh expired tokens',
    description: 'Refresh expired access tokens for all integrations.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Token refresh completed',
  })
  async refreshTokens() {
    await this.catalogIntegrationService.refreshExpiredTokens();
    return { message: 'Token refresh completed' };
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
