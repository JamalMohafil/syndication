import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { FastifyRequest } from 'fastify';
import { PlatformType } from '../../domain/enums/platform-type.enum';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { NotFoundDomainException } from 'src/shared/domain/exceptions/not-found-domain.exception';
import { MetaOAuthService } from '../../infrastructure/external-services/meta/meta-oauth.service';
import { CatalogIntegrationService } from '../../application/services/catalog-integration.service';
import { TenantAuthGuard } from '../../infrastructure/guards/tenant-auth.guard';
import { GetBusinessAccountsUseCase } from '../../application/use-cases/meta/get-business-accounts.use-case';
import { GetMetaIntegrationUseCase } from '../../application/use-cases/meta/get-meta-integration.use-case';
import { GetMetaCatalogsUseCase } from '../../application/use-cases/meta/get-meta-catalogs.use-case';
export const META_ACCESS_TOKEN =
  'EAAfJpu74DtkBPGouLZAzkhDD3WhTGZCCOn0ido8xOvCgvhMkRgaAMjg5XrUHCeNBUY6jk7ZAO331lPR32qhvyLbAKCBSYtNLecdX8AJqFSqbScUY5d3t357oRNEzVu6oeLoH8ajKsaJm01bijkakFAnmc7SjMZCWE6D9tuxjwjzkB419uD6uZCPV0eFn6gIMOCpvMrKFMeqdrqQXhBqeHErGPnT1c0hQFpbEM';
@ApiTags('Meta Integration')
// EAAfJpu74DtkBPJ1vArMEVfi1bACHIjPuQaDBKOMtZAsSPMqs69TIh8KZBL4tutBrxDZASPtY4josF6KFLyJQC7su72uem37riZC5r2ZB9hBuBrPS0taDoiSF29nTntvpdlZCLhHtijgDW9syrIclDX8ZAq2QwAsGDA27QtbgRMxWv6caxnDNFj25t2z5ubILYjsVvYgHPM0LUZAA8pgttalk8HC3gKT5BJLxZAQZDZD
@Controller('meta')
@ApiBearerAuth()
@UseGuards(TenantAuthGuard)
export class MetaIntegrationController {
  constructor(
    private readonly getBusinessAccountsUseCase: GetBusinessAccountsUseCase,
    private readonly getMetaIntegrationUseCase: GetMetaIntegrationUseCase,
    private readonly getMetaCatalogsUseCase: GetMetaCatalogsUseCase,
  ) {}

  @Get('business/accounts')
  @ApiOperation({
    summary: 'Get Meta Business accounts',
    description: 'Retrieve available Meta Business accounts.',
  })
  async getBusinessAccounts(@Req() req: FastifyRequest) {
    const tenantId = (req as any).tenantId;
    console.log(tenantId)
    const res = await this.getBusinessAccountsUseCase.execute({
      tenantId,
    });
    return res;
  }

  @Get('catalogs')
  @ApiOperation({
    summary: 'Get Meta product catalogs',
    description: 'Retrieve product catalogs from Meta Business.',
  })
  async getCatalogs(@Req() req: FastifyRequest) {
    const tenantId = (req as any).tenantId;

    const res = await this.getMetaCatalogsUseCase.execute({ tenantId });

    return { message: 'Meta catalogs endpoint - بدنا نعمل MetaCatalogService' };
  }

  private async getMetaIntegration(tenantId: string) {
    const res = await this.getMetaIntegrationUseCase.execute({ tenantId });

    return res;
  }
}
