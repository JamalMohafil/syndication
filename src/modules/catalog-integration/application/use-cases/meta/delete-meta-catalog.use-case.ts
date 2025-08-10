import { Injectable } from '@nestjs/common';
import { CatalogIntegrationRepository } from 'src/modules/catalog-integration/domain/repositories/catalog-integration.repository';
import { GetMetaIntegrationUseCase } from './get-meta-integration.use-case';
import { MetaCatalogService } from 'src/modules/catalog-integration/infrastructure/external-services/meta/meta-catalog.service';
import { CreateMetaCatalogDto } from 'src/modules/catalog-integration/presentation/dto/create-meta-catalog.dto';
import { BadRequestDomainException } from 'src/shared/domain/exceptions/bad-request-domain.exception';

@Injectable()
export class DeleteMetaCatalogUseCase {
  constructor(
    private readonly metaCatalogService: MetaCatalogService,
    private readonly getMetaIntegrationUseCase: GetMetaIntegrationUseCase,
  ) {}

  async execute(catalogId: string, tenantId: string) {
    if (!catalogId || catalogId.trim() === '') {
      throw new BadRequestDomainException('Catalog ID is required');
    }
    const integration = await this.getMetaIntegrationUseCase.execute({
      tenantId,
    });

    if (!integration || !integration.isActive()) {
      throw new BadRequestDomainException('Meta integration is not active');
    }

    try {
      const existingCatalogs = await this.metaCatalogService.checkCatalogExists(
        catalogId,
        integration.accessToken,
      );

      if (!existingCatalogs.exists) {
        throw new BadRequestDomainException(`Catalog not found`);
      }

      return await this.metaCatalogService.deleteCatalog(
        integration.accessToken,
        catalogId,
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
