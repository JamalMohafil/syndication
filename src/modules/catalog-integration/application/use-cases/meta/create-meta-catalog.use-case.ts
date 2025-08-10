import { Injectable } from '@nestjs/common';
import { CatalogIntegrationRepository } from 'src/modules/catalog-integration/domain/repositories/catalog-integration.repository';
import { GetMetaIntegrationUseCase } from './get-meta-integration.use-case';
import { MetaCatalogService } from 'src/modules/catalog-integration/infrastructure/external-services/meta/meta-catalog.service';
import { CreateMetaCatalogDto } from 'src/modules/catalog-integration/presentation/dto/create-meta-catalog.dto';
import { BadRequestDomainException } from 'src/shared/domain/exceptions/bad-request-domain.exception';

@Injectable()
export class CreateMetaCatalogUseCase {
  constructor(
    private readonly metaCatalogService: MetaCatalogService,
    private readonly getMetaIntegrationUseCase: GetMetaIntegrationUseCase,
  ) {}

  async execute(
    tenantId: string,
    businessId: string,
    catalogData: CreateMetaCatalogDto,
  ) {
    const integration = await this.getMetaIntegrationUseCase.execute({
      tenantId,
    });

    if (!integration || !integration.isActive()) {
      throw new BadRequestDomainException('Meta integration is not active');
    }

    try {
      const existingCatalogs = await this.metaCatalogService.getCatalogs(
        integration.accessToken,
        businessId,
      );

      if (!existingCatalogs || existingCatalogs.length === 0) {
        throw new BadRequestDomainException(
          `You must create your first catalog directly from Facebook Business Manager for business ${businessId}`,
        );
      }

      return await this.metaCatalogService.createCatalog(
        businessId,
        catalogData,
        integration.accessToken,
      );
    } catch (error) {
      console.error('Error in CreateMetaCatalogUseCase:', error);
      if (error instanceof BadRequestDomainException) {
        throw error;
      }
      throw new BadRequestDomainException(
        `Failed to process catalog creation: ${error.message}`,
      );
    }
  }
}
