import { Injectable } from '@nestjs/common';
import { CatalogIntegrationRepository } from 'src/modules/catalog-integration/domain/repositories/catalog-integration.repository';
import { GetMetaIntegrationUseCase } from './get-meta-integration.use-case';
import { MetaCatalogService } from 'src/modules/catalog-integration/infrastructure/external-services/meta/meta-catalog.service';
import { CreateMetaCatalogDto } from 'src/modules/catalog-integration/presentation/dto/create-meta-catalog.dto';
import { BadRequestDomainException } from 'src/shared/domain/exceptions/bad-request-domain.exception';
import { UpdateMetaCatalogDto } from 'src/modules/catalog-integration/presentation/dto/update-meta-catalog.dto';

@Injectable()
export class UpdateMetaCatalogUseCase {
  constructor(
    private readonly metaCatalogService: MetaCatalogService,
    private readonly getMetaIntegrationUseCase: GetMetaIntegrationUseCase,
  ) {}

  async execute(
    tenantId: string,
    catalogId: string,
    catalogData: UpdateMetaCatalogDto,
  ) {
    if (!catalogId || catalogId.trim() === '') {
      throw new BadRequestDomainException('Catalog ID is required');
    }

    if (!catalogData || Object.keys(catalogData).length === 0) {
      throw new BadRequestDomainException('Update data is required');
    }

    const integration = await this.getMetaIntegrationUseCase.execute({
      tenantId,
    });

    if (!integration || !integration.isActive()) {
      throw new BadRequestDomainException('Meta integration is not active');
    }

    try {
      const existingCatalogs = await this.metaCatalogService.getCatalogs(
        integration.accessToken,
      );

      if (
        !existingCatalogs ||
        existingCatalogs.length < 1 ||
        !existingCatalogs.map((catalog) => catalog.id).includes(catalogId)
      ) {
        throw new BadRequestDomainException(`Catalog not found`);
      }

      return await this.metaCatalogService.updateCatalog(
        integration.accessToken,
        catalogId,
        catalogData,
      );
    } catch (error) {
      console.error('Error in UpdateMetaCatalogUseCase:', error);
      if (error instanceof BadRequestDomainException) {
        throw error;
      }
      throw new BadRequestDomainException(
        `Failed to process catalog updating: ${error.message}`,
      );
    }
  }
}
