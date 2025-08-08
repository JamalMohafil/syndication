import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { FastifyRequest } from 'fastify';
import { PlatformType } from '../../domain/enums/platform-type.enum';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { NotFoundDomainException } from 'src/shared/domain/exceptions/not-found-domain.exception';
import { MetaOAuthService } from '../../infrastructure/external-services/meta/meta-oauth.service';
import { CatalogIntegrationService } from '../../application/services/catalog-integration.service';
import { TenantAuthGuard } from '../../infrastructure/guards/tenant-auth.guard';

@ApiTags('Meta Integration')
@Controller('meta')
@ApiBearerAuth()
@UseGuards(TenantAuthGuard)
export class MetaIntegrationController {
  constructor(
    private readonly catalogIntegrationService: CatalogIntegrationService,
    private readonly metaOAuthService: MetaOAuthService,
  ) {}

  @Get('business/accounts')
  @ApiOperation({
    summary: 'Get Meta Business accounts',
    description: 'Retrieve available Meta Business accounts.',
  })
  async getBusinessAccounts(@Req() req: FastifyRequest) {
    const tenantId = (req as any).tenantId;
    const integration = await this.getMetaIntegration(tenantId);

    return await this.metaOAuthService.getBusinessAccounts(
      integration.accessToken,
    );
  }

  @Get('catalogs')
  @ApiOperation({
    summary: 'Get Meta product catalogs',
    description: 'Retrieve product catalogs from Meta Business.',
  })
  async getCatalogs(@Req() req: FastifyRequest) {
    const tenantId = (req as any).tenantId;
    const integration = await this.getMetaIntegration(tenantId);

    // Implement Meta catalog service method
    return { message: 'Meta catalogs endpoint - implement MetaCatalogService' };
  }

  private async getMetaIntegration(tenantId: string) {
    const integrations =
      await this.catalogIntegrationService.getTenantIntegrations(tenantId);
    const metaIntegration = integrations.find(
      (int) => int.platform === PlatformType.META,
    );

    if (!metaIntegration) {
      throw new NotFoundDomainException('Meta integration not found');
    }

    return metaIntegration;
  }
}
