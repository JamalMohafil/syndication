import { Injectable } from '@nestjs/common';
import { MetaCatalogService } from 'src/modules/catalog-integration/infrastructure/external-services/meta/meta-catalog.service';
import { CreateProductDto } from 'src/modules/catalog-integration/presentation/dto/create-meta-product.dto';
import { GetMetaIntegrationUseCase } from './get-meta-integration.use-case';
import { BadRequestDomainException } from 'src/shared/domain/exceptions/bad-request-domain.exception';

@Injectable()
export class CreateMetaProductUseCase {
  constructor(
    private readonly metaCatalogService: MetaCatalogService,
    private readonly getMetaIntegrationUseCase: GetMetaIntegrationUseCase,
  ) {}

  async execute(
    tenantId: string,
    catalogId: string,
    productData: CreateProductDto,
  ) {
    const integration = await this.getMetaIntegrationUseCase.execute({
      tenantId,
    });

    if (!integration || !integration.isActive()) {
      throw new BadRequestDomainException('Meta integration is not active');
    }
    const existing: any = await this.metaCatalogService.checkProductExists(
      catalogId,
      productData.retailer_id,
      integration.accessToken,
    );

    console.log(existing.data);

    return true;
  }
}
