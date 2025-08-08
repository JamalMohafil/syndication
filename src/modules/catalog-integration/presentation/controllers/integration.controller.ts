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
  HttpException,
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
import { GetIntergrationsUseCase } from '../../application/use-cases/integration/get-integrations.use-case';
import { GetPlatformIntegrationUseCase } from '../../application/use-cases/integration/get-platform-integration.use-case';
import { DisconnectIntegrationUseCase } from '../../application/use-cases/integration/disconnect-integration.use-case';
import { GetIntegrationSummaryUseCase } from '../../application/use-cases/integration/get-integration-summary.use-case';
import { RefreshExpiredTokensUseCase } from '../../application/use-cases/integration/refresh-expired-tokens.use-case';

@ApiTags('Integration Management')
@Controller('integrations')
@ApiBearerAuth()
@UseGuards(TenantAuthGuard)
export class IntegrationController {
  constructor(
    private readonly getIntergrationsUseCase: GetIntergrationsUseCase,
    private readonly getPlatformIntegrationUseCase: GetPlatformIntegrationUseCase,
    private readonly disconnectIntegrationUseCase: DisconnectIntegrationUseCase,
    private readonly getIntegrationSummaryUseCase: GetIntegrationSummaryUseCase,
    private readonly refreshExpiredTokensUseCase: RefreshExpiredTokensUseCase,
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
    const res = await this.getIntergrationsUseCase.execute({ tenantId });
    return res.map((integration) => this.mapToResponseDto(integration));
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

    const res = await this.getPlatformIntegrationUseCase.execute({
      tenantId,
      platform: platformType,
    });

    return this.mapToResponseDto(res);
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
  ): Promise<any> {
    const tenantId = (req as any).tenantId;
    const platformType = platform.toUpperCase() as PlatformType;
    await this.disconnectIntegrationUseCase.execute({
      tenantId,
      platform: platformType,
    });
    return new HttpException(
      'Platform integration disconnected',
      HttpStatus.CREATED,
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
    return await this.getIntegrationSummaryUseCase.execute({
      tenantId: (req as any).tenantId,
    });
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
    return await this.refreshExpiredTokensUseCase.execute();
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
